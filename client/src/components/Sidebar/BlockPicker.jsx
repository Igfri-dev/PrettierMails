import React from 'react';
import { Plus } from 'lucide-react';
import registry from '../../blocks/registry.js';

const BLOCK_COLORS = {
  grid: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  table: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  youtube: 'text-red-500 bg-red-500/10 border-red-500/20',
  box: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  heading: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  text: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  button: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  image: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  divider: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  spacer: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  social: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

const BLOCK_DESCRIPTIONS = {
  grid: 'Logo o imagen y texto en columnas responsivas lado a lado',
  table: 'Tabla de datos, credenciales o precios con estilos y celdas alternadas',
  youtube: 'Embebido con miniatura HD, badge de reproducción y botón directo',
  box: 'Contenedor estilizado con borde, sombra y múltiples bloques anidados',
  heading: 'Título con tamaños y pesos tipográficos personalizables',
  text: 'Párrafo de texto enriquecido con formato markdown (**negrita**, *cursiva*)',
  button: 'Llamado a la acción con estilos, bordes redondeados y enlaces',
  image: 'Imagen responsiva con bordes redondeados y enlace opcional',
  divider: 'Línea de separación horizontal elegante para seccionar contenido',
  spacer: 'Espaciado vertical en blanco para separar secciones',
  social: 'Iconos directos a YouTube, Twitter, Instagram, GitHub, etc.',
};

export default function BlockPicker({ onAddBlock }) {
  const registeredBlocks = registry.getAllBlocks();

  return (
    <div className="p-3.5 space-y-3 select-none">
      <div>
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Componentes Modulares
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Haz clic para agregar al lienzo
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {registeredBlocks.map((blockDef) => {
          const Icon = blockDef.icon;
          const colorClass = BLOCK_COLORS[blockDef.type] || 'text-brand-400 bg-brand-500/10 border-brand-500/20';
          const description = BLOCK_DESCRIPTIONS[blockDef.type] || blockDef.label;

          return (
            <button
              key={blockDef.type}
              type="button"
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', blockDef.type);
                e.dataTransfer.setData('application/prettier-mails-block', blockDef.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAddBlock(blockDef.type, registry.getDefaultData(blockDef.type))}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-[#121826] hover:bg-[#182133] border border-[#1e283d] hover:border-brand-500/50 transition-all duration-150 active:scale-95 shadow-sm text-left cursor-grab active:cursor-grabbing"
              title={`${description} (Arrastra al lienzo o haz clic para añadir)`}
            >
              <div className={`p-2.5 rounded-xl border ${colorClass} mb-2 transition-transform group-hover:scale-110 flex items-center justify-center`}>
                {Icon && <Icon className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors text-center line-clamp-1">
                {blockDef.label || blockDef.name || blockDef.type}
              </span>
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3 h-3 text-brand-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
