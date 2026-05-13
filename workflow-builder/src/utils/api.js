let apiBaseOverride = null;

export function setApiBase(url) {
  apiBaseOverride = url;
}

export function getApiBase() {
  if (apiBaseOverride) return apiBaseOverride;
  return ''; // same-origin, Vite proxy handles /workflows → backend
}

// --- Workflow CRUD ---
export async function createWorkflow(payload) {
  const res = await fetch(`${getApiBase()}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json();
}

export async function listWorkflows() {
  const res = await fetch(`${getApiBase()}/workflows`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function getWorkflow(id) {
  const res = await fetch(`${getApiBase()}/workflows/${id}`);
  if (!res.ok) throw new Error(`Get failed: ${res.status}`);
  return res.json();
}

export async function updateWorkflow(id, payload) {
  const res = await fetch(`${getApiBase()}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

export async function validateWorkflow(id) {
  const res = await fetch(`${getApiBase()}/workflows/${id}/validate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Validate failed: ${res.status}`);
  return res.json();
}

export async function runWorkflow(id) {
  const res = await fetch(`${getApiBase()}/workflows/${id}/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Run failed: ${res.status}`);
  return res.json();
}

export async function getExecution(executionId) {
  const res = await fetch(`${getApiBase()}/executions/${executionId}`);
  if (!res.ok) throw new Error(`Get execution failed: ${res.status}`);
  return res.json();
}
