import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import registry from '../../blocks/registry.js';

export default function BlockRenderer({
  block,
  isSelected,
  onSelect,
  onUpdateBlockData,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : undefined,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(block.id);
  };

  const { type, data = {} } = block;
  const blockDef = registry.getBlock(type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`relative group transition-all duration-200 cursor-pointer rounded-lg ${
        isSelected
          ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/10'
          : 'hover:ring-1 hover:ring-brand-400/50'
      }`}
    >
      {/* Side Hover Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="hidden md:flex absolute -left-7 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity select-none"
        title="Arrastrar bloque"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Floating Action Toolbar when block is selected */}
      {isSelected && (
        <div className="absolute -top-9 right-2 z-20 flex items-center bg-slate-900 border border-slate-700 shadow-xl rounded-lg px-1.5 py-1 space-x-1 text-slate-300">
          <div
            {...attributes}
            {...listeners}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing transition"
            title="Arrastrar bloque"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider px-1.5 border-r border-slate-800">
            {blockDef?.label || type}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(block.id);
            }}
            disabled={!canMoveUp}
            title="Mover arriba"
            className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(block.id);
            }}
            disabled={!canMoveDown}
            title="Mover abajo"
            className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateBlock(block.id);
            }}
            title="Duplicar bloque (Ctrl+D)"
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBlock(block.id);
            }}
            title="Eliminar bloque (Supr)"
            className="p-1 hover:text-rose-400 hover:bg-rose-500/20 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* RENDER BLOCK CONTENT FROM MODULAR REGISTRY */}
      {blockDef && typeof blockDef.render === 'function' ? (
        blockDef.render({
          data,
          block,
          onUpdateBlockData,
          onDeleteBlock,
        })
      ) : (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Bloque no registrado o sin vista previa: <strong>{type}</strong></span>
        </div>
      )}
    </div>
  );
}
