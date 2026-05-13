import { Handle, Position } from '@xyflow/react';
import useUiStore from '../../store/uiStore';
import useExecutionStore from '../../store/executionStore';

const CATEGORY_COLORS = {
  messaging: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', accent: '#22c55e' },
  logic: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', accent: '#f59e0b' },
  data: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', accent: '#3b82f6' },
  integration: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)', accent: '#8b5cf6' },
  control: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)', accent: '#64748b' },
};

const CHANNEL_BADGES = {
  whatsapp: { label: 'WA', bg: '#25D366', color: '#fff' },
  rcs: { label: 'RCS', bg: '#4285F4', color: '#fff' },
  sms: { label: 'SMS', bg: '#f59e0b', color: '#fff' },
};

export default function StepNode({ id, data, selected }) {
  const selectNode = useUiStore(s => s.selectNode);
  const nodeResults = useExecutionStore(s => s.nodeResults);
  const cat = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.control;
  const channelBadge = data.channel ? CHANNEL_BADGES[data.channel] : null;
  const result = nodeResults[id];

  return (
    <div
      onClick={() => selectNode(id)}
      className="group relative cursor-pointer transition-all duration-200"
      style={{ minWidth: '200px' }}
    >
      {/* Execution status overlay */}
      {result && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-lg ${
          result.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {result.status === 'success' ? '✓' : '✕'}
        </div>
      )}

      <div
        className={`rounded-xl border-2 transition-all duration-200 ${
          selected
            ? 'shadow-[0_0_20px_rgba(139,92,246,0.25)] scale-[1.02]'
            : 'shadow-md hover:shadow-lg hover:scale-[1.01]'
        }`}
        style={{
          background: selected ? 'rgba(139,92,246,0.12)' : cat.bg,
          borderColor: selected ? '#8b5cf6' : cat.border,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t-[10px]"
          style={{ background: `${cat.accent}15` }}
        >
          <span className="text-lg">{data.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary" style={{ color: cat.accent }}>
            {data.category}
          </span>
          {channelBadge && (
            <span
              className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ background: channelBadge.bg, color: channelBadge.color }}
            >
              {channelBadge.label}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-2.5">
          <div className="text-sm font-semibold text-text-primary truncate">
            {data.label}
          </div>
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-1 text-[11px] text-text-muted truncate font-mono">
              {Object.entries(data.config).slice(0, 2).map(([k, v]) => (
                <div key={k} className="truncate">{k}: {String(v).slice(0, 30)}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !border-bg-primary !w-2 !h-2"
      />
      {data.stepType === 'condition' ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: '30%' }}
            className="!bg-emerald-500 !border-bg-primary !w-3 !h-3"
          />
          <div className="absolute right-0 top-[30%] -mt-1.5 -mr-8 text-[9px] font-bold text-emerald-500 uppercase">True</div>
          
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: '70%' }}
            className="!bg-rose-500 !border-bg-primary !w-3 !h-3"
          />
          <div className="absolute right-0 top-[70%] -mt-1.5 -mr-9 text-[9px] font-bold text-rose-500 uppercase">False</div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-purple-500 !border-bg-primary !w-2 !h-2"
        />
      )}
    </div>
  );
}
