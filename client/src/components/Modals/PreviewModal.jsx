import React, { useState } from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';

export default function PreviewModal({
  isOpen,
  onClose,
  htmlContent,
  subject,
}) {
  const [device, setDevice] = useState('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Vista Previa en Cliente de Correo
            </span>
            <span className="text-xs text-slate-400 font-mono truncate max-w-sm">
              [{subject || 'Sin Asunto'}]
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Device Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setDevice('desktop')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded font-medium transition ${
                  device === 'desktop' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Escritorio</span>
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded font-medium transition ${
                  device === 'mobile' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Móvil</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-8 flex items-center justify-center overflow-auto">
          <div
            className={`transition-all duration-300 bg-white h-full shadow-2xl overflow-hidden ${
              device === 'mobile'
                ? 'w-[375px] max-h-[720px] rounded-[36px] ring-8 ring-slate-800'
                : 'w-full max-w-3xl rounded-xl'
            }`}
          >
            <iframe
              srcDoc={htmlContent}
              title="Email Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-popups"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
