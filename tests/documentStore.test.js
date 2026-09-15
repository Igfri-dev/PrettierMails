import { describe, it, expect, beforeEach } from 'vitest';
import useDocumentStore, { defaultGlobalSettings } from '../client/src/store/documentStore.js';

describe('Document Store (Zustand & Undo/Redo)', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      subject: '',
      previewText: '',
      globalSettings: { ...defaultGlobalSettings },
      blocks: [],
      selectedBlockId: null,
      previewMode: 'desktop',
      sidebarTab: 'blocks',
      currentView: 'dashboard',
      clipboardBlock: null,
      past: [],
      future: [],
    });
  });

  it('initializes with empty blocks and default settings', () => {
    const state = useDocumentStore.getState();
    expect(state.blocks).toEqual([]);
    expect(state.subject).toBe('');
    expect(state.canUndo()).toBe(false);
    expect(state.canRedo()).toBe(false);
  });

  it('adds a block and selects it, pushing snapshot to history', () => {
    const { addBlock } = useDocumentStore.getState();
    const newBlock = addBlock('heading', { content: 'Mi Título' });

    const state = useDocumentStore.getState();
    expect(state.blocks.length).toBe(1);
    expect(state.blocks[0].id).toBe(newBlock.id);
    expect(state.blocks[0].data.content).toBe('Mi Título');
    expect(state.selectedBlockId).toBe(newBlock.id);
    expect(state.sidebarTab).toBe('style');
    expect(state.canUndo()).toBe(true);
    expect(state.canRedo()).toBe(false);
  });

  it('updates block data correctly and supports undo', () => {
    const { addBlock, updateBlockData, undo } = useDocumentStore.getState();
    const block = addBlock('text', { content: 'Original' });

    updateBlockData(block.id, { content: 'Modificado' });
    expect(useDocumentStore.getState().blocks[0].data.content).toBe('Modificado');

    undo();
    expect(useDocumentStore.getState().blocks[0].data.content).toBe('Original');
  });

  it('handles multi-step undo and redo accurately', () => {
    const { addBlock, undo, redo } = useDocumentStore.getState();
    addBlock('heading', { content: 'Block 1' });
    addBlock('text', { content: 'Block 2' });
    addBlock('button', { text: 'Block 3' });

    expect(useDocumentStore.getState().blocks.length).toBe(3);

    undo();
    expect(useDocumentStore.getState().blocks.length).toBe(2);

    undo();
    expect(useDocumentStore.getState().blocks.length).toBe(1);

    redo();
    expect(useDocumentStore.getState().blocks.length).toBe(2);

    redo();
    expect(useDocumentStore.getState().blocks.length).toBe(3);
  });

  it('duplicates block right next to the original', () => {
    const { addBlock, duplicateBlock } = useDocumentStore.getState();
    const b1 = addBlock('heading', { content: 'Header' });
    addBlock('text', { content: 'Footer' });

    const dup = duplicateBlock(b1.id);
    const blocks = useDocumentStore.getState().blocks;

    expect(blocks.length).toBe(3);
    expect(blocks[1].id).toBe(dup.id);
    expect(blocks[1].id).not.toBe(b1.id);
    expect(blocks[1].data.content).toBe('Header');
  });

  it('deletes block and clears selection if selected', () => {
    const { addBlock, deleteBlock } = useDocumentStore.getState();
    const b1 = addBlock('heading', { content: 'To Delete' });

    expect(useDocumentStore.getState().selectedBlockId).toBe(b1.id);

    deleteBlock(b1.id);
    const state = useDocumentStore.getState();
    expect(state.blocks.length).toBe(0);
    expect(state.selectedBlockId).toBeNull();
    expect(state.sidebarTab).toBe('blocks');
  });

  it('moves blocks up and down respecting bounds', () => {
    const { addBlock, moveBlock } = useDocumentStore.getState();
    const b1 = addBlock('heading', { content: 'One' });
    const b2 = addBlock('text', { content: 'Two' });

    // Move b1 up (already at 0, no-op)
    moveBlock(b1.id, -1);
    expect(useDocumentStore.getState().blocks[0].id).toBe(b1.id);

    // Move b1 down
    moveBlock(b1.id, 1);
    expect(useDocumentStore.getState().blocks[0].id).toBe(b2.id);
    expect(useDocumentStore.getState().blocks[1].id).toBe(b1.id);
  });

  it('reorders blocks for drag-and-drop operations', () => {
    const { addBlock, reorderBlocks } = useDocumentStore.getState();
    const b1 = addBlock('heading', { content: 'First' });
    const b2 = addBlock('text', { content: 'Second' });
    const b3 = addBlock('button', { text: 'Third' });

    reorderBlocks(0, 2); // move first to last
    const current = useDocumentStore.getState().blocks;
    expect(current[0].id).toBe(b2.id);
    expect(current[1].id).toBe(b3.id);
    expect(current[2].id).toBe(b1.id);
  });

  it('copies and pastes blocks with new unique IDs', () => {
    const { addBlock, copyBlock, pasteBlock } = useDocumentStore.getState();
    const original = addBlock('heading', { content: 'Copied Content' });

    copyBlock(original.id);
    expect(useDocumentStore.getState().clipboardBlock).toBeDefined();

    const pasted = pasteBlock();
    expect(pasted).toBeDefined();
    expect(pasted.id).not.toBe(original.id);
    expect(pasted.data.content).toBe('Copied Content');
    expect(useDocumentStore.getState().blocks.length).toBe(2);
  });

  it('caps undo history at 50 snapshots', () => {
    const { addBlock } = useDocumentStore.getState();
    for (let i = 0; i < 60; i++) {
      addBlock('spacer', { height: `${i + 10}px` });
    }

    const state = useDocumentStore.getState();
    expect(state.past.length).toBeLessThanOrEqual(50);
  });
});
