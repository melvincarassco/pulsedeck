import time
import threading
import requests
import re
import json
from database import get_execution, save_execution

def _ts():
    return time.strftime("%H:%M:%S")

def resolve_variables(text: str, context: dict) -> str:
    """
    Replaces {{node_id.key}} or {{global_param_name}} with actual values from context.
    """
    if not isinstance(text, str):
        return text

    def replacer(match):
        path = match.group(1).strip()
        parts = path.split('.')
        current = context
        try:
            for part in parts:
                if isinstance(current, dict):
                    current = current.get(part, "")
                else:
                    return match.group(0) # Unresolved
            return str(current) if current is not None else ""
        except Exception:
            return match.group(0)

    return re.sub(r'\{\{(.*?)\}\}', replacer, text)

def evaluate_condition(config: dict, context: dict) -> bool:
    """
    Evaluates a condition node.
    Expects config to have: operand1, operator, operand2.
    """
    op1 = resolve_variables(str(config.get("operand1", "")), context)
    op2 = resolve_variables(str(config.get("operand2", "")), context)
    operator = config.get("operator", "==")

    try:
        if operator == "==": return op1 == op2
        if operator == "!=": return op1 != op2
        if operator == ">": return float(op1) > float(op2)
        if operator == "<": return float(op1) < float(op2)
        if operator == "contains": return op2 in op1
    except ValueError:
        pass # Fallback to False if float conversion fails
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
            # Assume JSON for now
            data = None
            try:
                data = json.loads(body_str) if body_str else None
            except:
                data = body_str # send as string if not json
            
            if isinstance(data, dict):
                resp = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                resp = requests.post(url, headers=headers, data=data, timeout=10)
        else:
            resp = requests.request(method, url, headers=headers, data=body_str, timeout=10)
            
        return {
            "status_code": resp.status_code,
            "response": resp.text
        }
    except Exception as e:
        raise Exception(f"HTTP Error: {str(e)}")

def run_graph_async(exec_id: str, nodes: list, edges: list, global_params: dict, trigger_payload: dict = None):
    thread = threading.Thread(
        target=_execute_graph, 
        args=(exec_id, nodes, edges, global_params, trigger_payload)
    )
    thread.start()

def _execute_graph(exec_id: str, nodes: list, edges: list, global_params: dict, trigger_payload: dict):
    execution = get_execution(exec_id)
    if not execution:
        return

    # Build graph mappings
    node_map = {n["id"]: n for n in nodes}
    adjacency = {n["id"]: [] for n in nodes}
    for e in edges:
        source = e.get("source")
        if source in adjacency:
            adjacency[source].append(e)

    # Context holds all variables and step outputs
    context = {"global": global_params, "trigger": trigger_payload or {}}

    # Find starting nodes (nodes with indegree 0, or type 'start')
    indegree = {n["id"]: 0 for n in nodes}
    for e in edges:
        if e.get("target") in indegree:
            indegree[e["target"]] += 1

    queue = [n["id"] for n in nodes if indegree[n["id"]] == 0 or n.get("type") == "start"]
    if not queue:
        # Fallback to first node if it's a circular graph with no clear start
        if nodes: queue = [nodes[0]["id"]]

    visited = set()

    execution["logs"].append({"timestamp": _ts(), "level": "info", "message": f"Graph Traversal Started. Context keys: {list(context.keys())}"})
    save_execution(exec_id, execution)

    while queue:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)

        node = node_map.get(current_id)
        if not node: continue

        label = node.get("data", {}).get("label", current_id)
        step_type = node.get("data", {}).get("stepType", "unknown")
        raw_config = node.get("data", {}).get("config", {})

        execution["logs"].append({
            "timestamp": _ts(),
            "level": "info",
            "message": f"Executing: {label} ({step_type})"
        })
        
        # execution state for this node
        node_result = {"status": "success", "output": {}}
        success = True

        try:
            # Evaluate step type
            if step_type == "start":
                node_result["output"] = {"message": "Started"}
            
            elif step_type == "set_variable":
                k = resolve_variables(raw_config.get("key", ""), context)
                v = resolve_variables(raw_config.get("value", ""), context)
                context[k] = v
                node_result["output"] = {k: v}
                
            elif step_type == "http_request":
                node_result["output"] = execute_http_request(raw_config, context)
                
            elif step_type == "condition":
                res = evaluate_condition(raw_config, context)
                node_result["output"] = {"result": res}
            
            elif step_type == "webhook":
                # Typically a trigger, acts like a pass-through during run
                node_result["output"] = context.get("trigger", {})

            elif step_type == "delay":
                delay_sec = float(resolve_variables(str(raw_config.get("seconds", 1)), context))
                time.sleep(delay_sec)
                node_result["output"] = {"delayed_for": delay_sec}

            else:
                # Mock execution for other nodes
                time.sleep(0.5)
                node_result["output"] = {"message": f"Simulated {step_type}"}

        except Exception as e:
            success = False
            node_result["status"] = "failed"
            node_result["output"] = {"error": str(e)}

        # Save context
        context[current_id] = node_result["output"]
        execution["nodeResults"][current_id] = node_result

        if success:
            execution["logs"].append({"timestamp": _ts(), "level": "success", "message": f"  ✓ {label} OK"})
            
            # Determine next nodes based on edges
            out_edges = adjacency.get(current_id, [])
            for e in out_edges:
                target_id = e.get("target")
                
                # If it's a condition node, only traverse the edge that matches the boolean result
                if step_type == "condition":
                    condition_result = context[current_id].get("result")
                    source_handle = e.get("sourceHandle") # 'true' or 'false'
                    
                    if source_handle == "true" and condition_result is True:
                        queue.append(target_id)
                    elif source_handle == "false" and condition_result is False:
                        queue.append(target_id)
                    # If no specific handle is matched, do not queue
                else:
                    queue.append(target_id)
                    
        else:
            execution["logs"].append({"timestamp": _ts(), "level": "error", "message": f"  ✕ {label} FAILED: {node_result['output'].get('error')}"})
            execution["status"] = "failed"
            save_execution(exec_id, execution)
            return # Halt execution on failure

        # Save progress mid-run
        save_execution(exec_id, execution)

    # Graph complete
    execution["status"] = "completed"
    execution["logs"].append({"timestamp": _ts(), "level": "success", "message": "✓ Workflow completed successfully."})
    save_execution(exec_id, execution)
