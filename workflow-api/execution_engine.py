"""
PulseDeck Execution Engine — Thread-Pool Edition
=================================================
Key upgrades:
  • run_graph_async() accepts an external ThreadPoolExecutor (shared with FastAPI)
    so we never spin up uncontrolled threads.
  • Independent branches of the DAG run CONCURRENTLY via submit() on the pool.
  • All DB writes are protected by a per-execution threading.Lock so concurrent
    branch updates don't corrupt the logs / nodeResults.
  • File-processing step stubs are included (file_upload, file_read, etc.)
"""

import time
import threading
import requests
import re
import json
import os
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from typing import Optional
from database import get_execution, save_execution


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ts() -> str:
    return time.strftime("%H:%M:%S")


def resolve_variables(text: str, context: dict) -> str:
    """Replace {{node_id.key}} or {{global_param_name}} with real values."""
    if not isinstance(text, str):
        return text

    def replacer(match):
        path = match.group(1).strip()
        parts = path.split(".")
        current = context
        try:
            for part in parts:
                current = current.get(part, "") if isinstance(current, dict) else ""
            return str(current) if current is not None else ""
        except Exception:
            return match.group(0)

    return re.sub(r"\{\{(.*?)\}\}", replacer, text)


def evaluate_condition(config: dict, context: dict) -> bool:
    op1 = resolve_variables(str(config.get("operand1", "")), context)
    op2 = resolve_variables(str(config.get("operand2", "")), context)
    operator = config.get("operator", "==")
    try:
        if operator == "==":      return op1 == op2
        if operator == "!=":      return op1 != op2
        if operator == ">":       return float(op1) > float(op2)
        if operator == "<":       return float(op1) < float(op2)
        if operator == "contains": return op2 in op1
    except ValueError:
        pass
    return False


def execute_http_request(config: dict, context: dict) -> dict:
    url = resolve_variables(config.get("url", ""), context)
    method = config.get("method", "GET").upper()
    headers_str = resolve_variables(config.get("headers", "{}"), context)
    body_str = resolve_variables(config.get("body", ""), context)

    headers = {}
    try:
        if headers_str.strip():
            headers = json.loads(headers_str)
    except Exception:
        pass

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            data = None
            try:
                data = json.loads(body_str) if body_str else None
            except Exception:
                data = body_str
            if isinstance(data, dict):
                resp = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                resp = requests.post(url, headers=headers, data=data, timeout=10)
        else:
            resp = requests.request(method, url, headers=headers, data=body_str, timeout=10)
        return {"status_code": resp.status_code, "response": resp.text}
    except Exception as e:
        raise RuntimeError(f"HTTP Error: {e}") from e


# ── File-processing stubs ─────────────────────────────────────────────────────
# These simulate real file operations; replace with actual logic as needed.

def execute_file_step(step_type: str, config: dict, context: dict) -> dict:
    src = resolve_variables(config.get("source", ""), context)
    dst = resolve_variables(config.get("destination", ""), context)
    time.sleep(0.1)  # simulate I/O

    if step_type == "file_upload":
        return {"status": "uploaded", "source": src, "bytes": len(src) * 10}
    if step_type == "file_read":
        # In production: open(src).read()
        return {"status": "read", "path": src, "content_preview": "<file content>"}
    if step_type == "file_write":
        return {"status": "written", "path": dst}
    if step_type == "file_convert":
        fmt = config.get("format", "csv")
        return {"status": "converted", "format": fmt, "output": dst}
    if step_type == "file_parse":
        fmt = config.get("format", "csv")
        return {"status": "parsed", "format": fmt, "rows": 42}
    if step_type == "file_compress":
        return {"status": "compressed", "archive": dst, "ratio": "68%"}
    if step_type == "file_merge":
        inputs = config.get("inputs", [])
        return {"status": "merged", "files": len(inputs), "output": dst}
    if step_type == "file_split":
        parts = int(config.get("parts", 2))
        return {"status": "split", "parts": parts}
    if step_type == "file_delete":
        return {"status": "deleted", "path": src}
    if step_type == "ftp_transfer":
        return {"status": "transferred", "host": config.get("host"), "path": src}
    if step_type in ("s3_upload", "s3_download"):
        return {"status": step_type.replace("s3_", ""), "bucket": config.get("bucket"), "key": config.get("key")}
    return {"status": "ok"}


# ── Core node execution (runs inside a worker thread) ─────────────────────────

def _execute_node(
    node: dict,
    context: dict,
    context_lock: threading.Lock,
    global_params: dict,
) -> tuple[str, dict, bool]:
    """
    Execute a single node.
    Returns (node_id, node_result, success).
    context is READ-ONLY here; writes go through context_lock in the caller.
    """
    node_id = node["id"]
    label = node.get("data", {}).get("label", node_id)
    step_type = node.get("data", {}).get("stepType", "unknown")
    raw_config = node.get("data", {}).get("config", {})

    node_result = {"status": "success", "output": {}}
    success = True

    try:
        if step_type == "start":
            node_result["output"] = {"message": "Started"}

        elif step_type == "set_variable":
            with context_lock:
                k = resolve_variables(raw_config.get("key", ""), context)
                v = resolve_variables(raw_config.get("value", ""), context)
            node_result["output"] = {k: v}
            with context_lock:
                context[k] = v

        elif step_type == "http_request":
            with context_lock:
                ctx_snapshot = dict(context)
            node_result["output"] = execute_http_request(raw_config, ctx_snapshot)

        elif step_type == "condition":
            with context_lock:
                ctx_snapshot = dict(context)
            res = evaluate_condition(raw_config, ctx_snapshot)
            node_result["output"] = {"result": res}

        elif step_type == "webhook":
            with context_lock:
                node_result["output"] = dict(context.get("trigger", {}))

        elif step_type == "delay":
            with context_lock:
                ctx_snapshot = dict(context)
            delay_sec = float(resolve_variables(str(raw_config.get("seconds", 1)), ctx_snapshot))
            time.sleep(delay_sec)
            node_result["output"] = {"delayed_for": delay_sec}

        elif step_type in (
            "file_upload", "file_read", "file_write", "file_convert",
            "file_parse", "file_compress", "file_merge", "file_split",
            "file_delete", "ftp_transfer", "s3_upload", "s3_download",
        ):
            with context_lock:
                ctx_snapshot = dict(context)
            node_result["output"] = execute_file_step(step_type, raw_config, ctx_snapshot)

        elif step_type == "db_query":
            time.sleep(0.1)
            node_result["output"] = {"rows": [], "affected": 0}

        else:
            # Generic stub
            time.sleep(0.3)
            node_result["output"] = {"message": f"Simulated {step_type}"}

    except Exception as e:
        success = False
        node_result["status"] = "failed"
        node_result["output"] = {"error": str(e)}

    return node_id, node_result, success


# ── Graph executor (runs in one pool thread; dispatches branches in parallel) ──

def _execute_graph(
    exec_id: str,
    nodes: list,
    edges: list,
    global_params: dict,
    trigger_payload: Optional[dict],
    pool: ThreadPoolExecutor,
):
    execution = get_execution(exec_id)
    if not execution:
        return

    db_lock = threading.Lock()          # guards DB writes
    context_lock = threading.Lock()     # guards shared context dict
    context = {"global": global_params, "trigger": trigger_payload or {}}

    # ── Build graph structures ────────────────────────────────────────────────
    node_map = {n["id"]: n for n in nodes}
    adjacency: dict[str, list] = {n["id"]: [] for n in nodes}
    for e in edges:
        src = e.get("source")
        if src in adjacency:
            adjacency[src].append(e)

    # Compute in-degrees
    indegree: dict[str, int] = {n["id"]: 0 for n in nodes}
    for e in edges:
        tgt = e.get("target")
        if tgt in indegree:
            indegree[tgt] += 1

    # ── BFS with parallel independent branches ────────────────────────────────
    # ready_queue holds node IDs whose dependencies are satisfied
    ready_queue: list[str] = [
        n["id"] for n in nodes if indegree[n["id"]] == 0 or n.get("type") == "start"
    ]
    if not ready_queue and nodes:
        ready_queue = [nodes[0]["id"]]

    visited: set[str] = set()
    failed = False

    def log(level: str, msg: str):
        with db_lock:
            execution["logs"].append({"timestamp": _ts(), "level": level, "message": msg})
            save_execution(exec_id, execution)

    log("info", f"▶ Graph execution started. Pool workers: {pool._max_workers}")

    while ready_queue and not failed:
        # Collect all currently-ready nodes and run them concurrently
        batch = []
        for nid in ready_queue:
            if nid not in visited:
                visited.add(nid)
                if nid in node_map:
                    batch.append(nid)
        ready_queue.clear()

        if not batch:
            break

        log("info", f"  ⚡ Running {len(batch)} node(s) in parallel: {batch}")

        # Submit all batch nodes to the thread pool
        futures: dict[Future, str] = {
            pool.submit(
                _execute_node,
                node_map[nid],
                context,
                context_lock,
                global_params,
            ): nid
            for nid in batch
        }

        for future in as_completed(futures):
            nid = futures[future]
            node = node_map[nid]
            label = node.get("data", {}).get("label", nid)
            step_type = node.get("data", {}).get("stepType", "unknown")

            try:
                returned_id, node_result, success = future.result()
            except Exception as exc:
                success = False
                node_result = {"status": "failed", "output": {"error": str(exc)}}

            # Update context with node output
            with context_lock:
                context[returned_id] = node_result["output"]

            # Persist result
            with db_lock:
                execution["nodeResults"][returned_id] = node_result

            if success:
                log("success", f"  ✓ {label} OK → {node_result['output']}")

                # Determine which nodes are now unblocked
                for e in adjacency.get(returned_id, []):
                    target_id = e.get("target")
                    if not target_id:
                        continue

                    # Condition routing
                    if step_type == "condition":
                        with context_lock:
                            condition_result = context[returned_id].get("result")
                        source_handle = e.get("sourceHandle")
                        if source_handle == "true" and condition_result is True:
                            ready_queue.append(target_id)
                        elif source_handle == "false" and condition_result is False:
                            ready_queue.append(target_id)
                    else:
                        # Decrement in-degree; enqueue when all parents done
                        indegree[target_id] = indegree.get(target_id, 1) - 1
                        if indegree[target_id] <= 0 and target_id not in visited:
                            ready_queue.append(target_id)
            else:
                log("error", f"  ✕ {label} FAILED: {node_result['output'].get('error')}")
                with db_lock:
                    execution["status"] = "failed"
                    save_execution(exec_id, execution)
                failed = True
                break

    if not failed:
        with db_lock:
            execution["status"] = "completed"
            execution["logs"].append({
                "timestamp": _ts(),
                "level": "success",
                "message": "✓ Workflow completed successfully.",
            })
            save_execution(exec_id, execution)


# ── Public API ────────────────────────────────────────────────────────────────

def run_graph_async(
    exec_id: str,
    nodes: list,
    edges: list,
    global_params: dict,
    trigger_payload: Optional[dict] = None,
    pool: Optional[ThreadPoolExecutor] = None,
):
    """
    Dispatch graph execution to the thread pool.
    If no pool is provided a temporary one is created (fallback only).
    """
    _pool = pool or ThreadPoolExecutor(max_workers=4)
    _pool.submit(
        _execute_graph,
        exec_id, nodes, edges, global_params, trigger_payload, _pool,
    )
