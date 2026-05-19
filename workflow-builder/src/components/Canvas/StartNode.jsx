import { Handle, Position } from '@xyflow/react';

export default function StartNode() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-2" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', boxShadow: '0 0 24px rgba(6,182,212,0.35)', borderColor: 'rgba(6,182,212,0.35)' }}>
      <span className="text-white font-bold text-xs tracking-widest">START</span>
      <Handle
        type="source"
        position={Position.Right}
        className="!border-bg-primary !w-2.5 !h-2.5"
        style={{ background: '#22d3ee' }}
      />
    </div>
  );
}
