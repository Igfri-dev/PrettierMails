import React from 'react';
import { Palette, Layout, Type } from 'lucide-react';

const PRESET_BG_COLORS = [
  '#0f172a', '#1e293b', '#f1f5f9', '#f8fafc', '#ffffff', 
  '#f0fdf4', '#eff6ff', '#faf5ff', '#fff1f2', '#fefce8'
];

const PRESET_CARD_COLORS = [
  '#ffffff', '#f8fafc', '#1e293b', '#0f172a', '#18181b', '#030712'
];

const ensureHexColor = (val, fallback) => {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val)) {
    return val;
  }
  return fallback;
};

export default function GlobalSettings({
  globalSettings = {},
  setGlobalSettings,
  updateGlobalSetting,
}) {
  const currentSettings = {
    backgroundColor: '#0f172a',
    contentBackgroundColor: '#ffffff',
    contentWidth: '600px',
    borderRadius: '16px',
    padding: '32px',
    textColor: '#1e293b',
    ...(globalSettings || {}),
  };

  const updateSetting = (key, value) => {
    if (typeof updateGlobalSetting === 'function') {
      updateGlobalSetting(key, value);
    } else if (typeof setGlobalSettings === 'function') {
      setGlobalSettings((prev) => ({
        ...(prev || currentSettings),
        [key]: value,
      }));
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Outer Background Color */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-brand-400" />
            Fondo Exterior del Email
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {currentSettings.backgroundColor}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={ensureHexColor(currentSettings.backgroundColor, '#0f172a')}
            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
          />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {PRESET_BG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateSetting('backgroundColor', color)}
                className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                  (currentSettings.backgroundColor || '').toLowerCase() === color.toLowerCase()
                    ? 'ring-2 ring-brand-400 border-white'
                    : 'border-slate-700'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inner Card Background Color */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            Fondo de la Tarjeta Interior
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {currentSettings.contentBackgroundColor}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={ensureHexColor(currentSettings.contentBackgroundColor, '#ffffff')}
            onChange={(e) => updateSetting('contentBackgroundColor', e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
          />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {PRESET_CARD_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateSetting('contentBackgroundColor', color)}
                className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                  (currentSettings.contentBackgroundColor || '').toLowerCase() === color.toLowerCase()
                    ? 'ring-2 ring-brand-400 border-white'
                    : 'border-slate-700'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Width */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            Ancho Máximo del Email
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {currentSettings.contentWidth}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['520px', '600px', '680px'].map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => updateSetting('contentWidth', width)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                currentSettings.contentWidth === width
                  ? 'bg-brand-600 text-white border-brand-500 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {width}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Esquinas Redondeadas</span>
          <span className="text-[11px] font-mono text-slate-400">{currentSettings.borderRadius}</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {['0px', '8px', '16px', '24px'].map((radius) => (
            <button
              key={radius}
              type="button"
              onClick={() => updateSetting('borderRadius', radius)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                currentSettings.borderRadius === radius
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {radius === '0px' ? 'Recto' : radius}
            </button>
          ))}
        </div>
      </div>

      {/* Internal Padding */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Relleno Interior (Padding)</span>
          <span className="text-[11px] font-mono text-slate-400">{currentSettings.padding}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['20px', '32px', '44px'].map((pad) => (
            <button
              key={pad}
              type="button"
              onClick={() => updateSetting('padding', pad)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                currentSettings.padding === pad
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {pad === '20px' ? 'Compacto' : pad === '32px' ? 'Estándar' : 'Amplio'}
            </button>
          ))}
        </div>
      </div>

      {/* Global Text Color */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            Color de Texto Predeterminado
          </span>
          <span className="text-[11px] font-mono text-slate-400">{currentSettings.textColor}</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={ensureHexColor(currentSettings.textColor, '#1e293b')}
            onChange={(e) => updateSetting('textColor', e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
          />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {['#0f172a', '#1e293b', '#334155', '#64748b', '#cbd5e1', '#f8fafc', '#ffffff'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateSetting('textColor', c)}
                className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                  (currentSettings.textColor || '').toLowerCase() === c.toLowerCase()
                    ? 'ring-2 ring-brand-400 border-white'
                    : 'border-slate-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
