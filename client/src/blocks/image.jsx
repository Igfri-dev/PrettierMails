import React from 'react';
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { escapeHtml, sanitizeUrl, sanitizeCssValue } from './blockHelpers.jsx';
import { ImageBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'image',
  label: 'Imagen',
  category: 'media',
  icon: ImageIcon,
  defaultData: {
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
    alt: 'Banner Visual',
    width: '100%',
    maxWidth: '100%',
    alignment: 'center',
    borderRadius: '12px',
    linkUrl: '',
    paddingTop: '12px',
    paddingBottom: '12px',
  },
  schema: ImageBlockDataSchema,

  render({ data = {} }) {
    const {
      url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
      alt = 'Imagen',
      width = '100%',
      maxWidth = '100%',
      alignment = 'center',
      borderRadius = '8px',
      linkUrl = '',
      paddingTop = '12px',
      paddingBottom = '12px',
    } = data;

    const imgElement = (
      <img
        src={url || 'https://via.placeholder.com/600x300'}
        alt={alt}
        style={{
          display: 'inline-block',
          margin: alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0',
          width,
          maxWidth,
          borderRadius,
          objectFit: 'contain',
        }}
      />
    );

    return (
      <div style={{ paddingTop, paddingBottom, textAlign: alignment }}>
        {linkUrl ? (
          <a href={linkUrl} onClick={(e) => e.preventDefault()} style={{ display: 'inline-block' }}>
            {imgElement}
          </a>
        ) : (
          imgElement
        )}
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
      alt = 'Imagen',
      width = '100%',
      maxWidth = '100%',
      alignment = 'center',
      borderRadius = '8px',
      linkUrl = '',
      paddingTop = '12px',
      paddingBottom = '12px',
    } = data;

    const safeImgUrl = sanitizeUrl(url, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80');
    const safeLinkUrl = linkUrl ? sanitizeUrl(linkUrl, '') : '';
    const safeAlign = sanitizeCssValue(alignment, 'center');
    const safeWidth = sanitizeCssValue(width, '100%');
    const safeMaxWidth = sanitizeCssValue(maxWidth, '100%');
    const safeBorderRadius = sanitizeCssValue(borderRadius, '8px');
    const safePaddingTop = sanitizeCssValue(paddingTop, '12px');
    const safePaddingBottom = sanitizeCssValue(paddingBottom, '12px');

    const marginCss = safeAlign === 'center' ? 'margin: 0 auto;' : safeAlign === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';

    const imgHtml = `
      <img src="${safeImgUrl}" alt="${escapeHtml(alt)}" width="${safeWidth.replace('%', '')}" style="display: block; ${marginCss} max-width: ${safeMaxWidth}; width: ${safeWidth}; height: auto; border-radius: ${safeBorderRadius}; border: 0; outline: none; text-decoration: none;" />
    `;

    return `
      <tr>
        <td align="${safeAlign}" style="padding-top: ${safePaddingTop}; padding-bottom: ${safePaddingBottom};">
          ${safeLinkUrl ? `<a href="${safeLinkUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgHtml}</a>` : imgHtml}
        </td>
      </tr>
    `;
  },

  inspector({ data = {}, update }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">URL de la Imagen</label>
          <input
            type="text"
            value={data.url || ''}
            onChange={(e) => update('url', e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Texto Alternativo (Alt)</label>
          <input
            type="text"
            value={data.alt || ''}
            onChange={(e) => update('alt', e.target.value)}
            placeholder="Descripción para accesibilidad..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Enlace al Clic (Opcional)</label>
          <input
            type="text"
            value={data.linkUrl || ''}
            onChange={(e) => update('linkUrl', e.target.value)}
            placeholder="https://tudominio.com/promo"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Ancho</label>
            <select
              value={data.width || '100%'}
              onChange={(e) => update('width', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="25%">25% (Miniatura)</option>
              <option value="50%">50% (Media)</option>
              <option value="75%">75% (Grande)</option>
              <option value="100%">100% (Ancho Total)</option>
            </select>
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
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Borde Redondeado</label>
            <select
              value={data.borderRadius || '8px'}
              onChange={(e) => update('borderRadius', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
            >
              <option value="0px">Cuadrado (0px)</option>
              <option value="4px">Suave (4px)</option>
              <option value="8px">Redondeado (8px)</option>
              <option value="16px">Curvado (16px)</option>
              <option value="9999px">Circular</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Padding Sup/Inf</label>
            <input
              type="text"
              value={data.paddingTop || '12px'}
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
