import React from 'react';
import { 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Box,
  AlertCircle
} from 'lucide-react';
import registry from '../../blocks/registry.js';

export default function StyleInspector({
  block,
  onUpdateBlockData,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  if (!block) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
        <Box className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs font-medium">Selecciona un bloque del lienzo para editar sus estilos y contenido.</p>
      </div>
    );
  }

  const { type, data = {} } = block;
  const blockDef = registry.getBlock(type);

  const update = (keyOrObj, value) => {
    if (typeof keyOrObj === 'object' && keyOrObj !== null) {
      onUpdateBlockData(block.id, keyOrObj);
    } else {
      onUpdateBlockData(block.id, { [keyOrObj]: value });
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {blockDef?.label || type}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onMoveUp(block.id)}
            disabled={!canMoveUp}
            title="Mover arriba"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(block.id)}
            disabled={!canMoveDown}
            title="Mover abajo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateBlock(block.id)}
            title="Duplicar bloque (Ctrl+D)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(block.id)}
            title="Eliminar bloque (Supr)"
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RENDER MODULAR INSPECTOR CONTROLS */}
      {blockDef && typeof blockDef.inspector === 'function' ? (
        blockDef.inspector({
          data,
          update,
          onUpdate: update,
          block,
          onUpdateBlockData,
        })
      ) : (
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>No hay controles de edición adicionales para este bloque.</span>
        </div>
      )}
    </div>
  );
}
