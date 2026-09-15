import { create } from 'zustand';
import { createBlockInstance } from '../blocks/registry.js';

const MAX_HISTORY_LENGTH = 50;

export const defaultGlobalSettings = {
  backgroundColor: '#0f172a',
  contentBackgroundColor: '#ffffff',
  contentWidth: '600px',
  borderRadius: '16px',
  textColor: '#1e293b',
  padding: '32px',
};

const takeSnapshot = (state) => ({
  blocks: JSON.parse(JSON.stringify(state.blocks)),
  globalSettings: JSON.parse(JSON.stringify(state.globalSettings)),
  subject: state.subject,
  previewText: state.previewText || '',
});

export const useDocumentStore = create((set, get) => ({
  // Active Template / Document Metadata
  currentTemplateId: null,
  currentTemplateName: '',
  currentVersionNumber: 1,
  saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: null,
  isDirty: false,

  // Core Document State
  subject: '',
  previewText: '',
  globalSettings: { ...defaultGlobalSettings },
  blocks: [],
  selectedBlockId: null,

  // Editor UI State
  previewMode: 'desktop', // 'desktop' | 'mobile'
  sidebarTab: 'blocks', // 'blocks' | 'style' | 'settings'
  currentView: 'dashboard', // 'dashboard' | 'editor'
  clipboardBlock: null,

  // History for Undo / Redo
  past: [],
  future: [],

  // History Actions
  pushSnapshot: () => {
    const currentState = get();
    const snapshot = takeSnapshot(currentState);
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY_LENGTH - 1)), snapshot],
      future: [],
      isDirty: true,
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot = takeSnapshot(get());

    set({
      blocks: previousSnapshot.blocks,
      globalSettings: previousSnapshot.globalSettings,
      subject: previousSnapshot.subject,
      previewText: previousSnapshot.previewText || '',
      past: newPast,
      future: [currentSnapshot, ...future.slice(0, MAX_HISTORY_LENGTH - 1)],
      isDirty: true,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = takeSnapshot(get());

    set({
      blocks: nextSnapshot.blocks,
      globalSettings: nextSnapshot.globalSettings,
      subject: nextSnapshot.subject,
      previewText: nextSnapshot.previewText || '',
      past: [...past.slice(-(MAX_HISTORY_LENGTH - 1)), currentSnapshot],
      future: newFuture,
      isDirty: true,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // Persistence & Save State Actions
  setTemplateContext: ({ id, name, versionNumber }) => {
    set({
      currentTemplateId: id || null,
      currentTemplateName: name || '',
      currentVersionNumber: versionNumber || 1,
    });
  },

  setSaveStatus: (status) => set({ saveStatus: status }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  // Document UI Actions
  setCurrentView: (view) => set({ currentView: view }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  setSubject: (subject) => {
    get().pushSnapshot();
    set({ subject, isDirty: true });
  },

  setPreviewText: (previewText) => {
    get().pushSnapshot();
    set({ previewText, isDirty: true });
  },

  setGlobalSettings: (settingsOrUpdater) => {
    get().pushSnapshot();
    const current = get().globalSettings || defaultGlobalSettings;
    const resolved =
      typeof settingsOrUpdater === 'function'
        ? settingsOrUpdater(current)
        : settingsOrUpdater;

    set({
      globalSettings: {
        ...defaultGlobalSettings,
        ...current,
        ...(resolved || {}),
      },
      isDirty: true,
    });
  },

  updateGlobalSetting: (key, value) => {
    get().pushSnapshot();
    set((state) => ({
      globalSettings: {
        ...defaultGlobalSettings,
        ...(state.globalSettings || {}),
        [key]: value,
      },
      isDirty: true,
    }));
  },

  setSelectedBlockId: (id) => {
    set({
      selectedBlockId: id,
      sidebarTab: id ? 'style' : get().sidebarTab === 'style' ? 'blocks' : get().sidebarTab,
    });
  },

  // Block Actions
  addBlock: (type, customData = {}, targetIndex = null) => {
    get().pushSnapshot();
    const newBlock = createBlockInstance(type, customData);
    set((state) => {
      let newBlocks;
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= state.blocks.length) {
        newBlocks = [...state.blocks];
        newBlocks.splice(targetIndex, 0, newBlock);
      } else {
        newBlocks = [...state.blocks, newBlock];
      }
      return {
        blocks: newBlocks,
        selectedBlockId: newBlock.id,
        sidebarTab: 'style',
        isDirty: true,
      };
    });
    return newBlock;
  },

  insertBlockAt: (type, index, customData = {}) => {
    return get().addBlock(type, customData, index);
  },

  updateBlockData: (blockId, partialData) => {
    get().pushSnapshot();
    set((state) => ({
      blocks: state.blocks.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            data: {
              ...b.data,
              ...partialData,
            },
          };
        }
        return b;
      }),
      isDirty: true,
    }));
  },

  deleteBlock: (blockId) => {
    get().pushSnapshot();
    set((state) => {
      const remaining = state.blocks.filter((b) => b.id !== blockId);
      const isSelected = state.selectedBlockId === blockId;
      return {
        blocks: remaining,
        selectedBlockId: isSelected ? null : state.selectedBlockId,
        sidebarTab: isSelected ? 'blocks' : state.sidebarTab,
        isDirty: true,
      };
    });
  },

  duplicateBlock: (blockId) => {
    const { blocks, pushSnapshot } = get();
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return null;

    pushSnapshot();
    const original = blocks[index];
    const duplicated = {
      ...original,
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data: JSON.parse(JSON.stringify(original.data || {})),
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicated);

    set({
      blocks: newBlocks,
      selectedBlockId: duplicated.id,
      isDirty: true,
    });
    return duplicated;
  },

  moveBlock: (blockId, direction) => {
    const { blocks, pushSnapshot } = get();
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    pushSnapshot();
    const newBlocks = [...blocks];
    const [item] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, item);

    set({ blocks: newBlocks, isDirty: true });
  },

  reorderBlocks: (oldIndex, newIndex) => {
    const { blocks, pushSnapshot } = get();
    if (
      oldIndex === newIndex ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex >= blocks.length ||
      newIndex >= blocks.length
    ) {
      return;
    }

    pushSnapshot();
    const newBlocks = [...blocks];
    const [movedItem] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, movedItem);

    set({ blocks: newBlocks, isDirty: true });
  },

  copyBlock: (blockId) => {
    const { blocks } = get();
    const target = blocks.find((b) => b.id === blockId);
    if (target) {
      set({ clipboardBlock: JSON.parse(JSON.stringify(target)) });
    }
  },

  pasteBlock: () => {
    const { clipboardBlock, blocks, selectedBlockId, pushSnapshot } = get();
    if (!clipboardBlock) return null;

    pushSnapshot();
    const newBlock = {
      ...clipboardBlock,
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data: JSON.parse(JSON.stringify(clipboardBlock.data || {})),
    };

    const selectedIndex = blocks.findIndex((b) => b.id === selectedBlockId);
    const newBlocks = [...blocks];
    if (selectedIndex >= 0) {
      newBlocks.splice(selectedIndex + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }

    set({
      blocks: newBlocks,
      selectedBlockId: newBlock.id,
      sidebarTab: 'style',
      isDirty: true,
    });
    return newBlock;
  },

  loadTemplate: (template) => {
    get().pushSnapshot();
    set({
      currentTemplateId: template.id || null,
      currentTemplateName: template.name || template.subject || 'Diseño',
      currentVersionNumber: template.version_number || template.latest_version || 1,
      blocks: Array.isArray(template.blocks)
        ? JSON.parse(JSON.stringify(template.blocks))
        : [],
      globalSettings: template.globalSettings || template.global_settings
        ? JSON.parse(JSON.stringify(template.globalSettings || template.global_settings))
        : { ...defaultGlobalSettings },
      subject: template.subject || '',
      previewText: template.previewText || template.preview_text || '',
      selectedBlockId: null,
      sidebarTab: 'blocks',
      isDirty: false,
      saveStatus: 'saved',
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  },

  clearCanvas: () => {
    get().pushSnapshot();
    set({
      currentTemplateId: null,
      currentTemplateName: '',
      currentVersionNumber: 1,
      blocks: [],
      selectedBlockId: null,
      sidebarTab: 'blocks',
      isDirty: false,
      saveStatus: 'idle',
      lastSavedAt: null,
    });
  },

  resetHistory: () => {
    set({ past: [], future: [] });
  },
}));

export default useDocumentStore;
