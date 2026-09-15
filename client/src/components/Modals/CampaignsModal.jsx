import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  BarChart3,
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MousePointerClick,
  Eye,
  Mail,
  Users,
  Server,
  RefreshCw,
} from 'lucide-react';
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
  dispatchCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignStats,
} from '../../services/campaignApi.js';
import { listContactLists } from '../../services/contactApi.js';
import { listSmtpAccounts } from '../../services/smtpApi.js';
import { listTemplates } from '../../services/templateApi.js';
import useAuthStore from '../../store/authStore.js';
import useDocumentStore from '../../store/documentStore.js';

export default function CampaignsModal({ isOpen, onClose }) {
  const currentWorkspace = useAuthStore((state) => state.currentWorkspace);
  const currentSubject = useDocumentStore((state) => state.subject);

  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'create' | 'stats'
  const [campaigns, setCampaigns] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [smtpAccounts, setSmtpAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: currentSubject || '',
    templateId: '',
    contactListId: '',
    smtpAccountId: '',
    fromName: 'PrettierMails',
    replyTo: '',
    previewText: '',
    htmlContent: '<h1>Hola {{first_name|amigo}}</h1><p>Te damos la bienvenida a nuestra campaña.</p>',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Campaign for Stats
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [cmps, lists, smtps, tmpls] = await Promise.all([
        listCampaigns(),
        listContactLists().catch(() => []),
        listSmtpAccounts().catch(() => []),
        listTemplates().catch(() => []),
      ]);

      setCampaigns(cmps);
      setContactLists(lists);
      setSmtpAccounts(smtps);
      setTemplates(tmpls);

      if (lists.length > 0 && !campaignForm.contactListId) {
        setCampaignForm((prev) => ({ ...prev, contactListId: lists[0].id }));
      }
      if (smtps.length > 0 && !campaignForm.smtpAccountId) {
        const defaultSmtp = smtps.find((s) => s.is_default) || smtps[0];
        setCampaignForm((prev) => ({ ...prev, smtpAccountId: defaultSmtp.id }));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error cargando campañas.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, campaignForm.contactListId, campaignForm.smtpAccountId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Load Stats when viewing stats tab
  const loadStats = useCallback(async (campId) => {
    if (!campId) return;
    setIsLoadingStats(true);
    setErrorMsg(null);
    try {
      const data = await getCampaignStats(campId);
      setCampaignStats(data);
      setSelectedCampaignId(campId);
    } catch (err) {
      setErrorMsg(err.message || 'Error obteniendo estadísticas.');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  if (!isOpen) return null;

  // Handle Create Campaign
  const handleCreateCampaign = async (andDispatch = false) => {
    if (!campaignForm.name.trim()) {
      setErrorMsg('Por favor ingresa un nombre para la campaña.');
      return;
    }
    if (!campaignForm.subject.trim()) {
      setErrorMsg('El asunto de la campaña no puede estar vacío.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const created = await createCampaign({
        ...campaignForm,
        templateId: campaignForm.templateId || null,
        smtpAccountId: campaignForm.smtpAccountId || null,
        contactListId: campaignForm.contactListId || null,
      });

      if (andDispatch) {
        await dispatchCampaign(created.id);
        setSuccessMsg(`Campaña "${created.name}" creada e iniciada exitosamente.`);
      } else {
        setSuccessMsg(`Campaña "${created.name}" guardada como borrador.`);
      }

      setCampaignForm({
        name: '',
        subject: currentSubject || '',
        templateId: '',
        contactListId: contactLists[0]?.id || '',
        smtpAccountId: smtpAccounts[0]?.id || '',
        fromName: 'PrettierMails',
        replyTo: '',
        previewText: '',
        htmlContent: '<h1>Hola {{first_name|amigo}}</h1><p>Te damos la bienvenida a nuestra campaña.</p>',
      });

      setActiveTab('campaigns');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la campaña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actions
  const handleDispatch = async (camp) => {
    if (!window.confirm(`¿Iniciar el despacho de la campaña "${camp.name}"?`)) return;
    try {
      await dispatchCampaign(camp.id);
      setSuccessMsg(`Despacho de "${camp.name}" iniciado.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar despacho.');
    }
  };

  const handlePause = async (camp) => {
    try {
      await pauseCampaign(camp.id);
      setSuccessMsg(`Campaña "${camp.name}" pausada.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al pausar campaña.');
    }
  };

  const handleResume = async (camp) => {
    try {
      await resumeCampaign(camp.id);
      setSuccessMsg(`Campaña "${camp.name}" reanudada.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al reanudar campaña.');
    }
  };

  const handleDelete = async (camp) => {
    if (!window.confirm(`¿Eliminar definitivamente la campaña "${camp.name}" y todas sus analíticas?`)) return;
    try {
      await deleteCampaign(camp.id);
      setSuccessMsg('Campaña eliminada.');
      if (selectedCampaignId === camp.id) {
        setCampaignStats(null);
        setSelectedCampaignId(null);
      }
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar campaña.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Enviando
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completada
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Pause className="w-3 h-3" /> Pausada
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Fallida
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Borrador
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Campañas de Envío y Analítica
              </h2>
              <p className="text-xs text-slate-500">
                Espacio: <span className="font-semibold text-slate-700">{currentWorkspace?.name || 'Workspace'}</span> • Colas asíncronas, reintentos y métricas de apertura/clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-medium bg-white">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            Todas las Campañas ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Crear Campaña
          </button>
          <button
            onClick={() => {
              setActiveTab('stats');
              if (campaigns.length > 0 && !selectedCampaignId) {
                loadStats(campaigns[0].id);
              }
            }}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Métricas y Analítica
          </button>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: ALL CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Monitorea el progreso de despacho y el desempeño de tus correos en tiempo real
                </p>
                <button
                  onClick={() => loadData()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Cargando campañas...</span>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  <Send className="w-10 h-10 mx-auto text-slate-300" />
                  <h4 className="text-sm font-semibold text-slate-700">No hay campañas registradas</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Crea tu primera campaña para enviar a tus listas con colas automáticas, reintentos y métricas de apertura.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Crear Campaña
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-800">{camp.name}</h3>
                          {renderStatusBadge(camp.status)}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          Asunto: <span className="text-slate-700 font-normal">{camp.subject}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>Destinatarios: <strong className="text-slate-700">{camp.total_recipients || 0}</strong></span>
                          <span>Entregados: <strong className="text-slate-700">{camp.delivered_count || 0}</strong></span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-blue-500" />
                            Aperturas: <strong className="text-slate-700">{camp.opened_count || 0}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3 text-purple-500" />
                            Clics: <strong className="text-slate-700">{camp.clicked_count || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {camp.status === 'draft' && (
                          <button
                            onClick={() => handleDispatch(camp)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
                            title="Iniciar despacho"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Despachar
                          </button>
                        )}

                        {camp.status === 'sending' && (
                          <button
                            onClick={() => handlePause(camp)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition"
                            title="Pausar envío"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Pausar
                          </button>
                        )}

                        {camp.status === 'paused' && (
                          <button
                            onClick={() => handleResume(camp)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                            title="Reanudar envío"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Reanudar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCampaignId(camp.id);
                            loadStats(camp.id);
                            setActiveTab('stats');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition"
                          title="Ver analítica detallada"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                          Analítica
                        </button>

                        <button
                          onClick={() => handleDelete(camp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar campaña"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE CAMPAIGN */}
          {activeTab === 'create' && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Nueva Campaña de Envío</h3>
                <p className="text-xs text-slate-500">Configura los detalles de envío, la audiencia objetivo y las credenciales SMTP</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la campaña *</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="Ej: Lanzamiento Producto Septiembre"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Asunto del correo (Subject) *</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      placeholder="Ej: Novedades exclusivas para ti {{first_name}}"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      Lista de Contactos Objetivo
                    </label>
                    <select
                      value={campaignForm.contactListId}
                      onChange={(e) => setCampaignForm({ ...campaignForm, contactListId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los contactos suscritos del workspace</option>
                      {contactLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.memberCount || 0} miembros)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-indigo-500" />
                      Cuenta SMTP de Salida
                    </label>
                    <select
                      value={campaignForm.smtpAccountId}
                      onChange={(e) => setCampaignForm({ ...campaignForm, smtpAccountId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                      {smtpAccounts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} ({s.host}:{s.port}) {s.is_default ? '⭐' : ''}
                        </option>
                      ))}
                      {smtpAccounts.length === 0 && (
                        <option value="">Modo Sandbox de Pruebas (Ethereal)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Remitente</label>
                    <input
                      type="text"
                      value={campaignForm.fromName}
                      onChange={(e) => setCampaignForm({ ...campaignForm, fromName: e.target.value })}
                      placeholder="PrettierMails"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Responder a (Reply-To)</label>
                    <input
                      type="email"
                      value={campaignForm.replyTo}
                      onChange={(e) => setCampaignForm({ ...campaignForm, replyTo: e.target.value })}
                      placeholder="contacto@ejemplo.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Texto Previo (Preheader)</label>
                    <input
                      type="text"
                      value={campaignForm.previewText}
                      onChange={(e) => setCampaignForm({ ...campaignForm, previewText: e.target.value })}
                      placeholder="Resumen visible en la bandeja"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargar desde Plantilla del Espacio (Opcional):
                  </label>
                  <select
                    value={campaignForm.templateId}
                    onChange={(e) => {
                      const tmplId = e.target.value;
                      const matched = templates.find((t) => t.id === tmplId);
                      setCampaignForm({
                        ...campaignForm,
                        templateId: tmplId,
                        subject: matched?.subject || campaignForm.subject,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Redactar diseño manual / personalizado</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (v{t.current_version || 1})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contenido HTML del Correo:</label>
                  <textarea
                    rows={6}
                    value={campaignForm.htmlContent}
                    onChange={(e) => setCampaignForm({ ...campaignForm, htmlContent: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puedes usar variables como <code className="text-blue-600">{'{{first_name}}'}</code> o enlaces externos que serán rastreados automáticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('campaigns')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateCampaign(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateCampaign(true)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Guardar y Despachar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STATS & ANALYTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Campaign Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Reporte de Rendimiento
                    </h3>
                    <p className="text-xs text-slate-500">Métricas acumuladas de entrega, apertura y clics únicos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCampaignId || ''}
                    onChange={(e) => loadStats(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {selectedCampaignId && (
                    <button
                      onClick={() => loadStats(selectedCampaignId)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="Refrescar métricas"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isLoadingStats ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Calculando analítica...</span>
                </div>
              ) : !campaignStats ? (
                <div className="py-16 text-center text-slate-400">
                  Selecciona una campaña para visualizar sus estadísticas.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-medium text-slate-500">Total Envíos</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {campaignStats.metrics.total}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {campaignStats.metrics.delivered} entregados
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                      <div className="text-xs font-medium text-blue-600 flex items-center justify-between">
                        <span>Aperturas</span>
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mt-1">
                        {campaignStats.metrics.openRate}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {campaignStats.metrics.opened} lecturas
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
                      <div className="text-xs font-medium text-purple-600 flex items-center justify-between">
                        <span>Clics Únicos (CTR)</span>
                        <MousePointerClick className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mt-1">
                        {campaignStats.metrics.clickRate}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {campaignStats.metrics.clicked} clics
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-medium text-slate-500">Click-to-Open (CTOR)</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {campaignStats.metrics.clickToOpenRate}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {campaignStats.metrics.failed} fallidos
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bars */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tasas de Conversión</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>Tasa de Apertura (Open Rate)</span>
                          <span className="font-bold text-blue-600">{campaignStats.metrics.openRate}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(campaignStats.metrics.openRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>Tasa de Clics (Click-Through Rate)</span>
                          <span className="font-bold text-purple-600">{campaignStats.metrics.clickRate}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(campaignStats.metrics.clickRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Clicked Links */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Enlaces Más Cliqueados
                    </h4>
                    {campaignStats.topUrls.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No se han registrado clics en los enlaces aún.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {campaignStats.topUrls.map((u, i) => (
                          <div key={i} className="py-2 flex items-center justify-between gap-4">
                            <span className="text-slate-700 font-mono truncate max-w-md">{u.url}</span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md">
                              {u.count} clics
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Logs Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Registro Reciente de Entregas
                    </div>
                    {campaignStats.recentLogs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">Sin registros de entrega</div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2 px-4">Destinatario</th>
                            <th className="py-2 px-4">Estado</th>
                            <th className="py-2 px-4">Reintentos</th>
                            <th className="py-2 px-4 text-right">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {campaignStats.recentLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/60">
                              <td className="py-2 px-4 font-medium text-slate-800">{log.recipient_email}</td>
                              <td className="py-2 px-4">
                                {log.status === 'sent' || log.status === 'delivered' ? (
                                  <span className="text-emerald-600 font-medium">Entregado</span>
                                ) : log.status === 'opened' ? (
                                  <span className="text-blue-600 font-medium">Abierto</span>
                                ) : log.status === 'clicked' ? (
                                  <span className="text-purple-600 font-medium">Clickeado</span>
                                ) : (
                                  <span className="text-rose-600 font-medium">{log.status}</span>
                                )}
                              </td>
                              <td className="py-2 px-4 text-slate-500">{log.retry_count || 0}</td>
                              <td className="py-2 px-4 text-slate-400 text-right">
                                {log.sent_at ? new Date(log.sent_at).toLocaleTimeString('es-ES') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
