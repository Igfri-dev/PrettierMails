import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, Code, FileCode } from 'lucide-react';
import { compileEmailToMjml } from '../../utils/mjmlCompiler.js';

export default function HtmlExportModal({
  isOpen,
  onClose,
  htmlContent,
  subject,
  previewText = '',
  blocks = [],
  globalSettings = {},
}) {
  const [activeTab, setActiveTab] = useState('html'); // 'html' | 'mjml'
  const [copied, setCopied] = useState(false);

  const mjmlContent = useMemo(() => {
    if (!isOpen) return '';
    try {
      return compileEmailToMjml({
        blocks,
        globalSettings,
        subject,
        previewText,
      });
    } catch (err) {
      console.error('Error compiling MJML:', err);
      return `<!-- Error al compilar MJML: ${err.message} -->`;
    }
  }, [isOpen, blocks, globalSettings, subject, previewText]);

  if (!isOpen) return null;

  const currentContent = activeTab === 'html' ? htmlContent : mjmlContent;
  const currentExtension = activeTab === 'html' ? 'html' : 'mjml';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const cleanName = (subject || 'email-template')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'email-template';

    const mimeType = activeTab === 'html' ? 'text/html;charset=utf-8' : 'text/xml;charset=utf-8';
    const blob = new Blob([currentContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}.${currentExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Exportación de Código</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {activeTab.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeTab === 'html'
                  ? 'HTML con tablas y estilos inline optimizado para clientes de correo'
                  : 'Sintaxis semántica MJML responsiva y compatible con Outlook'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Format Selector */}
            <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                  activeTab === 'html'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>HTML Inlined</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mjml')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                  activeTab === 'mjml'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>Código MJML</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar {activeTab.toUpperCase()}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .{currentExtension}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 select-all leading-relaxed whitespace-pre-wrap">
          {currentContent}
        </div>
      </div>
    </div>
  );
}

