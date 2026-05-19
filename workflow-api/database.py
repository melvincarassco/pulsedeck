"""
PulseDeck Database Layer
========================
Uses a connection-pool pattern: each call creates its own short-lived
connection (SQLite allows multiple readers; WAL mode enables concurrent
reads alongside writes without blocking).
"""

import sqlite3
import json
import os
import threading

DB_PATH = os.getenv("DB_PATH", "pulsedeck.db")

# Enable WAL mode once at import time — WAL dramatically improves
# concurrent read/write throughput for SQLite.
_wal_once = threading.Lock()
_wal_done = False


def _enable_wal():
    global _wal_done
    with _wal_once:
        if not _wal_done:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA cache_size=-32000;")  # 32 MB page cache
            conn.commit()
            conn.close()
            _wal_done = True


def get_db() -> sqlite3.Connection:
    _enable_wal()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id           TEXT PRIMARY KEY,
            workflowName TEXT,
            version      TEXT,
            savedAt      TEXT,
            canvas       TEXT,
            parameters   TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS executions (
            executionId  TEXT PRIMARY KEY,
            workflowId   TEXT,
            status       TEXT,
            logs         TEXT,
            nodeResults  TEXT,
            createdAt    TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
            FOREIGN KEY(workflowId) REFERENCES workflows(id) ON DELETE CASCADE
        )
    """)

    # Index to speed up execution lookups by workflow
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_executions_wf ON executions(workflowId)
    """)

    conn.commit()
    conn.close()


# ── Workflows ─────────────────────────────────────────────────────────────────

def save_workflow(wf_id: str, data: dict):
    conn = get_db()
    conn.execute("""
        INSERT OR REPLACE INTO workflows (id, workflowName, version, savedAt, canvas, parameters)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        wf_id,
        data.get("workflowName"),
        data.get("version"),
        data.get("savedAt"),
        json.dumps(data.get("canvas", {})),
        json.dumps(data.get("parameters", {})),
    ))
    conn.commit()
    conn.close()


def get_workflow(wf_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM workflows WHERE id = ?", (wf_id,)).fetchone()
    conn.close()
    if row:
        return {
            "id":           row["id"],
            "workflowName": row["workflowName"],
            "version":      row["version"],
            "savedAt":      row["savedAt"],
            "canvas":       json.loads(row["canvas"]),
            "parameters":   json.loads(row["parameters"]),
        }
    return None


def get_all_workflows() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT id, workflowName, savedAt, canvas FROM workflows ORDER BY savedAt DESC"
    ).fetchall()
    conn.close()
    result = []
    for row in rows:
        canvas = json.loads(row["canvas"])
        result.append({
            "id":           row["id"],
            "workflowName": row["workflowName"],
            "savedAt":      row["savedAt"],
            "nodeCount":    len(canvas.get("nodes", [])),
        })
    return result


def delete_workflow(wf_id: str):
    conn = get_db()
    conn.execute("DELETE FROM workflows WHERE id = ?", (wf_id,))
    conn.commit()
    conn.close()


# ── Executions ────────────────────────────────────────────────────────────────

def save_execution(exec_id: str, data: dict):
    conn = get_db()
    conn.execute("""
        INSERT OR REPLACE INTO executions (executionId, workflowId, status, logs, nodeResults)
        VALUES (?, ?, ?, ?, ?)
    """, (
        exec_id,
        data.get("workflowId"),
        data.get("status"),
        json.dumps(data.get("logs", [])),
        json.dumps(data.get("nodeResults", {})),
    ))
    conn.commit()
    conn.close()


def get_execution(exec_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM executions WHERE executionId = ?", (exec_id,)
    ).fetchone()
    conn.close()
    if row:
        return {
            "executionId": row["executionId"],
            "workflowId":  row["workflowId"],
            "status":      row["status"],
            "logs":        json.loads(row["logs"]),
            "nodeResults": json.loads(row["nodeResults"]),
        }
    return None


def get_all_executions(wf_id: str | None = None, limit: int = 50) -> list[dict]:
    conn = get_db()
    if wf_id:
        rows = conn.execute(
            "SELECT executionId, workflowId, status, createdAt FROM executions "
            "WHERE workflowId = ? ORDER BY createdAt DESC LIMIT ?",
            (wf_id, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT executionId, workflowId, status, createdAt FROM executions "
            "ORDER BY createdAt DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    return [
        {
            "executionId": r["executionId"],
            "workflowId":  r["workflowId"],
            "status":      r["status"],
            "createdAt":   r["createdAt"],
        }
        for r in rows
    ]
