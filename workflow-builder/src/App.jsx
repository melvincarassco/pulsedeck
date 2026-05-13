import { useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import Header from './components/Layout/Header';
import StepPalette from './components/Toolbar/StepPalette';
import WorkflowCanvas from './components/Canvas/WorkflowCanvas';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import ExecutionPanel from './components/ExecutionPanel/ExecutionPanel';
import Modals from './components/Modals/Modals';

import useWorkflowStore from './store/workflowStore';
import useUiStore from './store/uiStore';

import './index.css';

function App() {
  const undo = useWorkflowStore(s => s.undo);
  const redo = useWorkflowStore(s => s.redo);
  const removeNode = useWorkflowStore(s => s.removeNode);
  const exportWorkflow = useWorkflowStore(s => s.exportWorkflow);
  const selectedNodeId = useUiStore(s => s.selectedNodeId);
  const togglePalette = useUiStore(s => s.togglePalette);
  const openModal = useUiStore(s => s.openModal);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Don't capture when typing in inputs
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      openModal('shortcuts');
    }

    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      togglePalette();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.querySelector('[title*="Save"]')?.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      openModal('export');
    }

    if (e.key === 'Delete' && selectedNodeId) {
      removeNode(selectedNodeId);
    }
  }, [undo, redo, removeNode, selectedNodeId, togglePalette, openModal]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <StepPalette />
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkflowCanvas />
            <ExecutionPanel />
          </div>
          <ConfigPanel />
        </div>
        <Modals />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
