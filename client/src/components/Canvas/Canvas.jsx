import React from 'react';
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
  onAddBlock,
  globalSettings,
  previewMode,
  onOpenTemplates,
  onOpenAi,
}) {
  const isMobile = previewMode === 'mobile';

  return (
    <div
      onClick={() => onSelectBlock(null)}
      className="flex-1 h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start transition-colors duration-300 relative"
      style={{ backgroundColor: globalSettings.backgroundColor }}
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
            <span>Vista Escritorio ({globalSettings.contentWidth})</span>
          </>
        )}
      </div>

      {/* Main Email Container Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full transition-all duration-300 shadow-2xl relative ${
          isMobile ? 'ring-8 ring-slate-800 rounded-[36px]' : ''
        }`}
        style={{
          maxWidth: isMobile ? '375px' : globalSettings.contentWidth,
          backgroundColor: globalSettings.contentBackgroundColor,
          borderRadius: isMobile ? '32px' : globalSettings.borderRadius,
          padding: isMobile ? '20px' : globalSettings.padding,
          color: globalSettings.textColor,
        }}
      >
        {/* If in mobile frame, show top notch */}
        {isMobile && (
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto -mt-2 mb-4"></div>
        )}

        {/* Blocks container */}
        {blocks.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600/15 to-indigo-600/15 border border-brand-500/25 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-slate-900">Lienzo en Blanco</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Empieza agregando bloques desde el menú lateral, carga una plantilla predefinida o crea un correo con el Asistente de IA.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onAddBlock('heading', { content: '¡Hola! Bienvenido a PrettierMails' })}
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
          <div className="space-y-1">
            {blocks.map((block, index) => (
              <BlockRenderer
                key={block.id}
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
            ))}
          </div>
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
