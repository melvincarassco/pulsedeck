import { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useWorkflowStore from '../../store/workflowStore';
import useUiStore from '../../store/uiStore';
import StepNode from './StepNode';
import StartNode from './StartNode';
import CustomEdge from './CustomEdge';

const nodeTypes = { step: StepNode, start: StartNode };
const edgeTypes = { custom: CustomEdge };

export default function WorkflowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    initializeCanvas,
  } = useWorkflowStore();

  const selectNode = useUiStore(s => s.selectNode);
  const deselectNode = useUiStore(s => s.deselectNode);
  const selectedNodeId = useUiStore(s => s.selectedNodeId);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initializeCanvas();
      initialized.current = true;
    }
  }, [initializeCanvas]);

  const onNodeClick = useCallback((_event, node) => {
    if (node.type !== 'start') {
      selectNode(node.id);
    }
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    deselectNode();
  }, [deselectNode]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={proOptions}
        defaultEdgeOptions={{ type: 'custom', animated: true }}
        deleteKeyCode="Delete"
        className="bg-bg-primary"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(6,182,212,0.06)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="!bottom-4 !right-4"
          maskColor="rgba(0,0,0,0.6)"
          nodeColor={(node) => {
            if (node.type === 'start') return '#06b6d4';
            const colors = {
              file:        '#06b6d4',
              logic:       '#f59e0b',
              data:        '#6366f1',
              integration: '#10b981',
              control:     '#3d5a74',
            };
            return colors[node.data?.category] || '#3d5a74';
          }}
        />
      </ReactFlow>

      {/* Canvas empty hint */}
      {nodes.length <= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-center text-text-muted">
            <div className="text-4xl mb-3 opacity-30">📁</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Drop steps to build your pipeline</div>
            <div className="text-xs mt-1.5">Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent-400)', border: '1px solid rgba(6,182,212,0.2)' }}>L</kbd> to open the step library</div>
          </div>
        </div>
      )}
    </div>
  );
}
