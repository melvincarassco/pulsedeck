import { useState } from 'react';
import useUiStore from '../../store/uiStore';
import useWorkflowStore from '../../store/workflowStore';
import { STEP_CATEGORIES, CHANNELS } from '../../utils/steps';

export default function StepPalette() {
  const isPaletteOpen = useUiStore(s => s.isPaletteOpen);
  const activeChannel = useUiStore(s => s.activeChannel);
  const setChannel = useUiStore(s => s.setChannel);
  const searchQuery = useUiStore(s => s.searchQuery);
  const setSearch = useUiStore(s => s.setSearch);
  const togglePalette = useUiStore(s => s.togglePalette);
  const addNode = useWorkflowStore(s => s.addNode);

  const [expandedCat, setExpandedCat] = useState('messaging');

  if (!isPaletteOpen) return null;

  // Filter steps by channel and search
  const filteredCategories = STEP_CATEGORIES.map(cat => ({
    ...cat,
    steps: cat.steps.filter(step => {
      if (activeChannel !== 'all' && step.channel && step.channel !== activeChannel) return false;
      if (activeChannel !== 'all' && !step.channel && cat.id === 'messaging') return false;
      if (searchQuery && !step.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }),
  })).filter(cat => cat.steps.length > 0);

  const handleAddStep = (step, category) => {
    addNode({
      label: step.label,
      stepType: step.stepType,
      category: category.id,
      channel: step.channel || null,
      icon: step.icon,
    });
  };

  return (
    <div className="w-64 bg-bg-secondary border-r border-border-subtle flex flex-col animate-slide-left overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border-subtle flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Step Library</span>
        <button
          onClick={togglePalette}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-bg-input border border-border-subtle rounded-lg px-3 py-1.5">
          <span className="text-text-muted text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search steps..."
            className="bg-transparent flex-1 text-xs text-text-primary placeholder:text-text-muted outline-none"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="px-3 pb-2 flex gap-1 flex-wrap">
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch.id)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
              activeChannel === ch.id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-bg-tertiary text-text-muted border border-transparent hover:text-text-secondary'
            }`}
          >
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="mb-1">
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: cat.color }}
              />
              {cat.label}
              <span className="ml-auto text-text-muted text-[10px]">{cat.steps.length}</span>
              <span className={`text-[10px] transition-transform ${expandedCat === cat.id ? 'rotate-90' : ''}`}>▸</span>
            </button>

            {expandedCat === cat.id && (
              <div className="ml-2 mt-1 space-y-1 animate-fade-in">
                {cat.steps.map(step => (
                  <button
                    key={step.stepType}
                    onClick={() => handleAddStep(step, cat)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all bg-bg-card border border-transparent hover:border-border-medium hover:bg-bg-card-hover hover:shadow-sm group"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary truncate">{step.label}</div>
                    </div>
                    <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
