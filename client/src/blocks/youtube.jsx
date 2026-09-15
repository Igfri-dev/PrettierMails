import React, { useState } from 'react';
import { Play, ExternalLink, Eye, Tv, CheckCircle2, AlertCircle } from 'lucide-react';
import YoutubeIcon from '../components/YoutubeIcon.jsx';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../utils/youtubeHelper.js';
import { escapeHtml, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { YoutubeBlockDataSchema } from '../schemas/documentSchema.js';

function YouTubeCanvasRenderer({ data = {} }) {
  const [showLiveEmbed, setShowLiveEmbed] = useState(false);
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="px-5 py-3 rounded-2xl bg-red-600/90 text-white font-bold flex items-center space-x-2 shadow-2xl backdrop-blur-sm transform transition group-hover/yt:scale-110">
                <Play className="w-5 h-5 fill-white" />
                <span className="text-sm tracking-wide">REPRODUCIR</span>
              </div>
            </div>
          </div>
        )}

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
}

export default {
  type: 'youtube',
  label: 'Video de YouTube',
  category: 'media',
  icon: YoutubeIcon,
  defaultData: {
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    title: 'Mira nuestro último video',
    caption: 'Haz clic en reproducir para ver el contenido completo en YouTube en alta definición.',
    buttonText: 'Ver en YouTube ▶',
    cardBackground: '#0f172a',
    textColor: '#f8fafc',
    borderRadius: '12px',
    paddingTop: '16px',
    paddingBottom: '16px',
  },
  schema: YoutubeBlockDataSchema,

  render({ data = {} }) {
    return <YouTubeCanvasRenderer data={data} />;
  },

  compileHtml(data = {}) {
    const {
      url = 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      title = 'Mira nuestro último video',
      caption = 'Haz clic para reproducir el video en YouTube.',
      buttonText = 'Ver en YouTube ▶',
      cardBackground = '#0f172a',
      textColor = '#f8fafc',
      borderRadius = '12px',
      paddingTop = '16px',
      paddingBottom = '16px',
    } = data;

    const videoId = extractYouTubeId(url);
    const thumbnail = getYouTubeThumbnail(videoId, 'max');
    const watchUrl = getYouTubeWatchUrl(videoId);

    const safeCardBg = sanitizeColor(cardBackground, '#0f172a');
    const safeTextColor = sanitizeColor(textColor, '#f8fafc');
    const safeBorderRadius = sanitizeCssValue(borderRadius, '12px');
    const safePadTop = sanitizeCssValue(paddingTop, '16px');
    const safePadBottom = sanitizeCssValue(paddingBottom, '16px');

    return `
      <tr>
        <td style="padding-top: ${safePadTop}; padding-bottom: ${safePadBottom};">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${safeCardBg}; border-radius: ${safeBorderRadius}; -webkit-border-radius: ${safeBorderRadius}; -moz-border-radius: ${safeBorderRadius}; overflow: hidden; border-collapse: separate !important; border-spacing: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" bgcolor="${safeCardBg}">
            <tr>
              <td align="center" valign="middle" background="${thumbnail}" bgcolor="#000000" class="video-thumbnail-container" style="padding: 0; background-color: #000000; background-image: url('${thumbnail}'); background-size: cover; background-position: center center; background-repeat: no-repeat; height: 338px; text-align: center; border-top-left-radius: ${safeBorderRadius}; border-top-right-radius: ${safeBorderRadius};">
                <!--[if gte mso 9]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:338px;" href="${watchUrl}">
                  <v:fill type="frame" src="${thumbnail}" color="#000000" />
                  <v:textbox inset="0,0,0,0">
                  <center>
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" height="338" class="video-thumbnail-container" style="height: 338px; width: 100%; border-collapse: collapse; border-spacing: 0;">
                  <tr>
                    <td align="center" valign="middle" style="text-align: center; vertical-align: middle;">
                      <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin: 0 auto; background-color: #ef4444; border-radius: 14px; -webkit-border-radius: 14px; -moz-border-radius: 14px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5); border-collapse: separate; border-spacing: 0;">
                        <tr>
                          <td align="center" valign="middle" bgcolor="#ef4444" style="background-color: #ef4444; border-radius: 14px; -webkit-border-radius: 14px; -moz-border-radius: 14px; mso-padding-alt: 12px 24px; padding: 0;">
                            <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; mso-padding-alt: 0px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 14px; -webkit-border-radius: 14px; -moz-border-radius: 14px; letter-spacing: 0.5px; line-height: 120%; background-color: #ef4444; border: 1px solid #ef4444;">
                              &#9658;&nbsp;&nbsp;REPRODUCIR
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!--[if gte mso 9]>
                  </center>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 24px 22px 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border-spacing: 0;">
                  ${title ? `
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: ${safeTextColor}; font-family: inherit;">
                          ${escapeHtml(title)}
                        </h3>
                      </td>
                    </tr>
                  ` : ''}
                  ${caption ? `
                    <tr>
                      <td style="padding-bottom: 14px;">
                        <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5; font-family: inherit;">
                          ${escapeHtml(caption)}
                        </p>
                      </td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td align="left" style="text-align: left;">
                      <table border="0" cellpadding="0" cellspacing="0" align="left" role="presentation" style="margin: 0 auto 0 0; border-collapse: separate; border-spacing: 0;">
                        <tr>
                          <td align="center" valign="middle" bgcolor="#ef4444" style="background-color: #ef4444; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; mso-padding-alt: 10px 20px;">
                            <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; mso-padding-alt: 0px; font-family: inherit; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; background-color: #ef4444; line-height: 120%; border: 1px solid #ef4444; text-align: center;">
                              ${escapeHtml(buttonText)}
                            </a>
                          </td>
                        </tr>
                      </table>
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
    const videoId = extractYouTubeId(data.url);

    return (
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
          {videoId ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ID detectado: {videoId}</span>
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
    );
  },
};
