import heading from './heading.jsx';
import text from './text.jsx';
import box from './box.jsx';
import image from './image.jsx';
import button from './button.jsx';
import youtube from './youtube.jsx';
import divider from './divider.jsx';
import spacer from './spacer.jsx';
import social from './social.jsx';
import grid from './grid.jsx';
import table from './table.jsx';

const registry = new Map();

/**
 * Register a block definition into the registry
 * @param {Object} blockDef
 */
export function registerBlock(blockDef) {
  if (!blockDef || !blockDef.type) {
    throw new Error('Block definition must have a unique "type" property.');
  }
  registry.set(blockDef.type, blockDef);
  return blockDef;
}

/**
 * Get a block definition by its type name
 * @param {string} type
 * @returns {Object|undefined}
 */
export function getBlock(type) {
  return registry.get(type);
}

/**
 * Get all registered block definitions
 * @returns {Array<Object>}
 */
export function getAllBlocks() {
  return Array.from(registry.values());
}

/**
 * Get blocks filtered by category
 * @param {string} category
 * @returns {Array<Object>}
 */
export function getBlocksByCategory(category) {
  return getAllBlocks().filter((b) => b.category === category);
}

/**
 * Get a fresh deep copy of the default data for a given block type
 * @param {string} type
 * @returns {Object}
 */
export function getDefaultData(type) {
  const blockDef = getBlock(type);
  if (!blockDef || !blockDef.defaultData) {
    return {};
  }
  return JSON.parse(JSON.stringify(blockDef.defaultData));
}

/**
 * Create a new block instance with unique ID and default data
 * @param {string} type
 * @param {Object} [customData]
 * @returns {Object}
 */
export function createBlockInstance(type, customData = {}) {
  const def = getBlock(type);
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }

  const id = `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const defaultData = getDefaultData(type);

  return {
    id,
    type,
    data: {
      ...defaultData,
      ...customData,
    },
  };
}

/**
 * Compile a single block to HTML using its registered compileHtml method
 * @param {Object} block
 * @param {Object} [globalSettings]
 * @returns {string}
 */
export function compileBlock(block, globalSettings = {}) {
  if (!block || !block.type) return '';
  const def = getBlock(block.type);
  if (def && typeof def.compileHtml === 'function') {
    const blockData = block.data || {};
    // Normalize payload to seamlessly support both compileHtml(data) and compileHtml(block)
    const normalized = {
      ...blockData,
      ...block,
      data: blockData,
    };
    return def.compileHtml(normalized, globalSettings);
  }
  return '';
}

// Register all core built-in blocks
[
  heading,
  text,
  box,
  image,
  button,
  youtube,
  divider,
  spacer,
  social,
  grid,
  table,
].forEach(registerBlock);

export default {
  registerBlock,
  getBlock,
  getAllBlocks,
  getBlocksByCategory,
  getDefaultData,
  createBlockInstance,
  compileBlock,
};
