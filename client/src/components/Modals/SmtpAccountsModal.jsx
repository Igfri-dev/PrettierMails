import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Server,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Activity,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import {
  listSmtpAccounts,
  createSmtpAccount,
  updateSmtpAccount,
  deleteSmtpAccount,
  testSmtpAccount,
  setDefaultSmtpAccount,
  listAuditLogs,
} from '../../services/smtpApi.js';
import useAuthStore from '../../store/authStore.js';

const PRESETS = [
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    hint: 'Requiere contraseña de aplicación de 16 caracteres de tu cuenta Google.',
  },
  {
    id: 'outlook',
    name: 'Microsoft 365 / Outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    hint: 'Requiere autenticación SMTP AUTH habilitada en el centro de administración de Microsoft.',
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    hint: 'Usa tus credenciales IAM generadas en la consola de Amazon SES.',
  },
  {
    id: 'brevo',
    name: 'Brevo (Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    hint: 'Usa tu clave SMTP API proporcionada por Brevo.',
  },
  {
    id: 'custom',
    name: 'Servidor Personalizado (Custom)',
    host: '',
    port: 587,
    secure: false,
    hint: 'Configura cualquier servidor de correo corporativo o proveedor privado.',
  },
];

export default function SmtpAccountsModal({ isOpen, onClose }) {
  const currentWorkspace = useAuthStore((state) => state.currentWorkspace);

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'audit'
  const [accounts, setAccounts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [formData, setFormData] = useState({
    label: '',
    host: '',
    port: 587,
    secure: false,
    authUser: '',
    password: '',
    fromName: '',
    fromEmail: '',
    isDefault: false,
    dailyLimit: 500,
  });

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await listSmtpAccounts();
      setAccounts(data || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const data = await listAuditLogs(40);
      setAuditLogs(data || []);
    } catch (err) {
      console.warn('No se pudieron cargar logs de auditoría:', err.message);
    }
  }, []);

  // Fetch accounts on open or workspace change
  useEffect(() => {
    if (!isOpen) return;
    loadAccounts();
    loadAudit();
  }, [isOpen, currentWorkspace?.id, loadAccounts, loadAudit]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      label: prev.label || preset.name,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    }));
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setFormData({
      label: '',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      authUser: '',
      password: '',
      fromName: '',
      fromEmail: '',
      isDefault: accounts.length === 0,
      dailyLimit: 500,
    });
    setTestResult(null);
    setIsEditing(true);
  };

  const handleStartEdit = (acc) => {
    setEditingId(acc.id);
    setFormData({
      label: acc.label,
      host: acc.host,
      port: acc.port,
      secure: acc.secure,
      authUser: acc.auth_user || '',
      password: '', // Kept empty unless changing
      fromName: acc.from_name || '',
      fromEmail: acc.from_email || '',
      isDefault: Boolean(acc.is_default),
      dailyLimit: acc.daily_limit || 500,
    });
    setTestResult(null);
    setIsEditing(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.label.trim() || !formData.host.trim()) {
      setErrorMsg('El nombre y el host SMTP son obligatorios.');
      return;
    }

    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        await updateSmtpAccount(editingId, payload);
        setSuccessMsg('Cuenta SMTP actualizada correctamente.');
      } else {
        await createSmtpAccount(formData);
        setSuccessMsg('Cuenta SMTP creada y cifrada con éxito.');
      }

      setIsEditing(false);
      setEditingId(null);
      await loadAccounts();
      await loadAudit();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteAccount = async (id, label) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la cuenta SMTP "${label}"?`)) {
      return;
    }

    try {
      await deleteSmtpAccount(id);
      await loadAccounts();
      await loadAudit();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultSmtpAccount(id);
      await loadAccounts();
      await loadAudit();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleTestSavedAccount = async (id) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSmtpAccount(id);
      setTestResult({ id, success: res.success, message: res.message });
      await loadAudit();
    } catch (err) {
      setTestResult({ id, success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smtp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-[#0e1422] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121929]/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 id="smtp-modal-title" className="text-base font-bold text-white flex items-center space-x-2">
                <span>Servidores SMTP y Auditoría</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  AES-256-GCM
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Workspace: <span className="text-slate-200 font-medium">{currentWorkspace?.name || 'Workspace'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tabs */}
            <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('accounts');
                  setIsEditing(false);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeTab === 'accounts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cuentas SMTP ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('audit');
                  setIsEditing(false);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Auditoría</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SMTP ACCOUNTS */}
          {activeTab === 'accounts' && (
            <>
              {isEditing ? (
                /* Add / Edit Form */
                <form onSubmit={handleSaveAccount} className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-semibold text-white">
                      {editingId ? 'Editar Servidor SMTP' : 'Registrar Nuevo Servidor SMTP'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-400 hover:text-white transition underline"
                    >
                      Volver a la lista
                    </button>
                  </div>

                  {/* Provider Presets */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Seleccionar proveedor preconfigurado (Presets rápidos):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-3 py-2 rounded-lg bg-[#141a2a] hover:bg-[#1a2236] border border-slate-800 hover:border-indigo-500/50 text-left text-xs text-slate-300 hover:text-white transition flex flex-col justify-between"
                        >
                          <span className="font-semibold text-slate-200">{preset.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-1">
                            {preset.host ? `${preset.host}:${preset.port}` : 'Personalizado'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nombre / Etiqueta de la cuenta <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="Ej. Soporte al Cliente, Marketing Principal"
                        className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Host SMTP <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.host}
                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Puerto</label>
                        <input
                          type="number"
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                          className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-1.5">
                        <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.secure}
                            onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 w-4 h-4"
                          />
                          <span>SSL/TLS Seguro</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Usuario / API Key
                      </label>
                      <input
                        type="text"
                        value={formData.authUser}
                        onChange={(e) => setFormData({ ...formData, authUser: e.target.value })}
                        placeholder="tu-correo@dominio.com"
                        className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                        <span>Contraseña / Clave Secreta</span>
                        <span className="text-[10px] text-indigo-400 font-normal flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Cifrado AES-256</span>
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingId ? '•••••••• (Dejar en blanco para mantener actual)' : 'Contraseña o App Password'}
                          className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nombre de Remitente por defecto
                      </label>
                      <input
                        type="text"
                        value={formData.fromName}
                        onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                        placeholder="Ej. PrettierMails Equipo"
                        className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Correo de Remitente por defecto
                      </label>
                      <input
                        type="email"
                        value={formData.fromEmail}
                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                        placeholder="remitente@tudominio.com"
                        className="w-full bg-[#131927] border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <input
                        type="checkbox"
                        id="isDefaultAccount"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 w-4 h-4"
                      />
                      <label htmlFor="isDefaultAccount" className="text-xs text-slate-300 cursor-pointer">
                        Establecer como cuenta predeterminada del workspace
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
                    >
                      {editingId ? 'Guardar Cambios' : 'Registrar Servidor'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Accounts List View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Servidores de Correo Activos</h4>
                      <p className="text-xs text-slate-400">
                        Administra las cuentas SMTP autorizadas para el despacho masivo e individual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Servidor</span>
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      <span className="text-xs">Cargando servidores SMTP...</span>
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="py-12 px-6 rounded-2xl bg-[#111726] border border-dashed border-slate-800 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Server className="w-6 h-6" />
                      </div>
                      <h5 className="text-sm font-semibold text-white">No hay servidores SMTP registrados</h5>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Actualmente los correos se envían en modo de prueba (Ethereal sandbox). Registra tu servidor Gmail, SES, Brevo o corporativo para enviar correos reales.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartCreate}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Configurar Primer Servidor</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((acc) => {
                        const isThisTesting = isTesting && testResult?.id === acc.id;
                        const thisResult = testResult?.id === acc.id ? testResult : null;

                        return (
                          <div
                            key={acc.id}
                            className={`p-4 rounded-xl border transition ${
                              acc.is_default
                                ? 'bg-[#141c2e] border-indigo-500/40 shadow-sm'
                                : 'bg-[#111726] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-sm font-bold text-white">{acc.label}</h5>
                                  {acc.is_default && (
                                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                                      <span>Predeterminado</span>
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                    {acc.host}:{acc.port}
                                  </span>
                                  {acc.secure && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      SSL/TLS
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center space-x-2">
                                  <span>Remitente:</span>
                                  <span className="text-slate-200">
                                    {acc.from_name ? `"${acc.from_name}" ` : ''}
                                    {acc.from_email || acc.auth_user || 'Sin especificar'}
                                  </span>
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleTestSavedAccount(acc.id)}
                                  disabled={isTesting}
                                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition disabled:opacity-50"
                                  title="Probar conexión SMTP real"
                                >
                                  {isThisTesting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                  <span>Probar</span>
                                </button>

                                {!acc.is_default && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefault(acc.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                                    title="Establecer como predeterminado"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(acc)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                                  title="Editar configuración"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount(acc.id, acc.label)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                                  title="Eliminar servidor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Test Status Banner */}
                            {thisResult && (
                              <div
                                className={`mt-3 p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                                  thisResult.success
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {thisResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                )}
                                <span>{thisResult.message}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Registro de Auditoría Operacional</h4>
                  <p className="text-xs text-slate-400">
                    Historial cronológico de envíos, actualizaciones de configuración y eventos de seguridad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAudit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Actualizar
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No hay registros de auditoría registrados en este espacio de trabajo todavía.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#111726]">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#141c2e] text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Acción</th>
                        <th className="px-4 py-2.5">Recurso</th>
                        <th className="px-4 py-2.5">Detalles</th>
                        <th className="px-4 py-2.5">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {auditLogs.map((log) => {
                        let actionBadgeColor = 'bg-slate-800 text-slate-300';
                        if (log.action.includes('created')) actionBadgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        if (log.action.includes('deleted')) actionBadgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                        if (log.action.includes('sent')) actionBadgeColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                        if (log.action.includes('tested')) actionBadgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition">
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${actionBadgeColor}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-400">{log.resource_type}</td>
                            <td className="px-4 py-2.5 max-w-xs truncate text-slate-300">
                              {log.metadata ? (
                                <span>
                                  {log.metadata.subject ? `Asunto: "${log.metadata.subject}"` : ''}
                                  {log.metadata.label ? `Cuenta: "${log.metadata.label}"` : ''}
                                  {log.metadata.totalRecipients ? ` (${log.metadata.sentCount}/${log.metadata.totalRecipients} enviados)` : ''}
                                  {!log.metadata.subject && !log.metadata.label ? JSON.stringify(log.metadata) : ''}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                              {log.created_at ? new Date(log.created_at).toLocaleString('es-ES') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0e1422] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Credenciales protegidas con cifrado simétrico por cuenta</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
