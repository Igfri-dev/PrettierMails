import React from 'react';
import { Heading1, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { renderFormattedText, formatTextContent, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { HeadingBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'heading',
  label: 'Encabezado',
  category: 'typography',
  icon: Heading1,
  defaultData: {
    content: 'Título Principal del Correo',
    fontSize: '26px',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'left',
    paddingTop: '12px',
    paddingBottom: '12px',
  },
  schema: HeadingBlockDataSchema,

  render({ data = {} }) {
    const {
      content = 'Encabezado',
      fontSize = '26px',
      fontWeight = '700',
      color = '#0f172a',
      textAlign = 'left',
      paddingTop = '12px',
      paddingBottom = '12px',
    } = data;

    return (
      <div style={{ paddingTop, paddingBottom, textAlign }}>
        <h2
          style={{
            fontSize,
            fontWeight,
            color,
            textAlign,
            lineHeight: 1.3,
          }}
        >
          {renderFormattedText(content)}
        </h2>
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      content = 'Encabezado',
      fontSize = '26px',
      fontWeight = '700',
      color = '#0f172a',
      textAlign = 'left',
      paddingTop = '12px',
      paddingBottom = '12px',
    } = data;

    const safeFontSize = sanitizeCssValue(fontSize, '26px');
    const safeFontWeight = sanitizeCssValue(fontWeight, '700');
    const safeColor = sanitizeColor(color, '#0f172a');
    const safeTextAlign = sanitizeCssValue(textAlign, 'left');
    const safePaddingTop = sanitizeCssValue(paddingTop, '12px');
    const safePaddingBottom = sanitizeCssValue(paddingBottom, '12px');

    return `
      <tr>
        <td align="${safeTextAlign}" style="padding-top: ${safePaddingTop}; padding-bottom: ${safePaddingBottom}; padding-left: 0; padding-right: 0;">
          <h2 style="margin: 0; font-size: ${safeFontSize}; font-weight: ${safeFontWeight}; color: ${safeColor}; text-align: ${safeTextAlign}; line-height: 1.3; font-family: inherit;">
            ${formatTextContent(content)}
          </h2>
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Texto del Encabezado</label>
          <textarea
            rows={2}
            value={data.content || ''}
            onChange={(e) => update('content', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Tamaño</label>
            <select
              value={data.fontSize || '26px'}
              onChange={(e) => update('fontSize', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="20px">20px (Pequeño)</option>
              <option value="24px">24px (Mediano)</option>
              <option value="26px">26px (Estándar)</option>
              <option value="30px">30px (Grande)</option>
              <option value="36px">36px (Extra Grande)</option>
              <option value="42px">42px (Hero)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Grosor</label>
            <select
              value={data.fontWeight || '700'}
              onChange={(e) => update('fontWeight', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="400">Regular (400)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extrabold (800)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Color</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <input
                type="color"
                value={data.color || '#0f172a'}
                onChange={(e) => update('color', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={data.color || '#0f172a'}
                onChange={(e) => update('color', e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Alineación</label>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              {[
                { align: 'left', icon: AlignLeft },
                { align: 'center', icon: AlignCenter },
                { align: 'right', icon: AlignRight },
              ].map(({ align, icon: Icon }) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => update('textAlign', align)}
                  className={`flex-1 p-1 rounded flex items-center justify-center transition ${
                    (data.textAlign || 'left') === align ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Padding Sup.</label>
            <input
              type="text"
              value={data.paddingTop || '12px'}
              onChange={(e) => update('paddingTop', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Padding Inf.</label>
            <input
              type="text"
              value={data.paddingBottom || '12px'}
              onChange={(e) => update('paddingBottom', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>
    );
  },
};
