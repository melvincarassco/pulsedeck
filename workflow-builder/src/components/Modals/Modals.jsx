import { useState, useEffect } from 'react';
import useUiStore from '../../store/uiStore';
import useWorkflowStore from '../../store/workflowStore';
import { listWorkflows, getWorkflow } from '../../utils/api';
import { TEMPLATES } from '../../utils/templates';

// ===== Modal Shell =====
function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-bg-secondary border border-border-medium rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
          <h2 className="text-sm font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors text-xs">✕</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-56px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===== Export Modal =====
function ExportModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const exportWorkflow = useWorkflowStore(s => s.exportWorkflow);
  const data = exportWorkflow();
  const json = JSON.stringify(data, null, 2);

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
  };

  return (
    <ModalShell title="📦 Export Workflow" onClose={closeModal}>
      <div className="p-5">
        <pre className="bg-bg-input rounded-xl p-4 text-[11px] text-text-secondary font-mono max-h-64 overflow-auto border border-border-subtle">
          {json}
        </pre>
        <div className="flex gap-2 mt-4">
          <button onClick={handleDownload} className="flex-1 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all">
            ⬇ Download JSON
          </button>
          <button onClick={handleCopy} className="px-4 py-2 rounded-lg text-xs font-medium border border-border-subtle text-text-secondary hover:bg-bg-tertiary transition-all">
            📋 Copy
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ===== Import Modal =====
function ImportModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!data.canvas || !data.canvas.nodes) throw new Error('Invalid workflow format');
      loadWorkflow(data);
      closeModal();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonInput(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <ModalShell title="📥 Import Workflow" onClose={closeModal}>
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Upload JSON file</label>
          <input type="file" accept=".json" onChange={handleFile} className="text-xs text-text-secondary" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Or paste JSON</label>
          <textarea
            className="w-full h-40 bg-bg-input border border-border-subtle rounded-xl p-3 text-[11px] text-text-primary font-mono resize-none outline-none focus:border-purple-500 transition-all"
            value={jsonInput}
            onChange={(e) => { setJsonInput(e.target.value); setError(''); }}
            placeholder='{"workflowName": "...", "canvas": { ... }}'
          />
        </div>
        {error && <div className="text-xs text-rose-400">⚠ {error}</div>}
        <button onClick={handleImport} disabled={!jsonInput.trim()} className="w-full py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-40">
          Import
        </button>
      </div>
    </ModalShell>
  );
}

// ===== Open From Server Modal =====
function OpenModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow);
  const markSaved = useWorkflowStore(s => s.markSaved);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listWorkflows()
      .then(data => { setWorkflows(data.workflows || data || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const handleOpen = async (id) => {
    try {
      const data = await getWorkflow(id);
      loadWorkflow({ ...data, id });
      markSaved(id, data.savedAt);
      closeModal();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <ModalShell title="📂 Open from Server" onClose={closeModal}>
      <div className="p-5">
        {loading && <div className="text-xs text-text-muted text-center py-8">Loading...</div>}
        {error && <div className="text-xs text-rose-400 text-center py-4">⚠ {error}</div>}
        {!loading && workflows.length === 0 && (
          <div className="text-xs text-text-muted text-center py-8">No saved workflows found. Save one first!</div>
        )}
        <div className="space-y-2">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => handleOpen(wf.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-purple-500/30 hover:bg-bg-tertiary transition-all text-left group"
            >
              <div>
                <div className="text-xs font-semibold text-text-primary">{wf.workflowName || wf.name || 'Untitled'}</div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {wf.savedAt ? new Date(wf.savedAt).toLocaleString() : 'Unknown date'}
                </div>
              </div>
              <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
            </button>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

// ===== Templates Modal =====
function TemplatesModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow);

  const handleUse = (template) => {
    loadWorkflow(template.data);
    closeModal();
  };

  return (
    <ModalShell title="📋 Templates" onClose={closeModal}>
      <div className="p-5 space-y-3">
        {TEMPLATES.map((tpl, i) => (
          <button
            key={i}
            onClick={() => handleUse(tpl)}
            className="w-full p-4 rounded-xl border border-border-subtle hover:border-purple-500/30 hover:bg-bg-tertiary transition-all text-left group"
          >
            <div className="text-xs font-bold text-text-primary mb-1">{tpl.name}</div>
            <div className="text-[11px] text-text-secondary">{tpl.description}</div>
            <div className="text-[10px] text-purple-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Use this template →</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

// ===== Shortcuts Modal =====
function ShortcutsModal() {
  const closeModal = useUiStore(s => s.closeModal);
  const shortcuts = [
    ['?', 'Show shortcuts'],
    ['L', 'Toggle step library'],
    ['Ctrl+Z', 'Undo'],
    ['Ctrl+Shift+Z', 'Redo'],
    ['Ctrl+S', 'Save workflow'],
    ['Ctrl+E', 'Export JSON'],
    ['Delete', 'Remove selected node'],
  ];

  return (
    <ModalShell title="⌨️ Keyboard Shortcuts" onClose={closeModal}>
      <div className="p-5 space-y-2">
        {shortcuts.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-text-secondary">{desc}</span>
            <kbd className="px-2 py-0.5 bg-bg-input border border-border-subtle rounded text-[10px] font-mono text-text-primary">{key}</kbd>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

// ===== Modal Router =====
export default function Modals() {
  const activeModal = useUiStore(s => s.activeModal);

  switch (activeModal) {
    case 'export': return <ExportModal />;
    case 'import': return <ImportModal />;
    case 'open': return <OpenModal />;
    case 'templates': return <TemplatesModal />;
    case 'shortcuts': return <ShortcutsModal />;
    default: return null;
  }
}
