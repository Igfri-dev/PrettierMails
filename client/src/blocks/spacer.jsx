import React from 'react';
import { MoveVertical } from 'lucide-react';
import { sanitizeCssValue } from './blockHelpers.jsx';
import { SpacerBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'spacer',
  label: 'Espaciador',
  category: 'layout',
  icon: MoveVertical,
  defaultData: {
    height: '24px',
  },
  schema: SpacerBlockDataSchema,

  render({ data = {} }) {
    const { height = '24px' } = data;

    return (
      <div
        style={{ height }}
        className="border border-dashed border-slate-300/40 rounded flex items-center justify-center text-[10px] text-slate-400 select-none"
      >
        Espacio {height}
      </div>
    );
  },

  compileHtml(data = {}) {
    const { height = '24px' } = data;
    const safeHeight = sanitizeCssValue(height, '24px');
    const numericHeight = parseInt(safeHeight, 10) || 24;

    return `
      <tr>
        <td height="${numericHeight}" style="font-size: 0px; line-height: 0px; height: ${safeHeight};">
          &nbsp;
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Altura del Espacio</label>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {['12px', '24px', '36px', '48px'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => update('height', h)}
                className={`py-1.5 rounded text-xs border transition ${
                  data.height === h
                    ? 'bg-brand-600 text-white border-brand-500 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={data.height || '24px'}
            onChange={(e) => update('height', e.target.value)}
            placeholder="ej. 30px"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
    );
  },
};
