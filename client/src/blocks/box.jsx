import React from 'react';
import { Box, Plus, Trash2, ArrowUp, ArrowDown, Type } from 'lucide-react';
import { renderFormattedText, formatTextContent, sanitizeColor, sanitizeCssValue, escapeHtml, sanitizeUrl } from './blockHelpers.jsx';
import { BoxBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'box',
  label: 'Caja / Contenedor',
  category: 'layout',
  icon: Box,
  defaultData: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    borderWidth: '1px',
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    borderLeftColor: '#2563eb',
    borderLeftWidth: '4px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '24px',
    paddingRight: '24px',
    children: [
      {
        id: `child-${Date.now()}-1`,
        type: 'heading',
        data: {
          content: 'Título Destacado',
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e3a8a',
          textAlign: 'left',
          paddingTop: '0px',
          paddingBottom: '4px',
        },
      },
      {
        id: `child-${Date.now()}-2`,
        type: 'text',
        data: {
          content: 'Este es un mensaje importante contenido dentro de una caja con borde de acento.',
          fontSize: '14px',
          fontWeight: '400',
          color: '#334155',
          textAlign: 'left',
          lineHeight: '1.6',
          paddingTop: '0px',
          paddingBottom: '0px',
        },
      },
    ],
  },
  schema: BoxBlockDataSchema,

  render({ data = {} }) {
    const {
      backgroundColor = '#f8fafc',
      borderRadius = '14px',
      borderWidth = '1px',
      borderColor = '#e2e8f0',
      borderStyle = 'solid',
      borderLeftColor,
      borderLeftWidth = '4px',
      boxShadow,
      paddingTop = '20px',
      paddingBottom = '20px',
      paddingLeft = '24px',
      paddingRight = '24px',
      children = [],
    } = data;

    return (
      <div className="py-2">
        <div
          style={{
            backgroundColor,
            borderRadius,
            border: `${borderWidth} ${borderStyle} ${borderColor}`,
            ...(borderLeftColor ? {
              borderLeft: `${borderLeftWidth} solid ${borderLeftColor}`,
            } : {}),
            boxShadow: boxShadow || (borderLeftColor ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'),
            paddingTop,
            paddingBottom,
            paddingLeft,
            paddingRight,
          }}
        >
          {children && children.length > 0 ? (
            <div className="space-y-2.5">
              {children.map((child) => (
                <div key={child.id} className="relative">
                  {child.type === 'heading' && (
                    <h3
                      style={{
                        fontSize: child.data?.fontSize || '18px',
                        fontWeight: child.data?.fontWeight || '700',
                        color: child.data?.color || '#0f172a',
                        textAlign: child.data?.textAlign || 'left',
                        marginBottom: '4px',
                        lineHeight: 1.3,
                      }}
                    >
                      {child.data?.content || 'Título en caja'}
                    </h3>
                  )}
                  {child.type === 'text' && (
                    <div
                      style={{
                        fontSize: child.data?.fontSize || '14px',
                        fontWeight: child.data?.fontWeight || '400',
                        color: child.data?.color || '#475569',
                        lineHeight: child.data?.lineHeight || '1.6',
                        textAlign: child.data?.textAlign || 'left',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {renderFormattedText(child.data?.content || 'Texto dentro de la caja...')}
                    </div>
                  )}
                  {child.type === 'button' && (
                    <div style={{ textAlign: child.data?.alignment || 'left', paddingTop: '6px', paddingBottom: '4px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: child.data?.backgroundColor || '#2563eb',
                          color: child.data?.textColor || '#ffffff',
                          padding: `${child.data?.paddingY || '10px'} ${child.data?.paddingX || '20px'}`,
                          borderRadius: child.data?.borderRadius || '8px',
                          fontWeight: child.data?.fontWeight || '700',
                          fontSize: child.data?.fontSize || '13px',
                        }}
                      >
                        {child.data?.text || 'Botón de Acción'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
              <p className="text-xs text-slate-500 font-semibold">Caja contenedora vacía</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Usa el inspector lateral para agregar textos, títulos o botones.</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  compileHtml(data = {}, compileChild) {
    const {
      backgroundColor = '#f8fafc',
      borderRadius = '14px',
      borderWidth = '1px',
      borderColor = '#e2e8f0',
      borderStyle = 'solid',
      borderLeftColor,
      borderLeftWidth = '4px',
      boxShadow,
      paddingTop = '20px',
      paddingBottom = '20px',
      paddingLeft = '24px',
      paddingRight = '24px',
      children = [],
    } = data;

    const safeBgColor = sanitizeColor(backgroundColor, '#f8fafc');
    const safeBorderRadius = sanitizeCssValue(borderRadius, '14px');
    const safeBorderWidth = sanitizeCssValue(borderWidth, '1px');
    const safeBorderColor = sanitizeColor(borderColor, '#e2e8f0');
    const safeBorderStyle = sanitizeCssValue(borderStyle, 'solid');
    const safeBorderLeftColor = borderLeftColor ? sanitizeColor(borderLeftColor) : null;
    const safeBorderLeftWidth = sanitizeCssValue(borderLeftWidth, '4px');
    const safeBoxShadow = boxShadow ? sanitizeCssValue(boxShadow) : (safeBorderLeftColor ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : '');
    const safePaddingTop = sanitizeCssValue(paddingTop, '20px');
    const safePaddingBottom = sanitizeCssValue(paddingBottom, '20px');
    const safePaddingLeft = sanitizeCssValue(paddingLeft, '24px');
    const safePaddingRight = sanitizeCssValue(paddingRight, '24px');

    const childrenHtml = children.map(child => {
      if (typeof compileChild === 'function') {
        return compileChild(child);
      }
      // Fallback child compilation if compileChild is not passed
      if (child.type === 'heading') {
        return `<tr><td><h3 style="margin: 0 0 6px 0; font-size: ${sanitizeCssValue(child.data?.fontSize, '18px')}; font-weight: 700; color: ${sanitizeColor(child.data?.color, '#0f172a')}; line-height: 1.3;">${formatTextContent(child.data?.content || '')}</h3></td></tr>`;
      }
      if (child.type === 'text') {
        return `<tr><td><p style="margin: 0; font-size: ${sanitizeCssValue(child.data?.fontSize, '14px')}; color: ${sanitizeColor(child.data?.color, '#475569')}; line-height: 1.6;">${formatTextContent(child.data?.content || '')}</p></td></tr>`;
      }
      if (child.type === 'button') {
        const btnAlign = sanitizeCssValue(child.data?.alignment, 'left');
        const btnBg = sanitizeColor(child.data?.backgroundColor, '#2563eb');
        const btnTextColor = sanitizeColor(child.data?.textColor, '#ffffff');
        const btnRadius = sanitizeCssValue(child.data?.borderRadius, '8px');
        const btnPadY = sanitizeCssValue(child.data?.paddingY, '10px');
        const btnPadX = sanitizeCssValue(child.data?.paddingX, '20px');
        const btnFontSize = sanitizeCssValue(child.data?.fontSize, '13px');
        const btnFontWeight = sanitizeCssValue(child.data?.fontWeight, '700');
        const btnUrl = sanitizeUrl(child.data?.url, '#');

        return `
          <tr>
            <td align="${btnAlign}" style="padding-top: 10px; padding-bottom: 4px; text-align: ${btnAlign};">
              <table border="0" cellpadding="0" cellspacing="0" align="${btnAlign}" role="presentation" style="margin: ${btnAlign === 'center' ? '0 auto' : btnAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0'}; border-collapse: separate !important; border-spacing: 0;">
                <tr>
                  <td align="center" bgcolor="${btnBg}" valign="middle" style="background-color: ${btnBg}; border-radius: ${btnRadius}; -webkit-border-radius: ${btnRadius}; -moz-border-radius: ${btnRadius}; mso-padding-alt: ${btnPadY} ${btnPadX};">
                    <a href="${btnUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: ${btnPadY} ${btnPadX}; mso-padding-alt: 0px; font-family: inherit; font-size: ${btnFontSize}; font-weight: ${btnFontWeight}; color: ${btnTextColor}; text-decoration: none; border-radius: ${btnRadius}; -webkit-border-radius: ${btnRadius}; -moz-border-radius: ${btnRadius}; background-color: ${btnBg}; text-align: center; border: 1px solid ${btnBg}; line-height: 120%;">
                      ${escapeHtml(child.data?.text || 'Botón')}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }
      return '';
    }).join('');

    const borderLeftCss = safeBorderLeftColor ? `border-left: ${safeBorderLeftWidth} solid ${safeBorderLeftColor} !important;` : '';
    const shadowCss = safeBoxShadow ? `box-shadow: ${safeBoxShadow};` : '';

    return `
      <tr>
        <td style="padding: 12px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: ${safeBorderRadius}; -webkit-border-radius: ${safeBorderRadius}; -moz-border-radius: ${safeBorderRadius}; ${shadowCss}">
            <tr>
              <td style="background-color: ${safeBgColor}; border: ${safeBorderWidth} ${safeBorderStyle} ${safeBorderColor}; ${borderLeftCss} border-radius: ${safeBorderRadius}; -webkit-border-radius: ${safeBorderRadius}; -moz-border-radius: ${safeBorderRadius}; overflow: hidden; padding: ${safePaddingTop} ${safePaddingRight} ${safePaddingBottom} ${safePaddingLeft}; ${shadowCss}" bgcolor="${safeBgColor}">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border-spacing: 0;">
                  ${childrenHtml}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    const children = data.children || [];

    const addBoxChild = (childType) => {
      const newChild = {
        id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: childType,
        data: childType === 'heading'
          ? { content: 'Nuevo Título', fontSize: '18px', fontWeight: '700', color: '#0f172a' }
          : childType === 'button'
          ? { text: 'Botón de Acción', url: 'https://example.com', backgroundColor: '#2563eb', textColor: '#ffffff' }
          : { content: 'Nuevo párrafo dentro de la caja...', fontSize: '14px', color: '#475569' },
      };
      update('children', [...children, newChild]);
    };

    const updateBoxChild = (childId, field, val) => {
      const updated = children.map(c => {
        if (c.id === childId) {
          return { ...c, data: { ...(c.data || {}), [field]: val } };
        }
        return c;
      });
      update('children', updated);
    };

    const removeBoxChild = (childId) => {
      update('children', children.filter(c => c.id !== childId));
    };

    const moveBoxChild = (index, dir) => {
      const newIdx = index + dir;
      if (newIdx < 0 || newIdx >= children.length) return;
      const copy = [...children];
      const item = copy.splice(index, 1)[0];
      copy.splice(newIdx, 0, item);
      update('children', copy);
    };

    return (
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

        {/* Children Editor */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-brand-400" />
                <span>Contenido Interior</span>
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Modifica elementos dentro de la caja.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {children.length} elem.
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => addBoxChild('heading')}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3 text-brand-400" />
              <span>+ Título</span>
            </button>
            <button
              type="button"
              onClick={() => addBoxChild('text')}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>+ Texto</span>
            </button>
            <button
              type="button"
              onClick={() => addBoxChild('button')}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              <span>+ Botón</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {children.map((child, cIdx) => (
              <div
                key={child.id}
                className="p-3 rounded-xl bg-[#0e1320] border border-slate-800 space-y-2.5 relative"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-xs">
                  <span className="text-[10px] font-bold text-brand-300">
                    {child.type === 'heading' ? 'Título' : child.type === 'button' ? 'Botón CTA' : 'Párrafo'} #{cIdx + 1}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => moveBoxChild(cIdx, -1)}
                      disabled={cIdx === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBoxChild(cIdx, 1)}
                      disabled={cIdx === children.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBoxChild(child.id)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {child.type === 'heading' && (
                  <input
                    type="text"
                    value={child.data?.content || ''}
                    onChange={(e) => updateBoxChild(child.id, 'content', e.target.value)}
                    className="w-full bg-[#070b13] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                  />
                )}
                {child.type === 'text' && (
                  <textarea
                    rows={2}
                    value={child.data?.content || ''}
                    onChange={(e) => updateBoxChild(child.id, 'content', e.target.value)}
                    className="w-full bg-[#070b13] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                  />
                )}
                {child.type === 'button' && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={child.data?.text || ''}
                      onChange={(e) => updateBoxChild(child.id, 'text', e.target.value)}
                      placeholder="Texto del botón"
                      className="w-full bg-[#070b13] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      value={child.data?.url || ''}
                      onChange={(e) => updateBoxChild(child.id, 'url', e.target.value)}
                      placeholder="URL destino"
                      className="w-full bg-[#070b13] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
