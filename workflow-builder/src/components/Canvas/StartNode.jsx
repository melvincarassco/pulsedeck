import { Handle, Position } from '@xyflow/react';

export default function StartNode() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 shadow-[0_0_24px_rgba(139,92,246,0.3)] border-2 border-purple-400/30">
      <span className="text-white font-bold text-xs tracking-widest">START</span>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-400 !border-purple-600 !w-2.5 !h-2.5"
      />
    </div>
  );
}
