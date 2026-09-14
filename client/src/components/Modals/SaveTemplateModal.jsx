import React, { useState, useEffect } from 'react';
import { X, BookmarkPlus, Download, Check, Save, Layers, Palette } from 'lucide-react';
import { saveCustomTemplate, downloadTemplateAsHtml } from '../../utils/templateStorage.js';

export default function SaveTemplateModal({
  isOpen,
  onClose,
  subject,
  globalSettings,
  blocks,
  onSaved,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill name when opening
  useEffect(() => {
    if (isOpen) {
      setName(subject ? subject.trim() : 'Mi Plantilla');
      setDescription('');
      setSavedSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  const handleSaveToWebapp = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa un nombre para la plantilla.');
      return;
    }

    try {
      const saved = saveCustomTemplate({
        name: name.trim(),
        description: description.trim(),
        subject: subject || '',
        globalSettings,
        blocks,
      });

      setSavedSuccess(true);
      if (onSaved) onSaved(saved);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la plantilla.');
    }
  };

  const handleDownloadHtml = () => {
    const templateName = name.trim() || subject || 'email-template';
    downloadTemplateAsHtml({
      name: templateName,
      subject: subject || '',
      globalSettings,
      blocks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Guardar como Plantilla</h3>
              <p className="text-xs text-slate-400">
                Almacena tu diseño en la webapp o expórtalo como archivo HTML reimportable
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

        {/* Content Form */}
        <form onSubmit={handleSaveToWebapp} className="p-6 space-y-4">
          {/* Summary Card */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>
                <strong>{blocks.length}</strong> bloques en el correo
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-slate-700"
                  style={{ backgroundColor: globalSettings.backgroundColor || '#0f172a' }}
                />
                <span
                  className="w-3 h-3 rounded-full border border-slate-700"
                  style={{ backgroundColor: globalSettings.contentBackgroundColor || '#ffffff' }}
                />
              </span>
            </div>
          </div>

          {/* Template Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Nombre de la Plantilla <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ej. Notificación de Bienvenida Institucional"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Descripción <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Plantilla con credenciales y accesos para nuevos funcionarios..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition"
              title="Descarga el archivo HTML con la metadata completa para restaurarlo cuando quieras"
            >
              <Download className="w-3.5 h-3.5 text-brand-400" />
              <span>Descargar .html</span>
            </button>

            <div className="w-full sm:w-auto flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savedSuccess}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  savedSuccess
                    ? 'bg-emerald-600'
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20 active:scale-95'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar en WebApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
