import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BlockRenderer from './BlockRenderer.jsx';
import { Plus, Sparkles, Smartphone, Monitor, LayoutTemplate } from 'lucide-react';

export default function Canvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlockData,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  onReorderBlocks,
  onAddBlock,
  globalSettings = {},
  previewMode,
  concurrentEditorName,
  onOpenTemplates,
  onOpenAi,
}) {
  const isMobile = previewMode === 'mobile';
  const [dropTargetIndex, setDropTargetIndex] = useState(null);

  const activeSettings = {
    backgroundColor: '#0f172a',
    contentBackgroundColor: '#ffffff',
    contentWidth: '600px',
    borderRadius: '16px',
    padding: '32px',
    textColor: '#1e293b',
    ...(globalSettings || {}),
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement needed so regular click/select isn't treated as drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && typeof onReorderBlocks === 'function') {
        onReorderBlocks(oldIndex, newIndex);
      }
    }
  };

  const handleDragOverSlot = (e, index) => {
    if (
      e.dataTransfer.types.includes('application/prettier-mails-block') ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (dropTargetIndex !== index) {
        setDropTargetIndex(index);
      }
    }
  };

  const handleDropSlot = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const blockType =
      e.dataTransfer.getData('application/prettier-mails-block') ||
      e.dataTransfer.getData('text/plain');
    setDropTargetIndex(null);
    if (blockType && typeof onAddBlock === 'function') {
      onAddBlock(blockType, undefined, index);
    }
  };

  return (
    <div
      onClick={() => onSelectBlock(null)}
      className="flex-1 h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start transition-colors duration-300 relative"
      style={{ backgroundColor: activeSettings.backgroundColor }}
    >
      {/* Device Mode Badge Indicator */}
      <div className="mb-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/60 shadow-md text-xs font-semibold text-slate-300 flex items-center space-x-2 select-none">
        {isMobile ? (
          <>
            <Smartphone className="w-3.5 h-3.5 text-brand-400" />
            <span>Vista Móvil (375px)</span>
          </>
        ) : (
          <>
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vista Escritorio ({activeSettings.contentWidth})</span>
          </>
        )}
      </div>

      {/* Collaborative Concurrency Alert Banner */}
      {concurrentEditorName && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center justify-between shadow-lg max-w-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
            <span>
              <strong>Edición activa concurrente:</strong> Esta plantilla está siendo editada por <strong>{concurrentEditorName}</strong>.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 font-bold ml-3 flex-shrink-0 uppercase tracking-wider">
            En Edición
          </span>
        </div>
      )}

      {/* Main Email Container Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full transition-all duration-300 shadow-2xl relative ${
          isMobile ? 'ring-8 ring-slate-800 rounded-[36px]' : ''
        }`}
        style={{
          maxWidth: isMobile ? '375px' : activeSettings.contentWidth,
          backgroundColor: activeSettings.contentBackgroundColor,
          borderRadius: isMobile ? '32px' : activeSettings.borderRadius,
          padding: isMobile ? '20px' : activeSettings.padding,
          color: activeSettings.textColor,
        }}
      >
        {/* If in mobile frame, show top notch */}
        {isMobile && (
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto -mt-2 mb-4"></div>
        )}

        {/* Blocks container */}
        {blocks.length === 0 ? (
          <div
            onDragOver={(e) => {
              if (
                e.dataTransfer.types.includes('application/prettier-mails-block') ||
                e.dataTransfer.types.includes('text/plain')
              ) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setDropTargetIndex(0);
              }
            }}
            onDragLeave={() => setDropTargetIndex(null)}
            onDrop={(e) => handleDropSlot(e, 0)}
            className={`py-20 px-4 text-center space-y-5 rounded-2xl transition-all ${
              dropTargetIndex === 0
                ? 'border-2 border-dashed border-brand-500 bg-brand-50/60 scale-[0.99]'
                : ''
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600/15 to-indigo-600/15 border border-brand-500/25 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-slate-900">
                {dropTargetIndex === 0 ? '¡Suelta aquí para añadir el bloque!' : 'Lienzo en Blanco'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Arrastra componentes desde la barra lateral directamente al lienzo, haz clic sobre ellos, carga una plantilla o usa el Asistente de IA.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onAddBlock('heading', { text: '¡Hola! Bienvenido a PrettierMails' })}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Encabezado</span>
              </button>
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={onOpenTemplates}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                  <span>Explorar Plantillas</span>
                </button>
              )}
              {onOpenAi && (
                <button
                  type="button"
                  onClick={onOpenAi}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Crear con IA</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="space-y-1 relative"
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setDropTargetIndex(null);
                  }
                }}
              >
                {/* Top drop slot before block 0 */}
                <div
                  onDragOver={(e) => handleDragOverSlot(e, 0)}
                  onDrop={(e) => handleDropSlot(e, 0)}
                  className={`transition-all duration-150 rounded-lg ${
                    dropTargetIndex === 0
                      ? 'py-2.5 my-1.5 bg-brand-500/10 border-2 border-dashed border-brand-500 flex items-center justify-center shadow-sm'
                      : 'h-2 -my-1'
                  }`}
                >
                  {dropTargetIndex === 0 && (
                    <span className="text-[11px] font-bold text-brand-600 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Soltar para insertar al inicio
                    </span>
                  )}
                </div>

                {blocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    <BlockRenderer
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={onSelectBlock}
                      onUpdateBlockData={onUpdateBlockData}
                      onDeleteBlock={onDeleteBlock}
                      onDuplicateBlock={onDuplicateBlock}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      canMoveUp={index > 0}
                      canMoveDown={index < blocks.length - 1}
                    />

                    {/* Drop slot after block */}
                    <div
                      onDragOver={(e) => handleDragOverSlot(e, index + 1)}
                      onDrop={(e) => handleDropSlot(e, index + 1)}
                      className={`transition-all duration-150 rounded-lg ${
                        dropTargetIndex === index + 1
                          ? 'py-2.5 my-1.5 bg-brand-500/10 border-2 border-dashed border-brand-500 flex items-center justify-center shadow-sm'
                          : 'h-2 -my-1'
                      }`}
                    >
                      {dropTargetIndex === index + 1 && (
                        <span className="text-[11px] font-bold text-brand-600 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Soltar para insertar aquí
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Quick Add Block Bar at Bottom */}
        {blocks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-center gap-2">
            <button
              onClick={() => onAddBlock('text')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> + Texto
            </button>
            <button
              onClick={() => onAddBlock('youtube')}
              className="px-2.5 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium transition flex items-center gap-1 border border-red-200"
            >
              <Plus className="w-3 h-3" /> + YouTube
            </button>
            <button
              onClick={() => onAddBlock('button')}
              className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition flex items-center gap-1 border border-indigo-200"
            >
              <Plus className="w-3 h-3" /> + Botón
            </button>
            <button
              onClick={() => onAddBlock('box')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> + Caja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
