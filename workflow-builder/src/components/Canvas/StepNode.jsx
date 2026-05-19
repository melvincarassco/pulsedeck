import { Handle, Position } from '@xyflow/react';
import useUiStore from '../../store/uiStore';
import useExecutionStore from '../../store/executionStore';

const CATEGORY_COLORS = {
  file:        { bg: 'rgba(6,182,212,0.07)',   border: 'rgba(6,182,212,0.28)',   accent: '#06b6d4' },
  logic:       { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.28)',  accent: '#f59e0b' },
  data:        { bg: 'rgba(99,102,241,0.07)',  border: 'rgba(99,102,241,0.28)',  accent: '#6366f1' },
  integration: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.28)', accent: '#10b981' },
  control:     { bg: 'rgba(61,90,116,0.07)',   border: 'rgba(61,90,116,0.28)',   accent: '#3d5a74' },
};

export default function StepNode({ id, data, selected }) {
  const selectNode = useUiStore(s => s.selectNode);
  const nodeResults = useExecutionStore(s => s.nodeResults);
  const cat = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.control;
  const result = nodeResults[id];

  return (
    <div
      onClick={() => selectNode(id)}
      className="group relative cursor-pointer transition-all duration-200"
      style={{ minWidth: '210px' }}
    >
      {/* Execution status badge */}
      {result && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-lg ${
          result.status === 'success'
            ? 'bg-emerald-500 text-white shadow-emerald-500/40'
            : 'bg-rose-500 text-white shadow-rose-500/40'
        }`}>
          {result.status === 'success' ? '✓' : '✕'}
        </div>
      )}

      <div
        className={`rounded-xl border transition-all duration-200 ${
          selected
            ? 'shadow-[0_0_24px_rgba(6,182,212,0.22)] scale-[1.02]'
            : 'shadow-md hover:shadow-[0_0_16px_rgba(6,182,212,0.12)] hover:scale-[1.01]'
        }`}
        style={{
          background:   selected ? 'rgba(6,182,212,0.1)' : cat.bg,
          borderColor:  selected ? '#06b6d4' : cat.border,
          borderWidth:  selected ? '1.5px' : '1px',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-0.5 rounded-t-xl w-full"
          style={{ background: `linear-gradient(90deg, ${cat.accent}80, transparent)` }}
        />

        {/* Header bar */}
        <div
          className="flex items-center gap-2 px-3 pt-2 pb-1.5"
        >
          <span className="text-base">{data.icon}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: cat.accent }}
          >
            {data.category}
          </span>
        </div>

        {/* Body */}
        <div className="px-3 pb-3">
          <div className="text-sm font-semibold text-text-primary truncate leading-snug">
            {data.label}
          </div>
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-1.5 text-[11px] text-text-muted truncate font-mono space-y-0.5">
              {Object.entries(data.config).slice(0, 2).map(([k, v]) => (
                <div key={k} className="truncate">
                  <span style={{ color: cat.accent }} className="opacity-70">{k}:</span>{' '}
                  {String(v).slice(0, 28)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!border-bg-primary !w-2 !h-2"
        style={{ background: cat.accent }}
      />

      {data.stepType === 'condition' ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: '30%', background: '#10b981' }}
            className="!border-bg-primary !w-3 !h-3"
          />
          <div className="absolute right-0 top-[30%] -mt-1.5 -mr-8 text-[9px] font-bold text-emerald-400 uppercase">True</div>

          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: '70%', background: '#f43f5e' }}
            className="!border-bg-primary !w-3 !h-3"
          />
          <div className="absolute right-0 top-[70%] -mt-1.5 -mr-9 text-[9px] font-bold text-rose-400 uppercase">False</div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!border-bg-primary !w-2 !h-2"
          style={{ background: cat.accent }}
        />
      )}
    </div>
  );
}
