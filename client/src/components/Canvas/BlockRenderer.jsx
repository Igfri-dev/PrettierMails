import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  Play, 
  ExternalLink,
  Eye,
  Tv
} from 'lucide-react';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../utils/youtubeHelper.js';

function renderFormattedText(text) {
  if (!text) return null;
  // Splits by markdown bold and italics: **bold**, *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-inherit">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function BlockRenderer({
  block,
  isSelected,
  onSelect,
  onUpdateBlockData,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const [showLiveEmbed, setShowLiveEmbed] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(block.id);
  };

  const { type, data } = block;

  return (
    <div
      onClick={handleClick}
      className={`relative group transition-all duration-200 cursor-pointer rounded-lg ${
        isSelected
          ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/10'
          : 'hover:ring-1 hover:ring-brand-400/50'
      }`}
    >
      {/* Floating Action Toolbar when block is selected */}
      {isSelected && (
        <div className="absolute -top-9 right-2 z-20 flex items-center bg-slate-900 border border-slate-700 shadow-xl rounded-lg px-1.5 py-1 space-x-1 text-slate-300">
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider px-1.5 border-r border-slate-800">
            {type}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(block.id);
            }}
            disabled={!canMoveUp}
            title="Mover arriba"
            className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(block.id);
            }}
            disabled={!canMoveDown}
            title="Mover abajo"
            className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateBlock(block.id);
            }}
            title="Duplicar bloque"
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBlock(block.id);
            }}
            title="Eliminar bloque"
            className="p-1 hover:text-rose-400 hover:bg-rose-500/20 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* RENDER BLOCK CONTENT */}
      {type === 'heading' && (
        <div
          style={{
            paddingTop: data.paddingTop || '12px',
            paddingBottom: data.paddingBottom || '12px',
            textAlign: data.textAlign || 'left',
          }}
        >
          <h2
            style={{
              fontSize: data.fontSize || '26px',
              fontWeight: data.fontWeight || '800',
              color: data.color || '#0f172a',
              textAlign: data.textAlign || 'left',
              lineHeight: 1.3,
              letterSpacing: data.letterSpacing || '-0.015em',
            }}
          >
            {data.content || 'Encabezado'}
          </h2>
        </div>
      )}

      {type === 'text' && (
        <div
          style={{
            paddingTop: data.paddingTop || '8px',
            paddingBottom: data.paddingBottom || '8px',
            textAlign: data.textAlign || 'left',
          }}
        >
          <div
            style={{
              fontSize: data.fontSize || '15px',
              fontWeight: data.fontWeight || '400',
              color: data.color || '#334155',
              lineHeight: data.lineHeight || '1.6',
              whiteSpace: 'pre-line',
            }}
          >
            {renderFormattedText(data.content || 'Escribe aquí tu texto...')}
          </div>
        </div>
      )}

      {type === 'grid' && (() => {
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

        const vAlign = data.verticalAlign === 'top' ? 'items-start' : data.verticalAlign === 'bottom' ? 'items-end' : 'items-center';

        return (
          <div
            style={{
              paddingTop: data.paddingTop || '12px',
              paddingBottom: data.paddingBottom || '12px',
              paddingLeft: data.paddingLeft || '0px',
              paddingRight: data.paddingRight || '0px',
              backgroundColor: data.backgroundColor || 'transparent',
              borderRadius: data.borderRadius || '0px',
            }}
          >
            <div className={`flex flex-col sm:flex-row ${vAlign} gap-4 w-full`}>
              {/* Left Column */}
              <div style={{ width: leftWidth }} className="flex-shrink-0">
                {data.leftType === 'image' ? (
                  <div
                    style={{
                      textAlign: data.leftImage?.alignment || 'center',
                    }}
                  >
                    <img
                      src={data.leftImage?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'}
                      alt={data.leftImage?.alt || 'Logo'}
                      style={{
                        maxWidth: data.leftImage?.maxWidth || '120px',
                        width: data.leftImage?.width || '100px',
                        borderRadius: data.leftImage?.borderRadius || '8px',
                        display: 'inline-block',
                      }}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: data.leftText?.alignment || 'left' }}>
                    {data.leftText?.heading && (
                      <h4
                        style={{
                          fontSize: data.leftText?.headingSize || '18px',
                          fontWeight: 700,
                          color: data.leftText?.headingColor || '#0f172a',
                          marginBottom: '4px',
                        }}
                      >
                        {data.leftText.heading}
                      </h4>
                    )}
                    {data.leftText?.content && (
                      <p
                        style={{
                          fontSize: data.leftText?.fontSize || '14px',
                          color: data.leftText?.color || '#475569',
                          lineHeight: '1.5',
                        }}
                      >
                        {renderFormattedText(data.leftText.content)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div style={{ width: rightWidth }} className="flex-1 min-w-0">
                {data.rightType === 'image' ? (
                  <div style={{ textAlign: data.rightImage?.alignment || 'center' }}>
                    <img
                      src={data.rightImage?.url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'}
                      alt={data.rightImage?.alt || 'Imagen'}
                      style={{
                        maxWidth: data.rightImage?.maxWidth || '100%',
                        width: data.rightImage?.width || '100%',
                        borderRadius: data.rightImage?.borderRadius || '8px',
                        display: 'inline-block',
                      }}
                      className="object-contain"
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
                          lineHeight: '1.3',
                          marginBottom: '6px',
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
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {renderFormattedText(data.rightText.content)}
                      </p>
                    )}
                    {data.rightText?.buttonText && (
                      <div className="mt-3">
                        <span
                          style={{
                            backgroundColor: data.rightText?.buttonBgColor || '#2563eb',
                            color: data.rightText?.buttonTextColor || '#ffffff',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'inline-block',
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
      })()}

      {type === 'table' && (() => {
        const headers = data.headers || ['Columna 1', 'Columna 2', 'Columna 3'];
        const rows = data.rows || [
          ['Dato 1', 'Dato 2', 'Dato 3'],
          ['Dato 4', 'Dato 5', 'Dato 6'],
        ];
        const striped = data.striped !== false;

        return (
          <div
            style={{
              paddingTop: data.paddingTop || '14px',
              paddingBottom: data.paddingBottom || '14px',
            }}
          >
            <div
              style={{
                borderRadius: data.borderRadius || '12px',
                border: `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
                overflow: 'hidden',
                backgroundColor: data.rowBgColor || '#ffffff',
              }}
              className="shadow-sm"
            >
              <table className="w-full text-left border-collapse" style={{ fontSize: data.fontSize || '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: data.headerBgColor || '#0f172a' }}>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: data.cellPadding || '12px 16px',
                          color: data.headerTextColor || '#ffffff',
                          fontWeight: data.headerFontWeight || '700',
                          fontSize: data.headerFontSize || '13px',
                          borderBottom: `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
                          textAlign: data.textAlign || 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => {
                    const bg = (striped && rIdx % 2 === 1)
                      ? (data.altRowBgColor || '#f8fafc')
                      : (data.rowBgColor || '#ffffff');
                    const isLast = rIdx === rows.length - 1;

                    return (
                      <tr key={rIdx} style={{ backgroundColor: bg }}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: data.cellPadding || '12px 16px',
                              color: data.textColor || '#334155',
                              borderBottom: isLast ? 'none' : `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
                              textAlign: data.textAlign || 'left',
                              lineHeight: '1.5',
                            }}
                          >
                            {renderFormattedText(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {type === 'box' && (
        <div className="py-2">
          <div
            style={{
              backgroundColor: data.backgroundColor || '#f8fafc',
              borderRadius: data.borderRadius || '14px',
              border: `${data.borderWidth || '1px'} ${data.borderStyle || 'solid'} ${data.borderColor || '#e2e8f0'}`,
              ...(data.borderLeftColor ? {
                borderLeft: `${data.borderLeftWidth || '4px'} solid ${data.borderLeftColor}`,
              } : {}),
              boxShadow: data.boxShadow || (data.borderLeftColor ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'),
              paddingTop: data.paddingTop || '20px',
              paddingBottom: data.paddingBottom || '20px',
              paddingLeft: data.paddingLeft || '20px',
              paddingRight: data.paddingRight || '20px',
            }}
          >
            {data.children && data.children.length > 0 ? (
              <div className="space-y-2">
                {data.children.map((child) => (
                  <div key={child.id} className="pointer-events-none">
                    {child.type === 'heading' && (
                      <h3
                        style={{
                          fontSize: child.data.fontSize || '18px',
                          fontWeight: child.data.fontWeight || '700',
                          color: child.data.color || '#0f172a',
                          textAlign: child.data.textAlign || 'left',
                          marginBottom: '4px',
                        }}
                      >
                        {child.data.content}
                      </h3>
                    )}
                    {child.type === 'text' && (
                      <div
                        style={{
                          fontSize: child.data.fontSize || '14px',
                          fontWeight: child.data.fontWeight || '400',
                          color: child.data.color || '#475569',
                          lineHeight: child.data.lineHeight || '1.6',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {renderFormattedText(child.data.content)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Caja contenedora vacía</p>
            )}
          </div>
        </div>
      )}

      {type === 'image' && (
        <div
          style={{
            paddingTop: data.paddingTop || '12px',
            paddingBottom: data.paddingBottom || '12px',
            textAlign: data.alignment || 'center',
          }}
        >
          <img
            src={data.url || 'https://via.placeholder.com/600x300'}
            alt={data.alt || 'Imagen'}
            style={{
              display: 'inline-block',
              margin: data.alignment === 'center' ? '0 auto' : undefined,
              width: data.width || '100%',
              maxWidth: data.maxWidth || '100%',
              borderRadius: data.borderRadius || '8px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {type === 'button' && (
        <div
          style={{
            paddingTop: '14px',
            paddingBottom: '14px',
            textAlign: data.alignment || 'center',
          }}
        >
          <a
            href={data.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            style={{
              display: data.fullWidth ? 'block' : 'inline-block',
              backgroundColor: data.backgroundColor || '#2563eb',
              color: data.textColor || '#ffffff',
              borderRadius: data.borderRadius || '12px',
              fontSize: data.fontSize || '15px',
              fontWeight: data.fontWeight || '700',
              padding: `${data.paddingY || '14px'} ${data.paddingX || '32px'}`,
              textDecoration: 'none',
              boxShadow: data.boxShadow || '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
              letterSpacing: data.letterSpacing || '0.015em',
            }}
          >
            {data.text || 'Botón de Acción'}
          </a>
        </div>
      )}

      {/* YOUTUBE VIDEO BLOCK */}
      {type === 'youtube' && (() => {
        const videoId = extractYouTubeId(data.url);
        const thumbnail = getYouTubeThumbnail(videoId, 'max');
        const embedUrl = getYouTubeEmbedUrl(videoId);
        const watchUrl = getYouTubeWatchUrl(videoId);

        return (
          <div
            style={{
              paddingTop: data.paddingTop || '16px',
              paddingBottom: data.paddingBottom || '16px',
            }}
          >
            <div
              style={{
                backgroundColor: data.cardBackground || '#0f172a',
                borderRadius: data.borderRadius || '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Switcher to test video player inside editor */}
              <div className="bg-black/70 px-3 py-1.5 flex items-center justify-between border-b border-white/10 text-xs">
                <div className="flex items-center space-x-1.5 text-red-400 font-semibold">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>YouTube Video Embed</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLiveEmbed(!showLiveEmbed);
                  }}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white transition"
                >
                  {showLiveEmbed ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Ver Vista Email</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3 h-3 text-amber-400" />
                      <span>Probar Reproductor</span>
                    </>
                  )}
                </button>
              </div>

              {/* Video Player or Email-Safe Thumbnail View */}
              {showLiveEmbed && videoId ? (
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    title={data.title || 'YouTube video'}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative group/yt overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <img
                    src={thumbnail}
                    alt={data.title || 'Video'}
                    className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover/yt:scale-105"
                  />
                  {/* YouTube Play Overlay Badge */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="px-5 py-3 rounded-2xl bg-red-600/90 text-white font-bold flex items-center space-x-2 shadow-2xl backdrop-blur-sm transform transition group-hover/yt:scale-110">
                      <Play className="w-5 h-5 fill-white" />
                      <span className="text-sm tracking-wide">REPRODUCIR</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Info Footer */}
              <div className="p-4 sm:p-5">
                {data.title && (
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: data.textColor || '#f8fafc',
                      marginBottom: '4px',
                    }}
                  >
                    {data.title}
                  </h3>
                )}
                {data.caption && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                      lineHeight: '1.5',
                      marginBottom: '14px',
                    }}
                  >
                    {data.caption}
                  </p>
                )}
                <div className="flex items-center space-x-3">
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 transition"
                  >
                    <span>{data.buttonText || 'Ver en YouTube ▶'}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <span className="text-[11px] text-slate-400">
                    Se abrirá directamente en YouTube
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {type === 'divider' && (
        <div
          style={{
            paddingTop: data.paddingTop || '16px',
            paddingBottom: data.paddingBottom || '16px',
            textAlign: 'center',
          }}
        >
          <hr
            style={{
              border: 0,
              borderTop: `${data.thickness || '1px'} ${data.style || 'solid'} ${data.color || '#e2e8f0'}`,
              width: data.width || '100%',
              margin: '0 auto',
            }}
          />
        </div>
      )}

      {type === 'spacer' && (
        <div
          style={{
            height: data.height || '24px',
          }}
          className="border border-dashed border-slate-300/40 rounded flex items-center justify-center text-[10px] text-slate-400 select-none"
        >
          Espacio {data.height || '24px'}
        </div>
      )}

      {type === 'social' && (
        <div
          style={{
            paddingTop: data.paddingTop || '16px',
            paddingBottom: data.paddingBottom || '16px',
            textAlign: data.alignment || 'center',
          }}
        >
          <div className="flex items-center justify-center space-x-3">
            {data.youtube && (
              <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                <Play className="w-4 h-4 fill-current" />
              </span>
            )}
            {data.instagram && (
              <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                <span className="text-xs font-bold">IG</span>
              </span>
            )}
            {data.twitter && (
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                <span className="text-xs font-bold">𝕏</span>
              </span>
            )}
            {data.github && (
              <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-300">
                <span className="text-xs font-bold">GH</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
