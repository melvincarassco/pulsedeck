import sqlite3
import json
import os

DB_PATH = os.getenv("DB_PATH", "pulsedeck.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY,
            workflowName TEXT,
            version TEXT,
            savedAt TEXT,
            canvas TEXT,
            parameters TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS executions (
            executionId TEXT PRIMARY KEY,
            workflowId TEXT,
            status TEXT,
            logs TEXT,
            nodeResults TEXT,
            FOREIGN KEY(workflowId) REFERENCES workflows(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def save_workflow(wf_id: str, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO workflows (id, workflowName, version, savedAt, canvas, parameters)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        wf_id,
        data.get("workflowName"),
        data.get("version"),
        data.get("savedAt"),
        json.dumps(data.get("canvas", {})),
        json.dumps(data.get("parameters", {}))
    ))
    conn.commit()
    conn.close()

def get_workflow(wf_id: str) -> dict | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM workflows WHERE id = ?', (wf_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "workflowName": row["workflowName"],
            "version": row["version"],
            "savedAt": row["savedAt"],
            "canvas": json.loads(row["canvas"]),
            "parameters": json.loads(row["parameters"])
        }
    return None

def get_all_workflows() -> list[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, workflowName, savedAt, canvas FROM workflows')
    rows = cursor.fetchall()
    conn.close()
    
    summaries = []
    for row in rows:
        canvas = json.loads(row["canvas"])
        summaries.append({
            "id": row["id"],
            "workflowName": row["workflowName"],
            "savedAt": row["savedAt"],
            "nodeCount": len(canvas.get("nodes", []))
        })
    return summaries

def save_execution(exec_id: str, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO executions (executionId, workflowId, status, logs, nodeResults)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        exec_id,
        data.get("workflowId"),
        data.get("status"),
        json.dumps(data.get("logs", [])),
        json.dumps(data.get("nodeResults", {}))
    ))
    conn.commit()
    conn.close()

def get_execution(exec_id: str) -> dict | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM executions WHERE executionId = ?', (exec_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "executionId": row["executionId"],
            "workflowId": row["workflowId"],
            "status": row["status"],
            "logs": json.loads(row["logs"]),
            "nodeResults": json.loads(row["nodeResults"])
        }
    return None
