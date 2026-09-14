import { 
  Mail, 
  Send, 
  Eye, 
  Code, 
  LayoutTemplate, 
  Smartphone, 
  Monitor, 
  Trash2, 
  Sparkles,
  Save,
  ArrowLeft,
  Bell,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({
  subject,
  setSubject,
  previewMode,
  setPreviewMode,
  onOpenDashboard,
  onOpenAiModal,
  onOpenSaveTemplate,
  onOpenTemplates,
  onOpenPreview,
  onOpenHtmlExport,
  onOpenSendModal,
  onClearCanvas,
}) {
  return (
    <header className="h-16 bg-[#0c101a] border-b border-[#1a2233] px-4 flex items-center justify-between z-30 select-none text-slate-100">
      {/* Brand & Back Button */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 ring-1 ring-white/15">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">PrettierMails</span>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>

        {/* Back to Dashboard Button */}
        <button
          onClick={onOpenDashboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Regresar al Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Subject Line & Auto-Save Indicator */}
      <div className="flex items-center space-x-3 max-w-sm w-full mx-2">
        <div className="w-full">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo..."
            className="w-full bg-[#111726] border border-slate-800/80 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-medium"
          />
          <div className="flex items-center space-x-1 mt-0.5 px-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-mono">Auto-Guardado activo</span>
          </div>
        </div>
      </div>

      {/* Center Device Preview Switcher (Matched to Mockup: White pill for active) */}
      <div className="flex items-center bg-[#131927] p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setPreviewMode('desktop')}
          title="Vista de escritorio"
          className={`p-1.5 rounded-lg transition-all ${
            previewMode === 'desktop'
              ? 'bg-slate-800 text-brand-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewMode('mobile')}
          title="Vista móvil"
          className={`p-1.5 rounded-lg transition-all ${
            previewMode === 'mobile'
              ? 'bg-white text-slate-900 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons (Preview, Test Send, Save & Next) */}
      <div className="flex items-center space-x-2">
        {/* Preview Button */}
        <button
          onClick={onOpenPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Vista previa completa"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Preview</span>
        </button>

        {/* Test Send Button */}
        <button
          onClick={onOpenSendModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Prueba de envío"
        >
          <Send className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Test Send</span>
        </button>

        {/* HTML Export Button */}
        <button
          onClick={onOpenHtmlExport}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          title="Inspeccionar y exportar HTML"
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Save as Template / Save & Next */}
        <button
          onClick={onOpenSaveTemplate}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition hover:scale-105 active:scale-95"
          title="Guardar diseño"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save & Next</span>
        </button>

        {/* Notification Bell */}
        <div className="relative p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
        </div>

        {/* User profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-1 ring-white/20">
          JD
        </div>
      </div>
    </header>
  );
}
