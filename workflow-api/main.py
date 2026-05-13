from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional
import uuid
import time
from apscheduler.schedulers.background import BackgroundScheduler
import database
from execution_engine import run_graph_async

app = FastAPI(title="PulseDeck Workflow API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()

@app.on_event("startup")
def startup_event():
    database.init_db()
    scheduler.start()

class WorkflowPayload(BaseModel):
    workflowName: str = "Untitled Workflow"
    version: str = "1.0"
    savedAt: Optional[str] = None
    canvas: dict = {"nodes": [], "edges": []}
    parameters: dict = {}

@app.post("/workflows")
def create_workflow(payload: WorkflowPayload):
    wf_id = str(uuid.uuid4())[:8]
    data = payload.dict()
    data["savedAt"] = data["savedAt"] or time.strftime("%Y-%m-%dT%H:%M:%SZ")
    database.save_workflow(wf_id, data)
    return {"id": wf_id}

@app.get("/workflows")
def list_workflows():
    return {"workflows": database.get_all_workflows()}

@app.get("/workflows/{wf_id}")
def get_workflow(wf_id: str):
    wf = database.get_workflow(wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    return wf

@app.put("/workflows/{wf_id}")
def update_workflow(wf_id: str, payload: WorkflowPayload):
    wf = database.get_workflow(wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    data = payload.dict()
    data["savedAt"] = data["savedAt"] or time.strftime("%Y-%m-%dT%H:%M:%SZ")
    database.save_workflow(wf_id, data)
    return {"id": wf_id, "status": "updated"}

@app.post("/workflows/{wf_id}/validate")
def validate_workflow(wf_id: str):
    wf = database.get_workflow(wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    
    errors = []
    nodes = wf.get("canvas", {}).get("nodes", [])
    edges = wf.get("canvas", {}).get("edges", [])

    if len(nodes) == 0:
        errors.append("Workflow has no steps.")

    node_ids = {n["id"] for n in nodes}
    for edge in edges:
        if edge.get("source") not in node_ids:
            errors.append(f"Edge references unknown source: {edge.get('source')}")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge references unknown target: {edge.get('target')}")

    connected = {edge.get("source") for edge in edges} | {edge.get("target") for edge in edges}
    disconnected = [n["id"] for n in nodes if n["id"] not in connected]
    if disconnected and len(nodes) > 1:
        errors.append(f"Disconnected nodes: {', '.join(disconnected)}")

    return {"valid": len(errors) == 0, "errors": errors}

def trigger_workflow_run(wf_id: str, trigger_payload: dict = None):
    wf = database.get_workflow(wf_id)
    if not wf: raise Exception("Workflow not found")

    exec_id = str(uuid.uuid4())[:8]
    nodes = wf.get("canvas", {}).get("nodes", [])
    edges = wf.get("canvas", {}).get("edges", [])
    params = wf.get("parameters", {})

    database.save_execution(exec_id, {
        "executionId": exec_id,
        "workflowId": wf_id,
        "status": "running",
        "logs": [{"timestamp": time.strftime("%H:%M:%S"), "level": "info", "message": f"Starting workflow: {wf['workflowName']}"}],
        "nodeResults": {},
    })

    run_graph_async(exec_id, nodes, edges, params, trigger_payload)
    return exec_id

@app.post("/workflows/{wf_id}/run")
def run_workflow(wf_id: str):
    try:
        exec_id = trigger_workflow_run(wf_id)
        return {"executionId": exec_id, "status": "running"}
    except Exception as e:
        raise HTTPException(404, str(e))

@app.post("/webhook/{wf_id}")
async def webhook_trigger(wf_id: str, request: Request):
    """Real-world integration: Webhook trigger"""
    payload = await request.json()
    try:
        exec_id = trigger_workflow_run(wf_id, payload)
        return {"executionId": exec_id, "status": "running", "message": "Webhook received"}
    except Exception as e:
        raise HTTPException(404, str(e))

class SchedulePayload(BaseModel):
    cron_expression: str # e.g. "*/5 * * * *" for every 5 mins

@app.post("/workflows/{wf_id}/schedule")
def schedule_workflow(wf_id: str, payload: SchedulePayload):
    """Epic 5: Scheduled Triggers"""
    wf = database.get_workflow(wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    
    from apscheduler.triggers.cron import CronTrigger
    
    try:
        trigger = CronTrigger.from_crontab(payload.cron_expression)
        job_id = f"job_{wf_id}"
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)
        
        scheduler.add_job(
            trigger_workflow_run, 
            trigger=trigger, 
            args=[wf_id], 
            id=job_id
        )
        return {"status": "scheduled", "job_id": job_id, "cron": payload.cron_expression}
    except Exception as e:
        raise HTTPException(400, f"Invalid cron expression: {e}")

@app.get("/executions/{exec_id}")
def get_execution(exec_id: str):
    exec_data = database.get_execution(exec_id)
    if not exec_data:
        raise HTTPException(404, "Execution not found")
    return exec_data
