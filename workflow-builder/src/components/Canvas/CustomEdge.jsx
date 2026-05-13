import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import useWorkflowStore from '../../store/workflowStore';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
}) {
  const removeEdge = useWorkflowStore(s => s.pushHistory);
  const edges = useWorkflowStore(s => s.edges);
  const setEdges = useWorkflowStore(s => s.onEdgesChange);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 16,
  });

  const handleDelete = (e) => {
    e.stopPropagation();
    removeEdge();
    setEdges([{ type: 'remove', id }]);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#a78bfa' : '#8b5cf6',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '8 4',
          animation: 'flow-dash 1s linear infinite',
        }}
      />
      <EdgeLabelRenderer>
        <button
          className="absolute pointer-events-auto opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 transition-opacity bg-bg-secondary border border-border-medium rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 shadow-lg"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity: selected ? 1 : undefined,
          }}
          onClick={handleDelete}
          title="Delete edge"
        >
          ✕
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
