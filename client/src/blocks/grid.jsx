import React from 'react';
import { Columns2 } from 'lucide-react';
import { renderFormattedText, formatTextContent, escapeHtml, sanitizeUrl, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { GridBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'grid',
  label: 'Cuadrícula / 2 Columnas',
  category: 'layout',
  icon: Columns2,
  defaultData: {
    layout: '30-70',
    verticalAlign: 'middle',
    gap: '16px',
    backgroundColor: 'transparent',
    borderRadius: '0px',
    borderWidth: '0px',
    borderColor: 'transparent',
    borderStyle: 'solid',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '0px',
    paddingRight: '0px',
    leftType: 'image',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      alt: 'Logo NovaTech',
      width: '90px',
      maxWidth: '110px',
      borderRadius: '8px',
      alignment: 'center',
      linkUrl: '',
    },
    leftText: {
      heading: '',
      content: '',
      color: '#334155',
      fontSize: '14px',
      alignment: 'left',
    },
    rightType: 'text',
    rightText: {
      heading: 'NovaTech Solutions',
      headingSize: '20px',
      headingColor: '#0f172a',
      content: 'Estimado colaborador, te damos una cordial bienvenida a nuestro equipo de trabajo.',
      textColor: '#475569',
      fontSize: '14px',
      lineHeight: '1.5',
      buttonText: '',
      buttonUrl: '',
      buttonBgColor: '#2563eb',
      buttonTextColor: '#ffffff',
      alignment: 'left',
    },
    rightImage: {
      url: '',
      alt: 'Imagen',
      width: '100%',
      maxWidth: '100%',
      borderRadius: '8px',
      alignment: 'center',
      linkUrl: '',
    },
  },
  schema: GridBlockDataSchema,

  render({ data = {} }) {
    let leftWidth = '30%';
    let rightWidth = '70%';
    if (data.layout === '50-50') {
      leftWidth = '50%';
      rightWidth = '50%';
    } else if (data.layout === '70-30') {
      leftWidth = '70%';
      rightWidth = '30%';
    } else if (data.layout === '25-75') {
      leftWidth = '25%';
      rightWidth = '75%';
    } else if (data.layout === '40-60') {
      leftWidth = '40%';
      rightWidth = '60%';
    }

    return (
      <div
        style={{
          paddingTop: data.paddingTop || '12px',
          paddingBottom: data.paddingBottom || '12px',
          paddingLeft: data.paddingLeft || '0px',
          paddingRight: data.paddingRight || '0px',
        }}
      >
        <div
          style={{
            backgroundColor: data.backgroundColor || 'transparent',
            borderRadius: data.borderRadius || '0px',
            border: `${data.borderWidth || '0px'} ${data.borderStyle || 'solid'} ${data.borderColor || 'transparent'}`,
          }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          {/* Left Column */}
          <div style={{ width: leftWidth }} className="w-full sm:w-auto flex-shrink-0">
            {data.leftType === 'image' ? (
              <div style={{ textAlign: data.leftImage?.alignment || 'center' }}>
                <img
                  src={data.leftImage?.url || 'https://via.placeholder.com/100'}
                  alt={data.leftImage?.alt || 'Logo'}
                  style={{
                    width: data.leftImage?.width || '90px',
                    maxWidth: data.leftImage?.maxWidth || '110px',
                    borderRadius: data.leftImage?.borderRadius || '8px',
                    display: 'inline-block',
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: data.leftText?.alignment || 'left' }}>
                {data.leftText?.heading && (
                  <h4 style={{ fontWeight: 700, color: data.leftText?.headingColor || '#0f172a' }}>
                    {data.leftText.heading}
                  </h4>
                )}
                {data.leftText?.content && (
                  <p style={{ color: data.leftText?.color || '#334155', fontSize: data.leftText?.fontSize || '14px' }}>
                    {renderFormattedText(data.leftText.content)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ width: rightWidth }} className="w-full sm:w-auto flex-1">
            {data.rightType === 'image' ? (
              <div style={{ textAlign: data.rightImage?.alignment || 'center' }}>
                <img
                  src={data.rightImage?.url || 'https://via.placeholder.com/400x200'}
                  alt={data.rightImage?.alt || 'Imagen'}
                  style={{
                    width: data.rightImage?.width || '100%',
                    borderRadius: data.rightImage?.borderRadius || '8px',
                    display: 'inline-block',
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: data.rightText?.alignment || 'left' }}>
                {data.rightText?.heading && (
                  <h3
                    style={{
                      fontSize: data.rightText?.headingSize || '20px',
                      fontWeight: 700,
                      color: data.rightText?.headingColor || '#0f172a',
                      marginBottom: '4px',
                    }}
                  >
                    {data.rightText.heading}
                  </h3>
                )}
                {data.rightText?.content && (
                  <p
                    style={{
                      fontSize: data.rightText?.fontSize || '14px',
                      color: data.rightText?.textColor || '#475569',
                      lineHeight: data.rightText?.lineHeight || '1.5',
                    }}
                  >
                    {renderFormattedText(data.rightText.content)}
                  </p>
                )}
                {data.rightText?.buttonText && (
                  <div className="mt-2.5">
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: data.rightText?.buttonBgColor || '#2563eb',
                        color: data.rightText?.buttonTextColor || '#ffffff',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {data.rightText.buttonText}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      layout = '30-70',
      verticalAlign = 'middle',
      gap = '16px',
      backgroundColor = 'transparent',
      borderRadius = '0px',
      borderWidth = '0px',
      borderColor = 'transparent',
      borderStyle = 'solid',
      paddingTop = '12px',
      paddingBottom = '12px',
      paddingLeft = '0px',
      paddingRight = '0px',
      leftType = 'image',
      leftImage = {},
      leftText = {},
      rightType = 'text',
      rightText = {},
      rightImage = {},
    } = data;

    let leftWidthPercent = 30;
    let rightWidthPercent = 70;
    if (layout === '50-50') {
      leftWidthPercent = 50;
      rightWidthPercent = 50;
    } else if (layout === '70-30') {
      leftWidthPercent = 70;
      rightWidthPercent = 30;
    } else if (layout === '25-75') {
      leftWidthPercent = 25;
      rightWidthPercent = 75;
    } else if (layout === '40-60') {
      leftWidthPercent = 40;
      rightWidthPercent = 60;
    }

    const gapVal = parseInt(gap, 10) || 16;
    const halfGap = `${Math.round(gapVal / 2)}px`;

    let leftColHtml;
    if (leftType === 'image') {
      const imgUrl = sanitizeUrl(leftImage?.url, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80');
      const safeLink = leftImage?.linkUrl ? sanitizeUrl(leftImage.linkUrl, '') : '';
      const align = leftImage?.alignment || 'center';
      const marginCss = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';
      const imgTag = `<img src="${imgUrl}" alt="${escapeHtml(leftImage?.alt || 'Logo')}" width="${(leftImage?.width || '100px').replace('%', '')}" style="display: block; ${marginCss} max-width: ${leftImage?.maxWidth || '120px'}; width: ${leftImage?.width || '100px'}; height: auto; border-radius: ${leftImage?.borderRadius || '8px'}; border: 0; outline: none; text-decoration: none;" />`;
      leftColHtml = safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgTag}</a>` : imgTag;
    } else {
      leftColHtml = `
        ${leftText?.heading ? `<h4 style="margin: 0 0 4px 0; font-size: ${leftText.headingSize || '18px'}; font-weight: 700; color: ${leftText.headingColor || '#0f172a'}; font-family: inherit; text-align: ${leftText.alignment || 'left'};">${formatTextContent(leftText.heading)}</h4>` : ''}
        ${leftText?.content ? `<p style="margin: 0; font-size: ${leftText.fontSize || '14px'}; color: ${leftText.color || '#475569'}; line-height: 1.5; font-family: inherit; text-align: ${leftText.alignment || 'left'};">${formatTextContent(leftText.content)}</p>` : ''}
      `;
    }

    let rightColHtml;
    if (rightType === 'image') {
      const imgUrl = sanitizeUrl(rightImage?.url, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80');
      const safeLink = rightImage?.linkUrl ? sanitizeUrl(rightImage.linkUrl, '') : '';
      const align = rightImage?.alignment || 'center';
      const marginCss = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';
      const imgTag = `<img src="${imgUrl}" alt="${escapeHtml(rightImage?.alt || 'Imagen')}" width="${(rightImage?.width || '100%').replace('%', '')}" style="display: block; ${marginCss} max-width: ${rightImage?.maxWidth || '100%'}; width: ${rightImage?.width || '100%'}; height: auto; border-radius: ${rightImage?.borderRadius || '8px'}; border: 0; outline: none; text-decoration: none;" />`;
      rightColHtml = safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgTag}</a>` : imgTag;
    } else {
      const btnHtml = rightText?.buttonText ? `
        <div style="margin-top: 10px; text-align: ${rightText.alignment || 'left'};">
          <a href="${sanitizeUrl(rightText.buttonUrl, '#')}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 18px; font-size: 13px; font-weight: 700; color: ${rightText.buttonTextColor || '#ffffff'}; background-color: ${rightText.buttonBgColor || '#2563eb'}; border-radius: 8px; text-decoration: none; font-family: inherit;">
            ${escapeHtml(rightText.buttonText)}
          </a>
        </div>
      ` : '';
      rightColHtml = `
        ${rightText?.heading ? `<h3 style="margin: 0 0 6px 0; font-size: ${rightText.headingSize || '20px'}; font-weight: 700; color: ${rightText.headingColor || '#0f172a'}; font-family: inherit; text-align: ${rightText.alignment || 'left'}; line-height: 1.3;">${formatTextContent(rightText.heading)}</h3>` : ''}
        ${rightText?.content ? `<p style="margin: 0; font-size: ${rightText.fontSize || '14px'}; color: ${rightText.textColor || '#475569'}; line-height: ${rightText.lineHeight || '1.5'}; font-family: inherit; text-align: ${rightText.alignment || 'left'};">${formatTextContent(rightText.content)}</p>` : ''}
        ${btnHtml}
      `;
    }

    const borderCss = borderWidth && borderWidth !== '0px' && borderColor !== 'transparent' ? `border: ${borderWidth} ${borderStyle} ${borderColor};` : '';

    return `
      <tr>
        <td style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor}; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; ${borderCss} border-collapse: separate !important; border-spacing: 0;">
            <tr>
              <td style="padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="responsive-cell mobile-center" width="${leftWidthPercent}%" valign="${verticalAlign}" align="${leftImage?.alignment || 'left'}" style="padding-right: ${halfGap};">
                      ${leftColHtml}
                    </td>
                    <td class="responsive-cell mobile-center" width="${rightWidthPercent}%" valign="${verticalAlign}" align="${rightText?.alignment || 'left'}" style="padding-left: ${halfGap};">
                      ${rightColHtml}
                    </td>
                  </tr>
                </table>
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
          <label className="text-[11px] text-slate-400 block mb-1">Distribución (Layout)</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: '30-70', label: '30% - 70%' },
              { id: '50-50', label: '50% - 50%' },
              { id: '70-30', label: '70% - 30%' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update('layout', item.id)}
                className={`py-1 text-xs rounded border transition ${
                  (data.layout || '30-70') === item.id
                    ? 'bg-brand-600 text-white border-brand-500 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 block mb-2">Columna Izquierda</span>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">URL de Imagen</label>
              <input
                type="text"
                value={data.leftImage?.url || ''}
                onChange={(e) => update('leftImage', { ...(data.leftImage || {}), url: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Ancho Imagen</label>
              <input
                type="text"
                value={data.leftImage?.width || '90px'}
                onChange={(e) => update('leftImage', { ...(data.leftImage || {}), width: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 block mb-2">Columna Derecha</span>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Título</label>
              <input
                type="text"
                value={data.rightText?.heading || ''}
                onChange={(e) => update('rightText', { ...(data.rightText || {}), heading: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Contenido</label>
              <textarea
                rows={2}
                value={data.rightText?.content || ''}
                onChange={(e) => update('rightText', { ...(data.rightText || {}), content: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
