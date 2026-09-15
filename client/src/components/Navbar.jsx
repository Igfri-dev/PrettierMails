import { 
  Mail, 
  Send, 
  Eye, 
  Code, 
  Smartphone, 
  Monitor, 
  Save, 
  ArrowLeft, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Undo2,
  Redo2,
  History,
  Building2,
  LogIn,
  Server,
  Users,
  BarChart3,
  Zap
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';

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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  saveStatus = 'idle',
  lastSavedAt = null,
  isDirty = false,
  currentVersionNumber = 1,
  currentTemplateId = null,
  onOpenVersionHistory,
  onOpenWorkspaceModal,
  onOpenAuthModal,
  onOpenSmtpModal,
  onOpenContactsModal,
  onOpenCampaignsModal,
  onOpenAutomationsModal,
}) {
  const { user, currentWorkspace, isAuthenticated } = useAuthStore();

  return (
    <header className="h-16 bg-[#0c101a] border-b border-[#1a2233] px-4 flex items-center justify-between z-30 select-none text-slate-100">
      {/* Brand & Back Button & Workspace Switcher */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 ring-1 ring-white/15">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">PrettierMails</span>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-0.5 hidden sm:block"></div>

        {/* Back to Dashboard Button */}
        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Regresar al Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* Workspace Switcher Pill */}
        <button
          type="button"
          onClick={onOpenWorkspaceModal}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition"
          title="Cambiar espacio de trabajo"
        >
          <Building2 className="w-3 h-3 text-indigo-400" />
          <span className="max-w-[110px] truncate">{currentWorkspace?.name || 'Workspace'}</span>
        </button>
      </div>

      {/* Subject Line & Dynamic Auto-Save Indicator */}
      <div className="flex items-center space-x-3 max-w-sm w-full mx-2">
        <div className="w-full">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo..."
            className="w-full bg-[#111726] border border-slate-800/80 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-medium"
          />
          <div className="flex items-center space-x-1.5 mt-0.5 px-1">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />
                <span className="text-[10px] text-indigo-400 font-mono">Guardando en la nube...</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                <span className="text-[10px] text-rose-400 font-mono">Error al sincronizar</span>
              </>
            ) : isDirty ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-[10px] text-amber-400 font-mono">Cambios sin guardar</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-mono">
                  Sincronizado {lastSavedAt ? `(${lastSavedAt})` : ''}
                </span>
              </>
            )}
            {currentVersionNumber > 0 && (
              <span className="text-[10px] text-slate-500 font-mono pl-1 border-l border-slate-800">
                v{currentVersionNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Undo / Redo Controls */}
      <div className="flex items-center space-x-1 bg-[#131927] p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center Device Preview Switcher */}
      <div className="flex items-center bg-[#131927] p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          type="button"
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
          type="button"
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

      {/* Action buttons (Versions, Preview, Test Send, Save & Next) */}
      <div className="flex items-center space-x-2">
        {/* Version History Button */}
        {onOpenVersionHistory && currentTemplateId && (
          <button
            type="button"
            onClick={onOpenVersionHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
            title="Ver historial de versiones"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Historial</span>
          </button>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Vista previa completa"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Preview</span>
        </button>

        {/* Test Send Button */}
        <button
          type="button"
          onClick={onOpenSendModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141a29] hover:bg-slate-800 border border-slate-700/60 transition"
          title="Prueba de envío"
        >
          <Send className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Test Send</span>
        </button>

        {/* SMTP Accounts Button */}
        {onOpenSmtpModal && (
          <button
            type="button"
            onClick={onOpenSmtpModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Servidores SMTP y Auditoría"
          >
            <Server className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Contacts & Audience Button */}
        {onOpenContactsModal && (
          <button
            type="button"
            onClick={onOpenContactsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Contactos y Listas de Correo"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Campaigns & Analytics Button */}
        {onOpenCampaignsModal && (
          <button
            type="button"
            onClick={onOpenCampaignsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Campañas y Analítica de Envío"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Automations & Webhooks Button */}
        {onOpenAutomationsModal && (
          <button
            type="button"
            onClick={onOpenAutomationsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Automatizaciones y Webhooks"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        )}

        {/* HTML Export Button */}
        <button
          type="button"
          onClick={onOpenHtmlExport}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          title="Inspeccionar y exportar HTML"
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Save as Template / Save & Next */}
        <button
          type="button"
          onClick={onOpenSaveTemplate}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition hover:scale-105 active:scale-95"
          title="Guardar diseño o crear versión"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save & Next</span>
        </button>

        {/* Notification Bell */}
        <div className="relative p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
        </div>

        {/* User profile avatar or Login button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onOpenWorkspaceModal}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-1 ring-white/20 hover:ring-brand-500/50 transition cursor-pointer"
            title={`${user?.name || 'Usuario'} • Rol: ${currentWorkspace?.role || 'editor'}`}
          >
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Iniciar Sesión</span>
          </button>
        )}
      </div>
    </header>
  );
}
