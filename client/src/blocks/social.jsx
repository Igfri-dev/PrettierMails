import React from 'react';
import { Share2, Play, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { escapeHtml, sanitizeUrl, sanitizeCssValue } from './blockHelpers.jsx';
import { SocialBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'social',
  label: 'Redes Sociales',
  category: 'content',
  icon: Share2,
  defaultData: {
    alignment: 'center',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    linkedin: '',
    facebook: '',
    github: 'https://github.com',
    paddingTop: '16px',
    paddingBottom: '16px',
  },
  schema: SocialBlockDataSchema,

  render({ data = {} }) {
    const {
      alignment = 'center',
      youtube = '',
      instagram = '',
      twitter = '',
      github = '',
      linkedin = '',
      facebook = '',
      paddingTop = '16px',
      paddingBottom = '16px',
    } = data;

    const justifyClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

    return (
      <div style={{ paddingTop, paddingBottom }}>
        <div className={`flex items-center ${justifyClass} space-x-3`}>
          {youtube && (
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <Play className="w-4 h-4 fill-current" />
            </span>
          )}
          {instagram && (
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 font-bold text-xs">
              IG
            </span>
          )}
          {twitter && (
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 font-bold text-xs">
              𝕏
            </span>
          )}
          {github && (
            <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-300 font-bold text-xs">
              GH
            </span>
          )}
          {linkedin && (
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs">
              IN
            </span>
          )}
          {facebook && (
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs">
              FB
            </span>
          )}
        </div>
      </div>
    );
  },

  compileHtml(data = {}) {
    const {
      alignment = 'center',
      facebook = '',
      twitter = '',
      instagram = '',
      linkedin = '',
      youtube = '',
      github = '',
      paddingTop = '16px',
      paddingBottom = '16px',
    } = data;

    const safeAlign = sanitizeCssValue(alignment, 'center');
    const safePadTop = sanitizeCssValue(paddingTop, '16px');
    const safePadBottom = sanitizeCssValue(paddingBottom, '16px');

    const socialIcons = [
      { name: 'YouTube', url: youtube, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
      { name: 'Instagram', url: instagram, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png' },
      { name: 'Twitter / X', url: twitter, icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' },
      { name: 'LinkedIn', url: linkedin, icon: 'https://cdn-icons-png.flaticon.com/512/145/145807.png' },
      { name: 'Facebook', url: facebook, icon: 'https://cdn-icons-png.flaticon.com/512/145/145802.png' },
      { name: 'GitHub', url: github, icon: 'https://cdn-icons-png.flaticon.com/512/733/733553.png' },
    ].filter(item => Boolean(item.url));

    if (socialIcons.length === 0) return '';

    const iconsHtml = socialIcons
      .map(
        item => `
        <td style="padding: 0 8px;">
          <a href="${sanitizeUrl(item.url, '#')}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
            <img src="${sanitizeUrl(item.icon, '')}" alt="${escapeHtml(item.name)}" width="28" height="28" style="display: block; border: 0; outline: none; border-radius: 6px;" />
          </a>
        </td>
      `
      )
      .join('');

    const marginCss = safeAlign === 'center' ? '0 auto' : safeAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0';

    return `
      <tr>
        <td align="${safeAlign}" style="padding-top: ${safePadTop}; padding-bottom: ${safePadBottom};">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: ${marginCss};">
            <tr>
              ${iconsHtml}
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

        <div className="space-y-2">
          {[
            { key: 'youtube', label: 'YouTube' },
            { key: 'instagram', label: 'Instagram' },
            { key: 'twitter', label: 'Twitter / X' },
            { key: 'github', label: 'GitHub' },
            { key: 'linkedin', label: 'LinkedIn' },
            { key: 'facebook', label: 'Facebook' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-[11px] text-slate-400 block mb-1">{label}</label>
              <input
                type="text"
                value={data[key] || ''}
                onChange={(e) => update(key, e.target.value)}
                placeholder={`https://${key}.com/...`}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};
