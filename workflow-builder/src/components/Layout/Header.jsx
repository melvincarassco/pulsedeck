import useWorkflowStore from '../../store/workflowStore';
import useUiStore from '../../store/uiStore';
import { createWorkflow, updateWorkflow } from '../../utils/api';

export default function Header() {
  const { workflowId, workflowName, isDirty, savedAt, exportWorkflow, markSaved, resetWorkflow } = useWorkflowStore();
  const { openModal, togglePalette, isPaletteOpen } = useUiStore();

  const handleSave = async () => {
    try {
      const payload = exportWorkflow();
      let id = workflowId;
      if (!id) {
        const result = await createWorkflow(payload);
        id = result.id;
      } else {
        await updateWorkflow(id, payload);
      }
      markSaved(id, new Date().toISOString());
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <header className="h-12 bg-bg-secondary border-b border-border-subtle flex items-center px-4 gap-3 flex-shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
          P
        </div>
        <span className="text-sm font-bold accent-text">
          PulseDeck
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border-subtle" />

      {/* Workflow name */}
      <div className="flex items-center gap-2">
        <input
          className="bg-transparent text-xs font-semibold text-text-primary outline-none border-b border-transparent hover:border-border-medium focus:border-accent-500 transition-colors px-1 py-0.5 max-w-48"
          value={workflowName}
          onChange={(e) => useWorkflowStore.getState().setWorkflowName(e.target.value)}
        />
        {isDirty && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
        )}
        {savedAt && !isDirty && (
          <span className="text-[10px] text-text-muted">Saved</span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <HeaderBtn icon={isPaletteOpen ? '📦' : '📦'} label="Library" onClick={togglePalette} shortcut="L" />
        <HeaderBtn icon="📋" label="Templates" onClick={() => openModal('templates')} />
        <HeaderBtn icon="📂" label="Open" onClick={() => openModal('open')} />
        <HeaderBtn icon="📥" label="Import" onClick={() => openModal('import')} />
        <HeaderBtn icon="📦" label="Export" onClick={() => openModal('export')} shortcut="⌘E" />

        <div className="w-px h-5 bg-border-subtle mx-1" />

        <button
          onClick={handleSave}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', boxShadow: '0 2px 10px rgba(6,182,212,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(6,182,212,0.45)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(6,182,212,0.25)'}
        >
          💾 Save
        </button>

        <HeaderBtn icon="🔄" label="New" onClick={resetWorkflow} />
        <HeaderBtn icon="⌨️" label="" onClick={() => openModal('shortcuts')} shortcut="?" />
      </div>
    </header>
  );
}

function HeaderBtn({ icon, label, onClick, shortcut }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all text-xs group"
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <span className="text-sm">{icon}</span>
      {label && <span className="hidden xl:inline text-[10px] font-medium">{label}</span>}
    </button>
  );
}
