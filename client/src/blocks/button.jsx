import React from 'react';
import { MousePointerClick, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { escapeHtml, sanitizeUrl, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { ButtonBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'button',
  label: 'Botón CTA',
  category: 'content',
  icon: MousePointerClick,
  defaultData: {
    text: 'Hacer clic aquí &rarr;',
    url: 'https://example.com',
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    paddingX: '32px',
    paddingY: '14px',
    alignment: 'center',
    fullWidth: false,
    boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
    letterSpacing: '0.015em',
  },
  schema: ButtonBlockDataSchema,

  render({ data = {} }) {
    const {
      text = 'Hacer clic aquí',
      url = '#',
      backgroundColor = '#2563eb',
      textColor = '#ffffff',
      borderRadius = '12px',
      fontSize = '15px',
      fontWeight = '700',
      paddingX = '32px',
      paddingY = '14px',
      alignment = 'center',
      fullWidth = false,
      boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
      letterSpacing = '0.015em',
    } = data;

    return (
      <div style={{ paddingTop: '14px', paddingBottom: '14px', textAlign: alignment }}>
        <a
          href={url}
          onClick={(e) => e.preventDefault()}
          style={{
            display: fullWidth ? 'block' : 'inline-block',
            backgroundColor,
            color: textColor,
            borderRadius,
            fontSize,
            fontWeight,
            padding: `${paddingY} ${paddingX}`,
            textDecoration: 'none',
            boxShadow,
            letterSpacing,
          }}
        >
          {text}
        </a>
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      text = 'Hacer clic aquí',
      url = 'https://example.com',
      backgroundColor = '#2563eb',
      textColor = '#ffffff',
      borderRadius = '12px',
      fontSize = '15px',
      fontWeight = '700',
      paddingX = '32px',
      paddingY = '14px',
      alignment = 'center',
      fullWidth = false,
      boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
      letterSpacing = '0.015em',
    } = data;

    const safeUrl = sanitizeUrl(url, '#');
    const safeBg = sanitizeColor(backgroundColor, '#2563eb');
    const safeTextColor = sanitizeColor(textColor, '#ffffff');
    const safeBorderRadius = sanitizeCssValue(borderRadius, '12px');
    const safeFontSize = sanitizeCssValue(fontSize, '15px');
    const safeFontWeight = sanitizeCssValue(fontWeight, '700');
    const safePadX = sanitizeCssValue(paddingX, '32px');
    const safePadY = sanitizeCssValue(paddingY, '14px');
    const safeAlign = sanitizeCssValue(alignment, 'center');
    const safeShadow = boxShadow ? sanitizeCssValue(boxShadow) : '';
    const safeLetterSpacing = letterSpacing ? sanitizeCssValue(letterSpacing) : 'normal';

    return `
      <tr>
        <td align="${safeAlign}" style="padding: 16px 0; text-align: ${safeAlign};">
          <table border="0" cellpadding="0" cellspacing="0" align="${safeAlign}" role="presentation" ${fullWidth ? 'width="100%"' : ''} style="margin: ${safeAlign === 'center' ? '0 auto' : safeAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0'}; border-collapse: separate !important; border-spacing: 0;">
            <tr>
              <td align="center" bgcolor="${safeBg}" valign="middle" style="background-color: ${safeBg}; border-radius: ${safeBorderRadius}; -webkit-border-radius: ${safeBorderRadius}; -moz-border-radius: ${safeBorderRadius}; mso-padding-alt: ${safePadY} ${safePadX}; box-shadow: ${safeShadow};">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: ${fullWidth ? 'block' : 'inline-block'}; padding: ${safePadY} ${safePadX}; mso-padding-alt: 0px; font-family: inherit; font-size: ${safeFontSize}; font-weight: ${safeFontWeight}; color: ${safeTextColor}; text-decoration: none; border-radius: ${safeBorderRadius}; -webkit-border-radius: ${safeBorderRadius}; -moz-border-radius: ${safeBorderRadius}; background-color: ${safeBg}; text-align: center; border: 1px solid ${safeBg}; box-sizing: border-box; letter-spacing: ${safeLetterSpacing}; line-height: 120%; ${fullWidth ? 'width: 100%;' : ''}">
                  ${escapeHtml(text)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Texto del Botón</label>
          <input
            type="text"
            value={data.text || ''}
            onChange={(e) => update('text', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Enlace de Destino (URL)</label>
          <input
            type="text"
            value={data.url || ''}
            onChange={(e) => update('url', e.target.value)}
            placeholder="https://tudominio.com/..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Color de Fondo</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <input
                type="color"
                value={data.backgroundColor || '#2563eb'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={data.backgroundColor || '#2563eb'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Color del Texto</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <input
                type="color"
                value={data.textColor || '#ffffff'}
                onChange={(e) => update('textColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={data.textColor || '#ffffff'}
                onChange={(e) => update('textColor', e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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
                  onClick={() => update('alignment', align)}
                  className={`flex-1 p-1 rounded flex items-center justify-center transition ${
                    (data.alignment || 'center') === align ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Esquinas</label>
            <select
              value={data.borderRadius || '12px'}
              onChange={(e) => update('borderRadius', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="0px">Cuadrado (0px)</option>
              <option value="6px">Sutil (6px)</option>
              <option value="12px">Redondeado (12px)</option>
              <option value="9999px">Píldora (Pill)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="btn-full-width"
            checked={Boolean(data.fullWidth)}
            onChange={(e) => update('fullWidth', e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="btn-full-width" className="text-xs text-slate-300 select-none cursor-pointer">
            Ocupar todo el ancho (Full Width)
          </label>
        </div>
      </div>
    );
  },
};
