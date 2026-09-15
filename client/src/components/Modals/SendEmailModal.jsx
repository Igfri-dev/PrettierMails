import { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Mail, 
  User, 
  Server, 
  Loader2,
  ShieldCheck,
  ListFilter,
  Code
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { listSmtpAccounts } from '../../services/smtpApi.js';
import { listContactLists } from '../../services/contactApi.js';
import useAuthStore from '../../store/authStore.js';

export default function SendEmailModal({
  isOpen,
  onClose,
  subject,
  htmlContent,
  globalSettings,
  onOpenSmtpModal,
}) {
  // Recipients state
  const [recipientMode, setRecipientMode] = useState('manual'); // 'manual' | 'list'
  const [contactLists, setContactLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [recipients, setRecipients] = useState(['test@example.com']);
  const [inputValue, setInputValue] = useState('');
  const [fromName, setFromName] = useState('PrettierMails');
  const [replyTo, setReplyTo] = useState('');
  const [mailSubject, setMailSubject] = useState(subject || 'Mi correo diseñado con PrettierMails');

  // Workspace SMTP accounts
  const [workspaceAccounts, setWorkspaceAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // SMTP Mode: 'workspace' | 'ethereal' | 'custom'
  const [smtpMode, setSmtpMode] = useState('ethereal');
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    pass: '',
    secure: false,
  });

  // Sending and results state
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [sendResult, setSendResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentWorkspace = useAuthStore((state) => state.currentWorkspace);

  // Keep mailSubject in sync when subject prop changes
  useEffect(() => {
    if (subject) {
      setMailSubject(subject);
    }
  }, [subject]);

  // Load workspace SMTP accounts and contact lists
  useEffect(() => {
    if (!isOpen) return;
    listSmtpAccounts()
      .then((accs) => {
        if (Array.isArray(accs) && accs.length > 0) {
          setWorkspaceAccounts(accs);
          const defaultAcc = accs.find((a) => a.is_default) || accs[0];
          setSelectedAccountId(defaultAcc.id);
          setSmtpMode('workspace');
          if (defaultAcc.from_name) {
            setFromName(defaultAcc.from_name);
          }
        } else {
          setWorkspaceAccounts([]);
          setSmtpMode('ethereal');
        }
      })
      .catch((err) => {
        console.warn('No se pudieron recuperar cuentas SMTP del workspace:', err.message);
        setSmtpMode('ethereal');
      });

    listContactLists()
      .then((lists) => {
        if (Array.isArray(lists)) {
          setContactLists(lists);
          if (lists.length > 0 && !selectedListId) {
            setSelectedListId(lists[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('No se pudieron recuperar listas de contactos:', err.message);
      });
  }, [isOpen, currentWorkspace?.id, selectedListId]);

  if (!isOpen) return null;

  // Email chip addition
  const handleAddRecipient = () => {
    if (!inputValue.trim()) return;
    const parts = inputValue.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);
    const valid = parts.filter(p => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
    if (valid.length > 0) {
      setRecipients(prev => Array.from(new Set([...prev, ...valid])));
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  const handleRemoveRecipient = (emailToRemove) => {
    setRecipients(prev => prev.filter(email => email !== emailToRemove));
  };

  // Test SMTP connection
  const handleVerifySmtp = async () => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('/api/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig }),
      });
      const data = await res.json();
      setVerifyStatus(data);
    } catch (err) {
      setVerifyStatus({ success: false, message: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  // Dispatch Email
  const handleSend = async () => {
    if (recipientMode === 'manual' && recipients.length === 0) {
      setErrorMsg('Por favor ingresa al menos una dirección de correo destinataria.');
      return;
    }

    if (recipientMode === 'list' && !selectedListId) {
      setErrorMsg('Por favor selecciona una lista de contactos para el envío.');
      return;
    }

    if (!mailSubject.trim()) {
      setErrorMsg('El asunto no puede estar vacío.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSendResult(null);

    try {
      const token = useAuthStore.getState().token;
      const workspaceId = currentWorkspace?.id || 'ws-default';

      const headers = {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const payload = {
        recipients: recipientMode === 'manual' ? recipients : [],
        contactListId: recipientMode === 'list' ? selectedListId : null,
        subject: mailSubject,
        html: htmlContent,
        fromName,
        replyTo: replyTo || undefined,
        backgroundColor: globalSettings?.backgroundColor || '#f1f5f9',
        smtpAccountId: smtpMode === 'workspace' ? selectedAccountId : null,
        smtpConfig: smtpMode === 'custom' ? smtpConfig : null,
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el correo.');
      }

      setSendResult(data);

      if (data.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAccount = workspaceAccounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enviar Correo Electrónico</h3>
              <p className="text-xs text-slate-400">Envía tu diseño a uno o varios destinatarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Result Banner if Sent */}
          {sendResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              sendResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                {sendResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>¡Envío procesado con éxito!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>Hubo errores al procesar el envío</span>
                  </>
                )}
              </div>

              <p className="text-slate-300">
                Enviados: <span className="font-bold text-white">{sendResult.sentCount || 0}</span> de{' '}
                <span className="font-bold text-white">{sendResult.total || 0}</span> destinatarios.
              </p>

              {sendResult.isTest && sendResult.samplePreviewUrl && (
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-slate-400">Sandbox Ethereal disponible:</span>
                  <a
                    href={sendResult.samplePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-brand-500 text-white font-medium hover:bg-brand-600 transition"
                  >
                    <span>Abrir Correo Recibido</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recipient Mode Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRecipientMode('manual')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                recipientMode === 'manual'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Destinatarios Manuales
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode('list')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                recipientMode === 'list'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Lista de Contactos ({contactLists.length})
            </button>
          </div>

          {/* Recipients Input (Manual Mode) */}
          {recipientMode === 'manual' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Destinatarios ({recipients.length})
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Máximo 50 por envío</span>
              </label>

              <div className="min-h-[72px] p-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-brand-500 transition">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-xs text-slate-200"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(email)}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleAddRecipient}
                    placeholder="Escribe correo y presiona Enter o coma..."
                    className="w-full bg-transparent border-0 text-xs text-slate-200 placeholder-slate-500 focus:outline-none px-1 py-1"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Puedes pegar varios correos separados por comas o saltos de línea.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  Seleccionar Lista de Contactos
                </span>
                <span className="text-[10px] text-brand-400 font-medium">Personalización activa</span>
              </label>

              {contactLists.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                  No hay listas creadas en este espacio. Puedes crearlas desde el menú Contactos.
                </div>
              ) : (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {contactLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.memberCount || 0} miembros)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Merge Tags Pill Banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300">
            <Code className="w-3.5 h-3.5 shrink-0 text-brand-400" />
            <span>
              Tip: Personaliza tu correo usando etiquetas dinámicas como{' '}
              <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-brand-200">{'{{first_name}}'}</code> o{' '}
              <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-brand-200">{'{{first_name|cliente}}'}</code>.
            </span>
          </div>

          {/* Subject & Sender Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Asunto del Correo (Subject)</label>
              <input
                type="text"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                placeholder="Ej. Novedades exclusivas de la semana"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Nombre del Remitente
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Ej. PrettierMails Equipo"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Reply-To */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200">Responder a (Reply-To opcional)</label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="soporte@tuempresa.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* SMTP Configuration Accordion / Tabs */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-400" />
                Servidor de Envío (SMTP)
              </span>
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] overflow-x-auto">
                {workspaceAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSmtpMode('workspace')}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      smtpMode === 'workspace'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cuentas Workspace ({workspaceAccounts.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSmtpMode('ethereal')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    smtpMode === 'ethereal'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prueba (Ethereal)
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpMode('custom')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    smtpMode === 'custom'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SMTP Manual
                </button>
              </div>
            </div>

            {/* Mode 1: Workspace Saved Accounts */}
            {smtpMode === 'workspace' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">
                    Seleccionar cuenta autorizada del workspace:
                  </label>
                  {onOpenSmtpModal && (
                    <button
                      type="button"
                      onClick={onOpenSmtpModal}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Gestionar servidores</span>
                    </button>
                  )}
                </div>

                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    const acc = workspaceAccounts.find((a) => a.id === e.target.value);
                    if (acc?.from_name) setFromName(acc.from_name);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {workspaceAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label} — {acc.host}:{acc.port} {acc.is_default ? '★ (Predeterminado)' : ''}
                    </option>
                  ))}
                </select>

                {selectedAccount && (
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Remitente: <strong className="text-slate-200">{selectedAccount.from_email || selectedAccount.auth_user || 'Configurado en cuenta'}</strong>
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">Cifrado AES-256</span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Ethereal Instant Test */}
            {smtpMode === 'ethereal' && (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">⚡ Modo de Prueba Zero-Config:</p>
                  {onOpenSmtpModal && (
                    <button
                      type="button"
                      onClick={onOpenSmtpModal}
                      className="text-[11px] text-indigo-300 hover:text-white underline"
                    >
                      Configurar cuenta SMTP real
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  No necesitas credenciales. El servidor despachará el mensaje vía Ethereal Email y te generará un enlace web para ver el correo simulado tal como llegará a una bandeja real.
                </p>
              </div>
            )}

            {/* Mode 3: Custom Direct Credentials */}
            {smtpMode === 'custom' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Host SMTP</label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Puerto</label>
                    <input
                      type="text"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      placeholder="587"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Usuario / Correo</label>
                    <input
                      type="text"
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      placeholder="tu-correo@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Contraseña / App Password</label>
                    <input
                      type="password"
                      value={smtpConfig.pass}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-0"
                    />
                    <span>Conexión segura SSL/TLS (Puerto 465)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleVerifySmtp}
                    disabled={isVerifying}
                    className="px-3 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition disabled:opacity-50"
                  >
                    {isVerifying ? 'Verificando...' : 'Probar conexión'}
                  </button>
                </div>

                {verifyStatus && (
                  <div className={`p-2 rounded text-xs flex items-center space-x-1.5 ${
                    verifyStatus.success 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {verifyStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{verifyStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando {recipients.length} correo(s)...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
