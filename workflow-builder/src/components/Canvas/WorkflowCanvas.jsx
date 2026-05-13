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
          gap={20}
          size={1}
          color="rgba(255,255,255,0.04)"
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
            if (node.type === 'start') return '#8b5cf6';
            const colors = {
              messaging: '#22c55e',
              logic: '#f59e0b',
              data: '#3b82f6',
              integration: '#8b5cf6',
              control: '#64748b',
            };
            return colors[node.data?.category] || '#64748b';
          }}
        />
      </ReactFlow>

      {/* Canvas empty hint */}
      {nodes.length <= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-center text-text-muted">
            <div className="text-4xl mb-3 opacity-40">🎨</div>
            <div className="text-sm font-medium">Drag steps from the palette</div>
            <div className="text-xs mt-1">or press <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary text-[10px] font-mono">L</kbd> to toggle it</div>
          </div>
        </div>
      )}
    </div>
  );
}
