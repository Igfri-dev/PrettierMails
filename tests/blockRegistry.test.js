import { describe, it, expect } from 'vitest';
import registry, {
  registerBlock,
  getBlock,
  getAllBlocks,
  getBlocksByCategory,
  getDefaultData,
  createBlockInstance,
  compileBlock,
} from '../client/src/blocks/registry.js';

describe('Modular Block Registry', () => {
  const expectedBlockTypes = [
    'heading',
    'text',
    'box',
    'image',
    'button',
    'youtube',
    'divider',
    'spacer',
    'social',
    'grid',
    'table',
  ];

  it('registers all 11 core built-in blocks', () => {
    const all = getAllBlocks();
    expect(all.length).toBeGreaterThanOrEqual(11);

    expectedBlockTypes.forEach((type) => {
      const def = getBlock(type);
      expect(def).toBeDefined();
      expect(def.type).toBe(type);
      expect(typeof def.label).toBe('string');
      expect(typeof def.category).toBe('string');
      expect(typeof def.compileHtml).toBe('function');
      expect(typeof def.render).toBe('function');
      expect(typeof def.inspector).toBe('function');
      expect(def.defaultData).toBeDefined();
    });
  });

  it('filters blocks by category', () => {
    const typoBlocks = getBlocksByCategory('typography');
    expect(typoBlocks.some((b) => b.type === 'text')).toBe(true);
    expect(typoBlocks.some((b) => b.type === 'heading')).toBe(true);

    const layoutBlocks = getBlocksByCategory('layout');
    expect(layoutBlocks.some((b) => b.type === 'box')).toBe(true);
    expect(layoutBlocks.some((b) => b.type === 'table')).toBe(true);
  });

  it('provides deep cloned default data via getDefaultData', () => {
    const data1 = getDefaultData('button');
    const data2 = getDefaultData('button');
    expect(data1).toEqual(data2);
    expect(data1).not.toBe(data2); // must be distinct object references

    data1.text = 'Mutated';
    expect(data2.text).not.toBe('Mutated');
  });

  it('creates unique block instances via createBlockInstance', () => {
    const b1 = createBlockInstance('heading', { content: 'First' });
    const b2 = createBlockInstance('heading', { content: 'Second' });

    expect(b1.id).not.toBe(b2.id);
    expect(b1.type).toBe('heading');
    expect(b1.data.content).toBe('First');
    expect(b2.data.content).toBe('Second');
    expect(b1.data.fontSize).toBeDefined(); // inherits defaultData
  });

  it('throws error when creating unknown block type', () => {
    expect(() => createBlockInstance('unknown-type')).toThrow();
  });

  expectedBlockTypes.forEach((type) => {
    it(`compiles block type "${type}" to valid HTML`, () => {
      const block = createBlockInstance(type);
      const html = compileBlock(block, { backgroundColor: '#f1f5f9' });
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('<tr>');
    });
  });

  it('supports registering dynamic custom blocks', () => {
    const customBlock = {
      type: 'custom-banner',
      label: 'Custom Banner',
      category: 'content',
      defaultData: { bannerText: 'Promo 2026' },
      compileHtml: (block) => `<tr><td>${block.data?.bannerText}</td></tr>`,
      render: () => null,
      inspector: () => null,
    };

    registerBlock(customBlock);
    const retrieved = getBlock('custom-banner');
    expect(retrieved).toBeDefined();
    expect(retrieved.label).toBe('Custom Banner');

    const html = compileBlock({ type: 'custom-banner', data: { bannerText: 'Sale 50%' } });
    expect(html).toBe('<tr><td>Sale 50%</td></tr>');
  });
});
