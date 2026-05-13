"""
PulseDeck Workflow API — FastAPI backend
In-memory MVP: all data resets on restart.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional
import uuid
import time
import threading

app = FastAPI(title="PulseDeck Workflow API", version="1.0.0")

# CORS — open for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== In-memory stores =====
workflows: dict[str, dict] = {}
executions: dict[str, dict] = {}


# ===== Models =====
class WorkflowPayload(BaseModel):
    workflowName: str = "Untitled Workflow"
    version: str = "1.0"
    savedAt: Optional[str] = None
    canvas: dict = {"nodes": [], "edges": []}
    parameters: dict = {}


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []


# ===== Workflow Endpoints =====

@app.post("/workflows")
def create_workflow(payload: WorkflowPayload):
    wf_id = str(uuid.uuid4())[:8]
    workflows[wf_id] = {
        "id": wf_id,
        "workflowName": payload.workflowName,
        "version": payload.version,
        "savedAt": payload.savedAt or time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "canvas": payload.canvas,
        "parameters": payload.parameters,
    }
    return {"id": wf_id}


@app.get("/workflows")
def list_workflows():
    summaries = [
        {
            "id": wf["id"],
            "workflowName": wf["workflowName"],
            "savedAt": wf["savedAt"],
            "nodeCount": len(wf.get("canvas", {}).get("nodes", [])),
        }
        for wf in workflows.values()
    ]
    return {"workflows": summaries}


@app.get("/workflows/{wf_id}")
def get_workflow(wf_id: str):
    if wf_id not in workflows:
        raise HTTPException(404, "Workflow not found")
    return workflows[wf_id]


@app.put("/workflows/{wf_id}")
def update_workflow(wf_id: str, payload: WorkflowPayload):
    if wf_id not in workflows:
        raise HTTPException(404, "Workflow not found")
    workflows[wf_id] = {
        "id": wf_id,
        "workflowName": payload.workflowName,
        "version": payload.version,
        "savedAt": payload.savedAt or time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "canvas": payload.canvas,
        "parameters": payload.parameters,
    }
    return {"id": wf_id, "status": "updated"}


@app.post("/workflows/{wf_id}/validate")
def validate_workflow(wf_id: str):
    if wf_id not in workflows:
        raise HTTPException(404, "Workflow not found")

    wf = workflows[wf_id]
    errors = []
    nodes = wf.get("canvas", {}).get("nodes", [])
    edges = wf.get("canvas", {}).get("edges", [])

    if len(nodes) == 0:
        errors.append("Workflow has no steps.")

    # Check all edges reference valid nodes
    node_ids = {n["id"] for n in nodes}
    for edge in edges:
        if edge.get("source") not in node_ids:
            errors.append(f"Edge references unknown source: {edge.get('source')}")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge references unknown target: {edge.get('target')}")

    # Check for disconnected nodes
    connected = set()
    for edge in edges:
        connected.add(edge.get("source"))
        connected.add(edge.get("target"))
    disconnected = [n["id"] for n in nodes if n["id"] not in connected]
    if disconnected and len(nodes) > 1:
        errors.append(f"Disconnected nodes: {', '.join(disconnected)}")

    return ValidationResult(valid=len(errors) == 0, errors=errors)


@app.post("/workflows/{wf_id}/run")
def run_workflow(wf_id: str):
    if wf_id not in workflows:
        raise HTTPException(404, "Workflow not found")

    exec_id = str(uuid.uuid4())[:8]
    wf = workflows[wf_id]
    nodes = wf.get("canvas", {}).get("nodes", [])

    # Initialize execution record
    executions[exec_id] = {
        "executionId": exec_id,
        "workflowId": wf_id,
        "status": "running",
        "logs": [
            {"timestamp": _ts(), "level": "info", "message": f"Starting workflow: {wf['workflowName']}"},
            {"timestamp": _ts(), "level": "info", "message": f"Found {len(nodes)} step(s) to execute."},
        ],
        "nodeResults": {},
    }

    # Run asynchronously (simulated)
    thread = threading.Thread(target=_simulate_execution, args=(exec_id, nodes))
    thread.start()

    return {"executionId": exec_id, "status": "running"}


@app.get("/executions/{exec_id}")
def get_execution(exec_id: str):
    if exec_id not in executions:
        raise HTTPException(404, "Execution not found")
    return executions[exec_id]


# ===== Simulation =====

def _ts():
    return time.strftime("%H:%M:%S")


def _simulate_execution(exec_id: str, nodes: list):
    """Simulate sequential step execution with log lines."""
    execution = executions[exec_id]

    for i, node in enumerate(nodes):
        node_id = node.get("id", f"node-{i}")
        label = node.get("data", {}).get("label", node_id)
        step_type = node.get("data", {}).get("stepType", "unknown")

        execution["logs"].append({
            "timestamp": _ts(),
            "level": "info",
            "message": f"[{i+1}/{len(nodes)}] Executing: {label} ({step_type})",
        })
        time.sleep(0.8)  # Simulate work

        # Random success/fail (mostly success)
        import random
        success = random.random() > 0.1

        if success:
            execution["nodeResults"][node_id] = {
                "status": "success",
                "output": f"Step '{label}' completed successfully.",
            }
            execution["logs"].append({
                "timestamp": _ts(),
                "level": "success",
                "message": f"  ✓ {label} → OK",
            })
        else:
            execution["nodeResults"][node_id] = {
                "status": "failed",
                "output": f"Step '{label}' encountered an error.",
            }
            execution["logs"].append({
                "timestamp": _ts(),
                "level": "error",
                "message": f"  ✕ {label} → FAILED (simulated error)",
            })
            execution["status"] = "failed"
            execution["logs"].append({
                "timestamp": _ts(),
                "level": "error",
                "message": "Execution halted due to error.",
            })
            return

    execution["status"] = "completed"
    execution["logs"].append({
        "timestamp": _ts(),
        "level": "success",
        "message": f"✓ Workflow completed — {len(nodes)} steps executed.",
    })
