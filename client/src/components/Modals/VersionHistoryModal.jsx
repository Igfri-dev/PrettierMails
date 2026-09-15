import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { listTemplateVersions, restoreTemplateVersion } from '../../services/templateApi.js';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  onVersionRestored,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState(null);

  const fetchVersions = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplateVersions(templateId);
      setVersions(data);
    } catch (err) {
      console.error('Error cargando versiones:', err);
      setError('No se pudo cargar el historial de versiones.');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (isOpen && templateId) {
      fetchVersions();
    }
  }, [isOpen, templateId, fetchVersions]);

  if (!isOpen) return null;

  const handleRestore = async (version) => {
    if (!window.confirm(`¿Seguro que deseas restaurar la versión #${version.version_number}? Se creará un nuevo punto en el historial con ese diseño.`)) {
      return;
    }

    setRestoringId(version.id);
    try {
      const restored = await restoreTemplateVersion(templateId, version.id);
      if (onVersionRestored) {
        onVersionRestored(restored);
      }
      onClose();
    } catch (err) {
      alert(`Error al restaurar: ${err.message}`);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#131929]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Historial de Versiones</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Plantilla: <strong className="text-slate-200">{templateName || 'Borrador actual'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs font-medium">Cargando versiones desde la base de datos...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs">No hay versiones guardadas para este documento todavía.</p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isLatest = idx === 0;
              const formattedDate = new Date(ver.created_at).toLocaleString();

              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isLatest
                      ? 'bg-slate-900/90 border-indigo-500/40 ring-1 ring-indigo-500/20'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        isLatest
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        v{ver.version_number}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Actual
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {ver.change_summary || `Versión ${ver.version_number}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {ver.block_count || 0} bloques
                      </span>
                      {ver.subject && (
                        <span className="text-slate-500 truncate max-w-xs hidden sm:inline">
                          &ldquo;{ver.subject}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleRestore(ver)}
                      disabled={isLatest || restoringId === ver.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 disabled:opacity-30 disabled:pointer-events-none transition"
                      title={isLatest ? 'Esta es la versión actual' : 'Restaurar esta versión'}
                    >
                      {restoringId === ver.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Restaurar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0c101a] flex items-center justify-between text-xs text-slate-500">
          <span>Cada vez que guardas o restauras, se crea una versión inmutable.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
