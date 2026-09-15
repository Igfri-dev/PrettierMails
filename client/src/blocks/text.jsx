import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { renderFormattedText, formatTextContent, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { TextBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'text',
  label: 'Texto',
  category: 'typography',
  icon: Type,
  defaultData: {
    content: 'Escribe aquí el contenido principal de tu correo. Puedes usar negritas con **texto** o cursivas con *texto*.',
    fontSize: '15px',
    fontWeight: '400',
    color: '#334155',
    textAlign: 'left',
    lineHeight: '1.6',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  schema: TextBlockDataSchema,

  render({ data = {} }) {
    const {
      content = 'Escribe aquí tu texto...',
      fontSize = '15px',
      fontWeight = '400',
      color = '#334155',
      textAlign = 'left',
      lineHeight = '1.6',
      paddingTop = '8px',
      paddingBottom = '8px',
    } = data;

    return (
      <div style={{ paddingTop, paddingBottom, textAlign }}>
        <p
          style={{
            fontSize,
            fontWeight,
            color,
            textAlign,
            lineHeight,
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderFormattedText(content)}
        </p>
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      content = 'Escribe aquí tu texto...',
      fontSize = '15px',
      fontWeight = '400',
      color = '#334155',
      textAlign = 'left',
      lineHeight = '1.6',
      paddingTop = '8px',
      paddingBottom = '8px',
    } = data;

    const safeFontSize = sanitizeCssValue(fontSize, '15px');
    const safeFontWeight = sanitizeCssValue(fontWeight, '400');
    const safeColor = sanitizeColor(color, '#334155');
    const safeTextAlign = sanitizeCssValue(textAlign, 'left');
    const safeLineHeight = sanitizeCssValue(lineHeight, '1.6');
    const safePaddingTop = sanitizeCssValue(paddingTop, '8px');
    const safePaddingBottom = sanitizeCssValue(paddingBottom, '8px');

    return `
      <tr>
        <td align="${safeTextAlign}" style="padding-top: ${safePaddingTop}; padding-bottom: ${safePaddingBottom};">
          <p style="margin: 0; font-size: ${safeFontSize}; font-weight: ${safeFontWeight}; color: ${safeColor}; text-align: ${safeTextAlign}; line-height: ${safeLineHeight}; font-family: inherit;">
            ${formatTextContent(content)}
          </p>
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Cuerpo del Texto</label>
          <textarea
            rows={4}
            value={data.content || ''}
            onChange={(e) => update('content', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Tamaño</label>
            <select
              value={data.fontSize || '15px'}
              onChange={(e) => update('fontSize', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="12px">12px (Pequeño / Legal)</option>
              <option value="14px">14px (Secundario)</option>
              <option value="15px">15px (Estándar)</option>
              <option value="16px">16px (Mediano)</option>
              <option value="18px">18px (Grande)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Interlineado</label>
            <select
              value={data.lineHeight || '1.6'}
              onChange={(e) => update('lineHeight', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="1.3">Apretado (1.3)</option>
              <option value="1.5">Normal (1.5)</option>
              <option value="1.6">Cómodo (1.6)</option>
              <option value="1.8">Amplio (1.8)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Color</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <input
                type="color"
                value={data.color || '#334155'}
                onChange={(e) => update('color', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={data.color || '#334155'}
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
                { align: 'justify', icon: AlignJustify },
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
              value={data.paddingTop || '8px'}
              onChange={(e) => update('paddingTop', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Padding Inf.</label>
            <input
              type="text"
              value={data.paddingBottom || '8px'}
              onChange={(e) => update('paddingBottom', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>
    );
  },
};
