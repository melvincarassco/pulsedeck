import { create } from 'zustand';

const useUiStore = create((set) => ({
  activeTab: 'canvas', // 'canvas' | 'config'
  selectedNodeId: null,
  isPaletteOpen: true,
  isExecutionPanelOpen: false,
  activeModal: null, // 'export' | 'import' | 'open' | 'templates' | 'shortcuts' | null

  searchQuery: '',

  setTab: (tab) => set({ activeTab: tab }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  deselectNode: () => set({ selectedNodeId: null }),
  togglePalette: () => set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
  toggleExecutionPanel: () => set((s) => ({ isExecutionPanelOpen: !s.isExecutionPanelOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  setSearch: (query) => set({ searchQuery: query }),
}));

export default useUiStore;
