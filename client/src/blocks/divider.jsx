import React from 'react';
import { Minus } from 'lucide-react';
import { sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { DividerBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'divider',
  label: 'Divisor',
  category: 'layout',
  icon: Minus,
  defaultData: {
    color: '#e2e8f0',
    thickness: '1px',
    style: 'solid',
    paddingTop: '16px',
    paddingBottom: '16px',
    width: '100%',
  },
  schema: DividerBlockDataSchema,

  render({ data = {} }) {
    const {
      color = '#e2e8f0',
      thickness = '1px',
      style = 'solid',
      paddingTop = '16px',
      paddingBottom = '16px',
      width = '100%',
    } = data;

    return (
      <div style={{ paddingTop, paddingBottom, textAlign: 'center' }}>
        <hr
          style={{
            border: 0,
            borderTop: `${thickness} ${style} ${color}`,
            width,
            margin: '0 auto',
          }}
        />
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      color = '#e2e8f0',
      thickness = '1px',
      style = 'solid',
      paddingTop = '16px',
      paddingBottom = '16px',
      width = '100%',
    } = data;

    const safeColor = sanitizeColor(color, '#e2e8f0');
    const safeThickness = sanitizeCssValue(thickness, '1px');
    const safeStyle = sanitizeCssValue(style, 'solid');
    const safeWidth = sanitizeCssValue(width, '100%');
    const safePadTop = sanitizeCssValue(paddingTop, '16px');
    const safePadBottom = sanitizeCssValue(paddingBottom, '16px');

    return `
      <tr>
        <td align="center" style="padding-top: ${safePadTop}; padding-bottom: ${safePadBottom};">
          <hr style="border: 0; border-top: ${safeThickness} ${safeStyle} ${safeColor}; margin: 0; width: ${safeWidth};" />
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Color del Divisor</label>
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <input
              type="color"
              value={data.color || '#e2e8f0'}
              onChange={(e) => update('color', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={data.color || '#e2e8f0'}
              onChange={(e) => update('color', e.target.value)}
              className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Grosor</label>
            <select
              value={data.thickness || '1px'}
              onChange={(e) => update('thickness', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="1px">1px (Fino)</option>
              <option value="2px">2px (Medio)</option>
              <option value="4px">4px (Grueso)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Estilo</label>
            <select
              value={data.style || 'solid'}
              onChange={(e) => update('style', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="solid">Sólido</option>
              <option value="dashed">Guiones</option>
              <option value="dotted">Puntos</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Ancho</label>
            <select
              value={data.width || '100%'}
              onChange={(e) => update('width', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="100%">100% (Completo)</option>
              <option value="80%">80%</option>
              <option value="60%">60%</option>
              <option value="40%">40% (Centrado)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Espaciado</label>
            <input
              type="text"
              value={data.paddingTop || '16px'}
              onChange={(e) => {
                update('paddingTop', e.target.value);
                update('paddingBottom', e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>
    );
  },
};
