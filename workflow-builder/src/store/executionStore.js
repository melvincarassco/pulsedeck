import { create } from 'zustand';
import { getApiBase } from '../utils/api';

const useExecutionStore = create((set, get) => ({
  executionId: null,
  status: null, // 'pending' | 'running' | 'completed' | 'failed'
  logs: [],
  nodeResults: {}, // { nodeId: { status, output } }
  isRunning: false,
  error: null,

  run: async (workflowId) => {
    set({ isRunning: true, status: 'pending', logs: [], nodeResults: {}, error: null });
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/workflows/${workflowId}/run`, { method: 'POST' });
      if (!res.ok) throw new Error(`Run failed: ${res.status}`);
      const data = await res.json();
      set({ executionId: data.executionId, status: data.status || 'running' });
      // Start polling
      get().pollStatus(data.executionId);
    } catch (err) {
      set({ isRunning: false, status: 'failed', error: err.message });
    }
  },

  pollStatus: async (execId) => {
    const poll = async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/executions/${execId}`);
        if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
        const data = await res.json();
        set({
          status: data.status,
          logs: data.logs || [],
          nodeResults: data.nodeResults || {},
        });
        if (data.status === 'running' || data.status === 'pending') {
          setTimeout(poll, 1000);
        } else {
          set({ isRunning: false });
        }
      } catch (err) {
        set({ isRunning: false, status: 'failed', error: err.message });
      }
    };
    poll();
  },

  clearExecution: () => {
    set({
      executionId: null,
      status: null,
      logs: [],
      nodeResults: {},
      isRunning: false,
      error: null,
    });
  },
}));

export default useExecutionStore;
