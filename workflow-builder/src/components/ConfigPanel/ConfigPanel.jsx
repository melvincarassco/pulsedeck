import { useState } from 'react';
import useUiStore from '../../store/uiStore';
import useWorkflowStore from '../../store/workflowStore';
import { getStepMeta } from '../../utils/steps';

function NodeConfig() {
  const selectedNodeId = useUiStore(s => s.selectedNodeId);
  const deselectNode = useUiStore(s => s.deselectNode);
  const nodes = useWorkflowStore(s => s.nodes);
  const updateNodeData = useWorkflowStore(s => s.updateNodeData);
  const updateNodeConfig = useWorkflowStore(s => s.updateNodeConfig);
  const removeNode = useWorkflowStore(s => s.removeNode);

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node || node.type === 'start') return null;

  const meta = getStepMeta(node.data.stepType);
  const configEntries = Object.entries(node.data.config || {});

  return (
    <div className="animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-lg">{node.data.icon}</span>
          <span className="text-xs font-bold text-text-primary">{node.data.label}</span>
        </div>
        <button
          onClick={deselectNode}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Label */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block">Label</label>
          <input
            className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-xs text-text-primary focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all outline-none"
            value={node.data.label}
            onChange={(e) => updateNodeData(selectedNodeId, { label: e.target.value })}
          />
        </div>

        {/* Step Type (read-only) */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block">Type</label>
          <div className="px-3 py-2 bg-bg-input/50 rounded-lg text-xs text-text-secondary font-mono">
            {node.data.stepType}
          </div>
        </div>

        {/* Config fields */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 block">Parameters</label>
          {configEntries.map(([key, value]) => (
            <div key={key} className="mb-2">
              <label className="text-[10px] text-text-muted mb-0.5 block">{key}</label>
              <input
                className="w-full px-3 py-1.5 bg-bg-input border border-border-subtle rounded text-xs text-text-primary font-mono focus:border-purple-500 outline-none transition-all"
                value={value}
                onChange={(e) => updateNodeConfig(selectedNodeId, key, e.target.value)}
              />
            </div>
          ))}
          <AddConfigField nodeId={selectedNodeId} />
        </div>

        {/* Delete button */}
        <button
          onClick={() => { removeNode(selectedNodeId); deselectNode(); }}
          className="w-full py-2 text-xs font-semibold text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/10 transition-all"
        >
          🗑 Delete Step
        </button>
      </div>
    </div>
  );
}

function AddConfigField({ nodeId }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const updateNodeConfig = useWorkflowStore(s => s.updateNodeConfig);

  const handleAdd = () => {
    if (!key.trim()) return;
    updateNodeConfig(nodeId, key.trim(), value);
    setKey('');
    setValue('');
  };

  return (
    <div className="flex gap-1 mt-2">
      <input
        className="flex-1 px-2 py-1 bg-bg-input border border-border-subtle rounded text-[10px] text-text-primary placeholder:text-text-muted outline-none"
        placeholder="key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <input
        className="flex-1 px-2 py-1 bg-bg-input border border-border-subtle rounded text-[10px] text-text-primary placeholder:text-text-muted outline-none"
        placeholder="value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={handleAdd}
        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-500/30 transition-colors"
      >
        +
      </button>
    </div>
  );
}

function WorkflowConfig() {
  const workflowName = useWorkflowStore(s => s.workflowName);
  const parameters = useWorkflowStore(s => s.parameters);
  const setWorkflowName = useWorkflowStore(s => s.setWorkflowName);
  const setParameter = useWorkflowStore(s => s.setParameter);
  const removeParameter = useWorkflowStore(s => s.removeParameter);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddParam = () => {
    if (!newKey.trim()) return;
    setParameter(newKey.trim(), newValue);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="p-3 space-y-4 animate-fade-in">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block">Workflow Name</label>
        <input
          className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-xs text-text-primary focus:border-purple-500 outline-none transition-all"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 block">Parameters</label>
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1 mb-2">
            <span className="text-[10px] text-text-muted font-mono w-20 truncate">{key}</span>
            <input
              className="flex-1 px-2 py-1 bg-bg-input border border-border-subtle rounded text-[10px] text-text-primary font-mono outline-none focus:border-purple-500 transition-all"
              value={value}
              onChange={(e) => setParameter(key, e.target.value)}
            />
            <button
              onClick={() => removeParameter(key)}
              className="w-5 h-5 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded text-[10px] transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="flex gap-1 mt-2">
          <input
            className="flex-1 px-2 py-1 bg-bg-input border border-border-subtle rounded text-[10px] text-text-primary placeholder:text-text-muted outline-none"
            placeholder="key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            className="flex-1 px-2 py-1 bg-bg-input border border-border-subtle rounded text-[10px] text-text-primary placeholder:text-text-muted outline-none"
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button
            onClick={handleAddParam}
            className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-500/30 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfigPanel() {
  const activeTab = useUiStore(s => s.activeTab);
  const selectedNodeId = useUiStore(s => s.selectedNodeId);

  return (
    <div className="w-72 bg-bg-secondary border-l border-border-subtle flex flex-col overflow-y-auto flex-shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        <TabButton label="Canvas" tab="canvas" />
        <TabButton label="Configuration" tab="config" />
      </div>

      {activeTab === 'canvas' && selectedNodeId && <NodeConfig />}
      {activeTab === 'canvas' && !selectedNodeId && (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div className="text-text-muted">
            <div className="text-2xl mb-2 opacity-40">👆</div>
            <div className="text-xs">Click a node to configure it</div>
          </div>
        </div>
      )}
      {activeTab === 'config' && <WorkflowConfig />}
    </div>
  );
}

function TabButton({ label, tab }) {
  const activeTab = useUiStore(s => s.activeTab);
  const setTab = useUiStore(s => s.setTab);
  const isActive = activeTab === tab;

  return (
    <button
      onClick={() => setTab(tab)}
      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
        isActive
          ? 'text-purple-400 border-b-2 border-purple-500'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
    </button>
  );
}
