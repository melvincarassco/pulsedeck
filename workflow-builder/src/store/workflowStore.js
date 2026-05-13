import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const MAX_HISTORY = 50;

const defaultState = {
  workflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  parameters: {},
  isDirty: false,
  savedAt: null,
  history: [],
  future: [],
};

function snapshot(state) {
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
    parameters: { ...state.parameters },
    workflowName: state.workflowName,
  };
}

const useWorkflowStore = create((set, get) => ({
  ...defaultState,

  // --- Undo / Redo ---
  pushHistory: () => {
    const s = get();
    const snap = snapshot(s);
    set({
      history: [...s.history.slice(-MAX_HISTORY), snap],
      future: [],
    });
  },

  undo: () => {
    const s = get();
    if (s.history.length === 0) return;
    const prev = s.history[s.history.length - 1];
    const current = snapshot(s);
    set({
      ...prev,
      history: s.history.slice(0, -1),
      future: [current, ...s.future],
      isDirty: true,
    });
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    const current = snapshot(s);
    set({
      ...next,
      history: [...s.history, current],
      future: s.future.slice(1),
      isDirty: true,
    });
  },

  // --- React Flow change handlers ---
  onNodesChange: (changes) => {
    set((s) => ({
      nodes: applyNodeChanges(changes, s.nodes),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges),
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    const s = get();
    s.pushHistory();
    const edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'custom',
      animated: true,
    };
    set({ edges: [...s.edges, edge], isDirty: true });
  },

  // --- Node CRUD ---
  addNode: (nodeData) => {
    const s = get();
    s.pushHistory();
    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Calculate position — place to the right of the last node
    const existingNodes = s.nodes.filter(n => n.type !== 'start');
    let x = 300;
    let y = 200;
    if (existingNodes.length > 0) {
      const lastNode = existingNodes[existingNodes.length - 1];
      x = (lastNode.position?.x || 0) + 280;
      y = lastNode.position?.y || 200;
    }

    const newNode = {
      id,
      type: 'step',
      position: { x, y },
      data: {
        label: nodeData.label,
        stepType: nodeData.stepType,
        category: nodeData.category,
        channel: nodeData.channel || null,
        icon: nodeData.icon,
        config: {},
      },
    };

    // Auto-chain: connect from previous node
    const newEdges = [...s.edges];
    if (existingNodes.length > 0) {
      const lastId = existingNodes[existingNodes.length - 1].id;
      newEdges.push({
        id: `e-${lastId}-${id}`,
        source: lastId,
        target: id,
        type: 'custom',
        animated: true,
      });
    } else {
      // Connect from START
      const startNode = s.nodes.find(n => n.type === 'start');
      if (startNode) {
        newEdges.push({
          id: `e-${startNode.id}-${id}`,
          source: startNode.id,
          target: id,
          type: 'custom',
          animated: true,
        });
      }
    }

    set({ nodes: [...s.nodes, newNode], edges: newEdges, isDirty: true });
    return id;
  },

  removeNode: (nodeId) => {
    const s = get();
    if (nodeId === 'start-node') return; // Can't delete START
    s.pushHistory();
    set({
      nodes: s.nodes.filter(n => n.id !== nodeId),
      edges: s.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    });
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((s) => ({
      nodes: s.nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...dataUpdate } } : n
      ),
      isDirty: true,
    }));
  },

  updateNodeConfig: (nodeId, key, value) => {
    set((s) => ({
      nodes: s.nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
          : n
      ),
      isDirty: true,
    }));
  },

  // --- Workflow metadata ---
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),

  setParameter: (key, value) => {
    set((s) => ({
      parameters: { ...s.parameters, [key]: value },
      isDirty: true,
    }));
  },

  removeParameter: (key) => {
    set((s) => {
      const p = { ...s.parameters };
      delete p[key];
      return { parameters: p, isDirty: true };
    });
  },

  // --- Load / Save / Reset ---
  loadWorkflow: (data) => {
    const startNode = {
      id: 'start-node',
      type: 'start',
      position: { x: 50, y: 200 },
      data: { label: 'START' },
      deletable: false,
    };

    const nodes = data.canvas?.nodes || [];
    const edges = data.canvas?.edges || [];

    set({
      workflowId: data.id || null,
      workflowName: data.workflowName || 'Untitled Workflow',
      nodes: [startNode, ...nodes],
      edges: edges.map(e => ({ ...e, type: 'custom', animated: true })),
      parameters: data.parameters || {},
      isDirty: false,
      savedAt: data.savedAt || null,
      history: [],
      future: [],
    });
  },

  exportWorkflow: () => {
    const s = get();
    return {
      workflowName: s.workflowName,
      version: '1.0',
      savedAt: new Date().toISOString(),
      canvas: {
        nodes: s.nodes.filter(n => n.type !== 'start'), // Strip START
        edges: s.edges.filter(e => e.source !== 'start-node'),
      },
      parameters: s.parameters,
    };
  },

  markSaved: (id, savedAt) => {
    set({ workflowId: id, isDirty: false, savedAt });
  },

  resetWorkflow: () => {
    set({
      ...defaultState,
      nodes: [{
        id: 'start-node',
        type: 'start',
        position: { x: 50, y: 200 },
        data: { label: 'START' },
        deletable: false,
      }],
    });
  },

  initializeCanvas: () => {
    const s = get();
    if (s.nodes.length === 0) {
      set({
        nodes: [{
          id: 'start-node',
          type: 'start',
          position: { x: 50, y: 200 },
          data: { label: 'START' },
          deletable: false,
        }],
      });
    }
  },
}));

export default useWorkflowStore;
