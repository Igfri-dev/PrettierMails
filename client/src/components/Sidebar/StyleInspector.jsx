import React from 'react';
import { 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Box, 
  Heading1, 
  AlignLeft, 
  Image as ImageIcon, 
  MousePointerClick, 
  Minus, 
  MoveVertical, 
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Columns2,
  Table,
  Plus,
  X
} from 'lucide-react';
import YoutubeIcon from '../YoutubeIcon.jsx';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/youtubeHelper.js';

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

  const { type, data } = block;

  const update = (key, value) => {
    onUpdateBlockData(block.id, { [key]: value });
  };

  // Grid helpers
  const updateLeftImage = (key, value) => {
    update('leftImage', { ...(data.leftImage || {}), [key]: value });
  };
  const updateLeftText = (key, value) => {
    update('leftText', { ...(data.leftText || {}), [key]: value });
  };
  const updateRightText = (key, value) => {
    update('rightText', { ...(data.rightText || {}), [key]: value });
  };
  const updateRightImage = (key, value) => {
    update('rightImage', { ...(data.rightImage || {}), [key]: value });
  };

  // Table helpers
  const addTableColumn = () => {
    const headers = [...(data.headers || ['Columna 1'])];
    headers.push(`Columna ${headers.length + 1}`);
    const rows = (data.rows || [['']]).map((r) => [...r, '']);
    onUpdateBlockData(block.id, { headers, rows });
  };

  const removeTableColumn = (colIdx) => {
    if ((data.headers?.length || 0) <= 1) return;
    const headers = data.headers.filter((_, i) => i !== colIdx);
    const rows = (data.rows || []).map((r) => r.filter((_, i) => i !== colIdx));
    onUpdateBlockData(block.id, { headers, rows });
  };

  const addTableRow = () => {
    const colCount = data.headers?.length || 2;
    const newRow = new Array(colCount).fill('');
    const rows = [...(data.rows || []), newRow];
    onUpdateBlockData(block.id, { rows });
  };

  const removeTableRow = (rowIdx) => {
    if ((data.rows?.length || 0) <= 1) return;
    const rows = data.rows.filter((_, i) => i !== rowIdx);
    onUpdateBlockData(block.id, { rows });
  };

  const updateTableHeader = (colIdx, val) => {
    const headers = [...(data.headers || [])];
    headers[colIdx] = val;
    onUpdateBlockData(block.id, { headers });
  };

  const updateTableCell = (rowIdx, colIdx, val) => {
    const rows = (data.rows || []).map((row, r) => {
      if (r === rowIdx) {
        const copy = [...row];
        copy[colIdx] = val;
        return copy;
      }
      return row;
    });
    onUpdateBlockData(block.id, { rows });
  };

  const applyTableTheme = (themeName) => {
    if (themeName === 'modern-slate') {
      onUpdateBlockData(block.id, {
        headerBgColor: '#0f172a',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        altRowBgColor: '#f8fafc',
        textColor: '#334155',
        borderColor: '#e2e8f0',
        striped: true,
      });
    } else if (themeName === 'blue-pro') {
      onUpdateBlockData(block.id, {
        headerBgColor: '#1e40af',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        altRowBgColor: '#eff6ff',
        textColor: '#1e293b',
        borderColor: '#bfdbfe',
        striped: true,
      });
    } else if (themeName === 'emerald') {
      onUpdateBlockData(block.id, {
        headerBgColor: '#065f46',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        altRowBgColor: '#ecfdf5',
        textColor: '#064e3b',
        borderColor: '#a7f3d0',
        striped: true,
      });
    } else if (themeName === 'minimal') {
      onUpdateBlockData(block.id, {
        headerBgColor: '#f8fafc',
        headerTextColor: '#0f172a',
        rowBgColor: '#ffffff',
        altRowBgColor: '#ffffff',
        textColor: '#334155',
        borderColor: '#e2e8f0',
        striped: false,
      });
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {type}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onMoveUp(block.id)}
            disabled={!canMoveUp}
            title="Mover arriba"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            disabled={!canMoveDown}
            title="Mover abajo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateBlock(block.id)}
            title="Duplicar bloque"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteBlock(block.id)}
            title="Eliminar bloque"
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* YOUTUBE BLOCK INSPECTOR */}
      {type === 'youtube' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1 text-red-400">
                <YoutubeIcon className="w-4 h-4" />
                URL del Video de YouTube
              </span>
            </label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            {extractYouTubeId(data.url) ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ID detectado: {extractYouTubeId(data.url)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pega un enlace válido de YouTube</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Título del Video</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Título descriptivo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Subtítulo / Descripción</label>
            <textarea
              rows={2}
              value={data.caption || ''}
              onChange={(e) => update('caption', e.target.value)}
              placeholder="Breve descripción del video..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Texto del Botón CTA</label>
            <input
              type="text"
              value={data.buttonText || ''}
              onChange={(e) => update('buttonText', e.target.value)}
              placeholder="Ver en YouTube ▶"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Fondo de Tarjeta</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.cardBackground || '#0f172a'}
                  onChange={(e) => update('cardBackground', e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400">{data.cardBackground}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color de Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.textColor || '#f8fafc'}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400">{data.textColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOX / CONTAINER INSPECTOR */}
      {type === 'box' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Color de Fondo de la Caja</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.backgroundColor || '#f8fafc'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={data.backgroundColor || '#f8fafc'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          {/* Callout Accent Left Border */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Borde Lateral de Acento (Callout)</span>
              <span className="text-[11px] font-mono text-slate-400">
                {data.borderLeftColor || 'Ninguno'}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.borderLeftColor || '#2563eb'}
                onChange={(e) => update('borderLeftColor', e.target.value)}
                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {[
                  { label: 'Off', color: '' },
                  { label: 'Azul', color: '#2563eb' },
                  { label: 'Verde', color: '#10b981' },
                  { label: 'Ámbar', color: '#f59e0b' },
                  { label: 'Púrpura', color: '#8b5cf6' },
                  { label: 'Rojo', color: '#ef4444' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => update('borderLeftColor', item.color)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition ${
                      (data.borderLeftColor || '') === item.color
                        ? 'bg-brand-600 text-white border-brand-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color de Borde</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.borderColor || '#e2e8f0'}
                  onChange={(e) => update('borderColor', e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400">{data.borderColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Grosor de Borde</label>
              <select
                value={data.borderWidth || '1px'}
                onChange={(e) => update('borderWidth', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="0px">Sin borde (0px)</option>
                <option value="1px">Fino (1px)</option>
                <option value="2px">Medio (2px)</option>
                <option value="4px">Grueso (4px)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Esquinas Redondeadas</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['0px', '8px', '14px', '20px'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update('borderRadius', r)}
                  className={`py-1 rounded text-xs border ${
                    data.borderRadius === r
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Relleno Interior (Padding)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Compacto', v: '12px' },
                { label: 'Normal', v: '20px' },
                { label: 'Amplio', v: '32px' },
              ].map((p) => (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => {
                    update('paddingTop', p.v);
                    update('paddingBottom', p.v);
                    update('paddingLeft', p.v);
                    update('paddingRight', p.v);
                  }}
                  className={`py-1 rounded text-xs border ${
                    data.paddingTop === p.v
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADING INSPECTOR */}
      {type === 'heading' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Texto del Encabezado</label>
            <input
              type="text"
              value={data.content || ''}
              onChange={(e) => update('content', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tamaño</label>
              <select
                value={data.fontSize || '26px'}
                onChange={(e) => update('fontSize', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="20px">Pequeño (20px)</option>
                <option value="24px">Mediano (24px)</option>
                <option value="28px">Grande (28px)</option>
                <option value="34px">Extra (34px)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alineación</label>
              <div className="grid grid-cols-3 gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => update('textAlign', align)}
                    className={`py-1 rounded text-xs capitalize border ${
                      data.textAlign === align
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {align === 'left' ? 'Izq' : align === 'center' ? 'Cen' : 'Der'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Color del Texto</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.color || '#0f172a'}
                onChange={(e) => update('color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={data.color || '#0f172a'}
                onChange={(e) => update('color', e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEXT PARAGRAPH INSPECTOR */}
      {type === 'text' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Contenido del Párrafo</label>
            <textarea
              rows={4}
              value={data.content || ''}
              onChange={(e) => update('content', e.target.value)}
              placeholder="Escribe tu texto... (usa **negrita** para resaltar)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[10px] text-slate-500">Consejo: usa **texto** para negrita y saltos de línea para párrafos.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tamaño de Fuente</label>
              <select
                value={data.fontSize || '15px'}
                onChange={(e) => update('fontSize', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="13px">13px - Pequeño</option>
                <option value="14px">14px - Regular</option>
                <option value="15px">15px - Estándar</option>
                <option value="16px">16px - Cómodo</option>
                <option value="18px">18px - Destacado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alineación</label>
              <div className="grid grid-cols-3 gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => update('textAlign', align)}
                    className={`py-1 rounded text-xs capitalize border ${
                      data.textAlign === align
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {align === 'left' ? 'Izq' : align === 'center' ? 'Cen' : 'Der'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Color del Texto</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.color || '#334155'}
                onChange={(e) => update('color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={data.color || '#334155'}
                onChange={(e) => update('color', e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* IMAGE INSPECTOR */}
      {type === 'image' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">URL de la Imagen</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Texto Alternativo (Alt)</label>
            <input
              type="text"
              value={data.alt || ''}
              onChange={(e) => update('alt', e.target.value)}
              placeholder="Descripción de la imagen"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Enlace al hacer clic (Opcional)</label>
            <input
              type="text"
              value={data.linkUrl || ''}
              onChange={(e) => update('linkUrl', e.target.value)}
              placeholder="https://ejemplo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ancho</label>
              <select
                value={data.width || '100%'}
                onChange={(e) => update('width', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="100%">100% (Ancho completo)</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="300px">300px</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Esquinas</label>
              <select
                value={data.borderRadius || '8px'}
                onChange={(e) => update('borderRadius', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="0px">Rectas (0px)</option>
                <option value="8px">Suaves (8px)</option>
                <option value="16px">Redondeadas (16px)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* BUTTON INSPECTOR */}
      {type === 'button' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Texto del Botón</label>
            <input
              type="text"
              value={data.text || ''}
              onChange={(e) => update('text', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Enlace de Destino (URL)</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color de Fondo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.backgroundColor || '#536df3'}
                  onChange={(e) => update('backgroundColor', e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400">{data.backgroundColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color del Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.textColor || '#ffffff'}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400">{data.textColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alineación</label>
              <div className="grid grid-cols-3 gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => update('alignment', align)}
                    className={`py-1 rounded text-xs capitalize border ${
                      data.alignment === align
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {align === 'left' ? 'Izq' : align === 'center' ? 'Cen' : 'Der'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Radio de Bordes</label>
              <select
                value={data.borderRadius || '8px'}
                onChange={(e) => update('borderRadius', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="0px">Recto (0px)</option>
                <option value="6px">Redondeado (6px)</option>
                <option value="12px">Curvo (12px)</option>
                <option value="9999px">Píldora (Redondo)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* DIVIDER INSPECTOR */}
      {type === 'divider' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Color de la Línea</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.color || '#e2e8f0'}
                onChange={(e) => update('color', e.target.value)}
                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400">{data.color}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Grosor</label>
              <select
                value={data.thickness || '1px'}
                onChange={(e) => update('thickness', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="1px">1px</option>
                <option value="2px">2px</option>
                <option value="3px">3px</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estilo</label>
              <select
                value={data.style || 'solid'}
                onChange={(e) => update('style', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="solid">Sólido</option>
                <option value="dashed">Discontinuo</option>
                <option value="dotted">Punteado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SPACER INSPECTOR */}
      {type === 'spacer' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Altura del Espacio</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['12px', '24px', '36px', '48px'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update('height', h)}
                  className={`py-1.5 rounded text-xs border ${
                    data.height === h
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL INSPECTOR */}
      {type === 'social' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Ingresa las URLs de las redes que desees mostrar (deja vacías las que no):</p>
          {['youtube', 'instagram', 'twitter', 'github', 'linkedin', 'facebook'].map((net) => (
            <div key={net} className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 capitalize">{net}</label>
              <input
                type="text"
                value={data[net] || ''}
                onChange={(e) => update(net, e.target.value)}
                placeholder={`https://${net}.com/...`}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* GRID / 2 COLUMNS INSPECTOR */}
      {type === 'grid' && (
        <div className="space-y-4">
          {/* Proportion Layout */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Columns2 className="w-3.5 h-3.5 text-teal-400" />
              Proporción de Columnas
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: '30-70', label: '30% / 70% (Logo + Texto)' },
                { id: '50-50', label: '50% / 50% (Mitad y Mitad)' },
                { id: '70-30', label: '70% / 30% (Texto + Logo)' },
                { id: '25-75', label: '25% / 75% (Icono + Texto)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update('layout', opt.id)}
                  className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left truncate transition ${
                    (data.layout || '30-70') === opt.id
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Alignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Alineación Vertical</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'top', label: 'Arriba' },
                { id: 'middle', label: 'Al Centro' },
                { id: 'bottom', label: 'Abajo' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update('verticalAlign', v.id)}
                  className={`py-1.5 rounded text-xs border transition ${
                    (data.verticalAlign || 'middle') === v.id
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Left Column Config */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-teal-400">Columna Izquierda</span>
              <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => update('leftType', 'image')}
                  className={`px-2 py-0.5 rounded transition ${
                    (data.leftType || 'image') === 'image' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Logo/Imagen
                </button>
                <button
                  type="button"
                  onClick={() => update('leftType', 'text')}
                  className={`px-2 py-0.5 rounded transition ${
                    data.leftType === 'text' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Texto
                </button>
              </div>
            </div>

            {(data.leftType || 'image') === 'image' ? (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">URL de Imagen / Logo</label>
                  <input
                    type="text"
                    value={data.leftImage?.url || ''}
                    onChange={(e) => updateLeftImage('url', e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Ancho Imagen</label>
                    <input
                      type="text"
                      value={data.leftImage?.width || '100px'}
                      onChange={(e) => updateLeftImage('width', e.target.value)}
                      placeholder="ej. 90px o 100%"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Alineación</label>
                    <select
                      value={data.leftImage?.alignment || 'center'}
                      onChange={(e) => updateLeftImage('alignment', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Enlace al hacer clic (opcional)</label>
                  <input
                    type="text"
                    value={data.leftImage?.linkUrl || ''}
                    onChange={(e) => updateLeftImage('linkUrl', e.target.value)}
                    placeholder="https://novatech.io"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Título (opcional)</label>
                  <input
                    type="text"
                    value={data.leftText?.heading || ''}
                    onChange={(e) => updateLeftText('heading', e.target.value)}
                    placeholder="Título columna izquierda"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Contenido</label>
                  <textarea
                    rows={3}
                    value={data.leftText?.content || ''}
                    onChange={(e) => updateLeftText('content', e.target.value)}
                    placeholder="Escribe el texto aquí..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column Config */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-teal-400">Columna Derecha</span>
              <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => update('rightType', 'text')}
                  className={`px-2 py-0.5 rounded transition ${
                    (data.rightType || 'text') === 'text' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => update('rightType', 'image')}
                  className={`px-2 py-0.5 rounded transition ${
                    data.rightType === 'image' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Imagen
                </button>
              </div>
            </div>

            {(data.rightType || 'text') === 'text' ? (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Título Principal</label>
                  <input
                    type="text"
                    value={data.rightText?.heading || ''}
                    onChange={(e) => updateRightText('heading', e.target.value)}
                    placeholder="NovaTech Solutions"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Tamaño Título</label>
                    <select
                      value={data.rightText?.headingSize || '20px'}
                      onChange={(e) => updateRightText('headingSize', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="16px">16px - Pequeño</option>
                      <option value="18px">18px - Mediano</option>
                      <option value="20px">20px - Estándar</option>
                      <option value="24px">24px - Grande</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Alineación</label>
                    <select
                      value={data.rightText?.alignment || 'left'}
                      onChange={(e) => updateRightText('alignment', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Párrafo / Subtítulo</label>
                  <textarea
                    rows={3}
                    value={data.rightText?.content || ''}
                    onChange={(e) => updateRightText('content', e.target.value)}
                    placeholder="Escribe el texto de la columna..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white resize-none"
                  />
                </div>

                {/* Optional button */}
                <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Botón de Acción (Opcional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.rightText?.buttonText || ''}
                      onChange={(e) => updateRightText('buttonText', e.target.value)}
                      placeholder="Texto botón (ej. Ver Más)"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={data.rightText?.buttonUrl || ''}
                      onChange={(e) => updateRightText('buttonUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">URL de Imagen</label>
                  <input
                    type="text"
                    value={data.rightImage?.url || ''}
                    onChange={(e) => updateRightImage('url', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Container Styling (Background) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Fondo del Bloque Grid</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Transparente', color: 'transparent' },
                { label: 'Gris Suave', color: '#f8fafc' },
                { label: 'Gris Claro', color: '#f1f5f9' },
                { label: 'Blanco', color: '#ffffff' },
                { label: 'Oscuro', color: '#0f172a' },
              ].map((bg) => (
                <button
                  key={bg.label}
                  type="button"
                  onClick={() => update('backgroundColor', bg.color)}
                  className={`px-2.5 py-1 rounded text-[11px] border ${
                    (data.backgroundColor || 'transparent') === bg.color
                      ? 'border-brand-500 bg-brand-500/20 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLE INSPECTOR */}
      {type === 'table' && (
        <div className="space-y-4">
          {/* Quick Theme Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              Estilos y Temas de Tabla
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'modern-slate', label: 'Moderno Slate' },
                { id: 'blue-pro', label: 'Azul Pro' },
                { id: 'emerald', label: 'Esmeralda' },
                { id: 'minimal', label: 'Minimalista' },
              ].map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => applyTableTheme(thm.id)}
                  className="px-2 py-1.5 rounded text-[11px] font-medium border bg-slate-950 text-slate-300 border-slate-800 hover:border-brand-500 hover:text-white transition text-left truncate"
                >
                  {thm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column & Row Management Actions */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={addTableRow}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Fila</span>
            </button>
            <button
              type="button"
              onClick={addTableColumn}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Columna</span>
            </button>
          </div>

          {/* Headers Editor */}
          <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-xs font-bold text-cyan-400">Cabeceras de la Tabla</span>
            <div className="space-y-1.5">
              {(data.headers || []).map((header, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500 font-mono w-4">{idx + 1}</span>
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => updateTableHeader(idx, e.target.value)}
                    placeholder={`Columna ${idx + 1}`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                  {(data.headers || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTableColumn(idx)}
                      title="Eliminar columna"
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rows & Cells Editor */}
          <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-xs font-bold text-cyan-400">Filas y Contenido</span>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {(data.rows || []).map((row, rIdx) => (
                <div key={rIdx} className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Fila {rIdx + 1}</span>
                    {(data.rows || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTableRow(rIdx)}
                        title="Eliminar fila"
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {row.map((cell, cIdx) => (
                      <input
                        key={cIdx}
                        type="text"
                        value={cell}
                        onChange={(e) => updateTableCell(rIdx, cIdx, e.target.value)}
                        placeholder={data.headers?.[cIdx] || `Celda ${cIdx + 1}`}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Styling Options */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Filas Alternadas (Cebra)</label>
              <input
                type="checkbox"
                checked={data.striped !== false}
                onChange={(e) => update('striped', e.target.checked)}
                className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Fondo Cabecera</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="color"
                    value={data.headerBgColor || '#0f172a'}
                    onChange={(e) => update('headerBgColor', e.target.value)}
                    className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-slate-400 truncate">{data.headerBgColor || '#0f172a'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Borde de Tabla</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="color"
                    value={data.borderColor || '#e2e8f0'}
                    onChange={(e) => update('borderColor', e.target.value)}
                    className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-slate-400 truncate">{data.borderColor || '#e2e8f0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
