import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Mail, 
  User, 
  Server, 
  Loader2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SendEmailModal({
  isOpen,
  onClose,
  subject,
  htmlContent,
  globalSettings,
}) {
  if (!isOpen) return null;

  // Recipients state
  const [recipients, setRecipients] = useState(['test@example.com']);
  const [inputValue, setInputValue] = useState('');
  const [fromName, setFromName] = useState('PrettierMails');
  const [replyTo, setReplyTo] = useState('');
  const [mailSubject, setMailSubject] = useState(subject || 'Mi correo diseñado con PrettierMails');

  // SMTP Mode: 'ethereal' (instant test) or 'custom'
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
    if (recipients.length === 0) {
      setErrorMsg('Por favor ingresa al menos una dirección de correo destinataria.');
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
      const payload = {
        recipients,
        subject: mailSubject,
        html: htmlContent,
        fromName,
        replyTo: replyTo || undefined,
        backgroundColor: globalSettings.backgroundColor,
        smtpConfig: smtpMode === 'custom' ? smtpConfig : null,
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        } catch (_) {}
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

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
          {sendResult && sendResult.success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>¡Envío completado exitosamente! ({sendResult.sentCount} de {sendResult.total} enviados)</span>
              </div>
              {sendResult.samplePreviewUrl && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs text-emerald-200">
                    Bandeja de prueba en línea (Ethereal):
                  </span>
                  <a
                    href={sendResult.samplePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                  >
                    <span>Ver Correo en Ethereal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recipients Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                Destinatarios ({recipients.length})
              </label>
              <button
                type="button"
                onClick={() => setRecipients(prev => [...prev, `demo-${Date.now()}@test.com`])}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
              >
                + Añadir correo demo
              </button>
            </div>

            {/* Email Chips */}
            <div className="min-h-[42px] p-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap gap-1.5 items-center">
              {recipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-mono"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    className="hover:text-rose-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex-1 min-w-[200px] flex items-center">
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-400" />
                Servidor de Envío (SMTP)
              </span>
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSmtpMode('ethereal')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    smtpMode === 'ethereal'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prueba Instantánea (Ethereal)
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
                  SMTP Personalizado
                </button>
              </div>
            </div>

            {smtpMode === 'ethereal' ? (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <p className="font-semibold">⚡ Modo de Prueba Zero-Config:</p>
                <p className="text-[11px] text-slate-400">
                  No necesitas credenciales ni contraseñas. El servidor enviará el mensaje a través de Ethereal Email y te entregará un enlace web para ver el correo simulado exactamente como llegará a una bandeja real.
                </p>
              </div>
            ) : (
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
                    <label className="text-[11px] text-slate-400">Contraseña / Token</label>
                    <input
                      type="password"
                      value={smtpConfig.pass}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleVerifySmtp}
                    disabled={isVerifying || !smtpConfig.host || !smtpConfig.user}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                    <span>Probar Conexión SMTP</span>
                  </button>

                  {verifyStatus && (
                    <span className={`text-xs font-medium ${verifyStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {verifyStatus.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cerrar
          </button>

          <button
            onClick={handleSend}
            disabled={isLoading || recipients.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando correos...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar a {recipients.length} Destinatario{recipients.length === 1 ? '' : 's'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
