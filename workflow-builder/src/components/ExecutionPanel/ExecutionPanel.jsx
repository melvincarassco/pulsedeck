import useExecutionStore from '../../store/executionStore';
import useWorkflowStore from '../../store/workflowStore';
import useUiStore from '../../store/uiStore';
import { createWorkflow, updateWorkflow } from '../../utils/api';
import { useRef, useEffect } from 'react';

export default function ExecutionPanel() {
  const isOpen = useUiStore(s => s.isExecutionPanelOpen);
  const togglePanel = useUiStore(s => s.toggleExecutionPanel);
  const { status, logs, isRunning, error, run, clearExecution } = useExecutionStore();
  const { workflowId, exportWorkflow, markSaved } = useWorkflowStore();
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleRun = async () => {
    try {
      let id = workflowId;
      const payload = exportWorkflow();
      if (!id) {
        const result = await createWorkflow(payload);
        id = result.id;
        markSaved(id, new Date().toISOString());
      } else {
        await updateWorkflow(id, payload);
        markSaved(id, new Date().toISOString());
      }
      run(id);
    } catch (err) {
      console.error('Failed to save/run:', err);
    }
  };

  const STATUS_COLORS = {
    pending: 'text-amber-400',
    running: 'text-blue-400',
    completed: 'text-emerald-400',
    failed: 'text-rose-400',
  };

  return (
    <div className="border-t border-border-subtle bg-bg-secondary flex-shrink-0">
      {/* Toggle bar */}
      <button
        onClick={togglePanel}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            ▶ Execution
          </span>
          {status && (
            <span className={`text-[10px] font-bold uppercase ${STATUS_COLORS[status] || 'text-text-muted'}`}>
              {status === 'running' && <span className="inline-block animate-pulse mr-1">●</span>}
              {status}
            </span>
          )}
        </div>
        <span className={`text-xs text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Panel content */}
      {isOpen && (
        <div className="animate-fade-in border-t border-border-subtle">
          {/* Actions */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isRunning
                  ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
              }`}
            >
              {isRunning ? '⏳ Running...' : '▶ Run Workflow'}
            </button>
            <button
              onClick={clearExecution}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted border border-border-subtle hover:border-border-medium hover:text-text-secondary transition-all"
            >
              Clear
            </button>
            {error && (
              <span className="text-xs text-rose-400 ml-2">⚠ {error}</span>
            )}
          </div>

          {/* Log viewer */}
          <div className="max-h-48 overflow-y-auto px-4 py-2 font-mono text-[11px]">
            {logs.length === 0 && !isRunning && (
              <div className="text-text-muted text-center py-6">
                No execution logs yet. Click "Run Workflow" to start.
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="text-text-muted flex-shrink-0">{log.timestamp || ''}</span>
                <span className={`${
                  log.level === 'error' ? 'text-rose-400' :
                  log.level === 'success' ? 'text-emerald-400' :
                  log.level === 'warn' ? 'text-amber-400' :
                  'text-text-secondary'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
