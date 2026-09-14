import { 
  Mail, 
  Send, 
  Eye, 
  Code, 
  LayoutTemplate, 
  Smartphone, 
  Monitor, 
  Trash2, 
  Undo2, 
  Sparkles,
  Save
} from 'lucide-react';

export default function Navbar({
  subject,
  setSubject,
  previewMode,
  setPreviewMode,
  onOpenAiModal,
  onOpenSaveTemplate,
  onOpenTemplates,
  onOpenPreview,
  onOpenHtmlExport,
  onOpenSendModal,
  onClearCanvas,
}) {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-base tracking-tight text-white">PrettierMails</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Visual Email Builder & Dispatcher</p>
        </div>
      </div>

      {/* Subject Line Input */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-500 font-mono">
            Asunto
          </div>
        </div>
      </div>

      {/* Center Device Preview Switcher */}
      <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setPreviewMode('desktop')}
          title="Vista de escritorio"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            previewMode === 'desktop'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Desktop</span>
        </button>
        <button
          onClick={() => setPreviewMode('mobile')}
          title="Vista móvil"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            previewMode === 'mobile'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Móvil</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        {/* AI Email Generator */}
        <button
          onClick={onOpenAiModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 shadow-md shadow-purple-500/20 border border-purple-400/30 transition transform active:scale-95"
          title="Diseñar correo con Inteligencia Artificial"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Crear con IA</span>
        </button>

        {/* Save as Template */}
        <button
          onClick={onOpenSaveTemplate}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          title="Guardar diseño como plantilla"
        >
          <Save className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">Guardar</span>
        </button>

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          title="Ver o cargar plantillas"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden lg:inline">Plantillas</span>
        </button>

        {/* Preview Modal */}
        <button
          onClick={onOpenPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          title="Vista previa completa"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Vista previa</span>
        </button>

        {/* HTML Export */}
        <button
          onClick={onOpenHtmlExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
          title="Inspeccionar y exportar HTML"
        >
          <Code className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">HTML</span>
        </button>

        {/* Clear */}
        <button
          onClick={onClearCanvas}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          title="Limpiar diseño"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <button
          onClick={onOpenSendModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/25 active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar Correo</span>
        </button>
      </div>
    </header>
  );
}
