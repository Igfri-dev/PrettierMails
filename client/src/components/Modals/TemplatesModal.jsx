import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  LayoutTemplate, 
  Bookmark, 
  UploadCloud, 
  Trash2, 
  Download, 
  Check, 
  AlertCircle, 
  FileCode, 
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';
import YoutubeIcon from '../YoutubeIcon.jsx';
import { TEMPLATES } from '../../utils/defaultTemplates.js';
import { 
  getSavedTemplates, 
  deleteCustomTemplate, 
  downloadTemplateAsHtml, 
  parseTemplateFromHtml 
} from '../../utils/templateStorage.js';

export default function TemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenSaveModal,
}) {
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'presets' | 'import'
  const [customTemplates, setCustomTemplates] = useState([]);
  
  // Import tab state
  const [isDragging, setIsDragging] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Load custom templates whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedTemplates();
      setCustomTemplates(saved);
      // If user has no saved templates yet, default to presets tab
      if (saved.length === 0 && activeTab === 'custom') {
        setActiveTab('presets');
      }
      setImportFile(null);
      setImportResult(null);
      setImportError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteTemplate = (e, templateId) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla guardada?')) {
      const updated = deleteCustomTemplate(templateId);
      setCustomTemplates(updated);
    }
  };

  const handleDownloadTemplate = (e, tmpl) => {
    e.stopPropagation();
    downloadTemplateAsHtml({
      name: tmpl.name,
      subject: tmpl.subject || tmpl.name,
      globalSettings: tmpl.globalSettings,
      blocks: tmpl.blocks,
    });
  };

  // Process imported text
  const processImportContent = (content, fileName) => {
    const res = parseTemplateFromHtml(content);
    if (res.success) {
      setImportResult({
        ...res.template,
        source: res.source,
        fileName,
      });
      setImportError(null);
    } else {
      setImportError(res.error || 'No se pudo leer la plantilla desde el archivo.');
      setImportResult(null);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        processImportContent(content, file.name);
      }
    };
    reader.onerror = () => {
      setImportError('Error al leer el archivo en el navegador.');
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        processImportContent(content, file.name);
      }
    };
    reader.onerror = () => {
      setImportError('Error al leer el archivo arrastrado.');
    };
    reader.readAsText(file);
  };

  const handleApplyImported = () => {
    if (importResult) {
      onSelectTemplate(importResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Centro de Plantillas</h3>
              <p className="text-xs text-slate-400">
                Gestiona tus diseños guardados, carga plantillas prediseñadas o importa archivos HTML
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-950/40 space-x-2">
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition ${
              activeTab === 'custom'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mis Plantillas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {customTemplates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition ${
              activeTab === 'presets'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prediseñadas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {TEMPLATES.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition ${
              activeTab === 'import'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Importar Archivo HTML / JSON</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: MIS PLANTILLAS */}
          {activeTab === 'custom' && (
            <div>
              {customTemplates.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Aún no tienes plantillas guardadas</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Puedes guardar cualquier diseño que estés editando para reutilizarlo cuando quieras.
                    </p>
                  </div>
                  {onOpenSaveModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSaveModal();
                      }}
                      className="mt-2 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guardar diseño actual como plantilla</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="border border-slate-800 hover:border-brand-500/60 rounded-xl bg-slate-950/50 hover:bg-slate-800/30 p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-brand-500/5 cursor-pointer relative"
                      onClick={() => {
                        onSelectTemplate(tmpl);
                        onClose();
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition">
                            {tmpl.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleDownloadTemplate(e, tmpl)}
                              title="Descargar archivo HTML reimportable"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTemplate(e, tmpl.id)}
                              title="Eliminar plantilla"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {tmpl.description && (
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {tmpl.description}
                          </p>
                        )}

                        {tmpl.subject && (
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            Asunto: {tmpl.subject}
                          </p>
                        )}

                        <div className="flex items-center space-x-3 pt-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {tmpl.blocks?.length || 0} Bloques
                          </span>
                          {tmpl.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(tmpl.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-brand-400 font-semibold group-hover:underline flex items-center gap-1">
                          Cargar esta plantilla &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREDISEÑADAS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="border border-slate-800 hover:border-brand-500/60 rounded-xl bg-slate-950/50 hover:bg-slate-800/30 p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-brand-500/5 cursor-pointer"
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition">
                        {tmpl.name}
                      </h4>
                      {tmpl.id === 'youtube-showcase' && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <YoutubeIcon className="w-3 h-3" />
                          <span>YouTube</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tmpl.description}
                    </p>
                    <div className="flex items-center space-x-2 pt-2 text-[11px] text-slate-500 font-mono">
                      <span>{tmpl.blocks.length} Bloques</span>
                      <span>•</span>
                      <span>Fondo {tmpl.globalSettings.contentBackgroundColor}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-brand-400 font-semibold group-hover:underline flex items-center gap-1">
                      Cargar esta plantilla &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: IMPORTAR ARCHIVO */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Drag & Drop Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,.json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Arrastra tu archivo HTML o haz clic para seleccionarlo
                </h4>
                <p className="text-xs text-slate-400 max-w-md mb-2">
                  Admite archivos <code className="text-brand-400">.html</code> exportados previamente desde PrettierMails (con restauración de bloques al 100%) o archivos <code className="text-indigo-400">.json</code>.
                </p>
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  <FileCode className="w-3.5 h-3.5 mr-1" />
                  Formatos soportados: .html, .htm, .json
                </span>
              </div>

              {/* Error state */}
              {importError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error de importación: </span>
                    <span>{importError}</span>
                  </div>
                </div>
              )}

              {/* Success Preview Box */}
              {importResult && (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-300">
                          Plantilla detectada correctamente
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Archivo: <span className="font-mono text-slate-300">{importResult.fileName}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {importResult.source === 'metadata-script' || importResult.source === 'metadata-comment'
                        ? '100% Fidelidad Nativa'
                        : importResult.source === 'json'
                        ? 'Exportación JSON'
                        : 'HTML Importado'}
                    </span>
                  </div>

                  {/* Summary metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-lg border border-emerald-500/20 text-xs">
                    <div>
                      <span className="text-slate-400">Nombre / Asunto:</span>
                      <p className="font-semibold text-slate-200 truncate">
                        {importResult.subject || importResult.name || 'Sin Asunto'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Bloques reconstruidos:</span>
                      <p className="font-semibold text-emerald-400">
                        {importResult.blocks?.length || 0} bloques
                      </p>
                    </div>
                  </div>

                  {/* Confirm CTA button */}
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImportFile(null);
                        setImportResult(null);
                      }}
                      className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Elegir otro archivo
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyImported}
                      className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition"
                    >
                      <span>Cargar en el lienzo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
