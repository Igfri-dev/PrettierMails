import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  Webhook,
  Plus,
  Trash2,
  Play,
  Pause,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Activity,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  addAutomationStep,
  deleteAutomationStep,
  listAutomationLogs,
  triggerAutomationEvent,
} from '../../services/automationApi.js';
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  listWebhookDeliveries,
  dispatchWebhookEvent,
} from '../../services/webhookApi.js';
import { listContactLists } from '../../services/contactApi.js';
import { listTemplates } from '../../services/templateApi.js';

export default function AutomationsModal({ isOpen, onClose }) {

  const [activeTab, setActiveTab] = useState('automations'); // 'automations' | 'webhooks'
  const [automations, setAutomations] = useState([]);
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [autoLogs, setAutoLogs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Forms state
  const [showNewAutoModal, setShowNewAutoModal] = useState(false);
  const [newAutoForm, setNewAutoForm] = useState({
    name: '',
    triggerType: 'contact.subscribed',
  });

  const [showNewStepModal, setShowNewStepModal] = useState(false);
  const [newStepForm, setNewStepForm] = useState({
    stepType: 'send_email',
    subject: '¡Gracias por suscribirte!',
    templateId: '',
    listId: '',
    delayMinutes: 5,
  });

  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [newWebhookForm, setNewWebhookForm] = useState({
    url: '',
    secret: '',
    events: ['*'],
  });

  const [showSecretMap, setShowSecretMap] = useState({});

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setMessage(msg);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [autos, hooks, lists, tmpls] = await Promise.all([
        listAutomations().catch(() => []),
        listWebhooks().catch(() => []),
        listContactLists().catch(() => []),
        listTemplates().catch(() => []),
      ]);
      setAutomations(autos);
      setWebhooks(hooks);
      setContactLists(lists);
      setTemplates(tmpls);

      if (selectedAuto) {
        const refreshed = await getAutomation(selectedAuto.id).catch(() => null);
        if (refreshed) {
          setSelectedAuto(refreshed);
          const logs = await listAutomationLogs(refreshed.id).catch(() => []);
          setAutoLogs(logs);
        }
      }
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAuto]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Select an automation and fetch its steps & logs
  const handleSelectAuto = async (auto) => {
    setIsLoading(true);
    try {
      const full = await getAutomation(auto.id);
      setSelectedAuto(full);
      const logs = await listAutomationLogs(auto.id);
      setAutoLogs(logs);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Create automation
  const handleCreateAutomation = async (e) => {
    e.preventDefault();
    if (!newAutoForm.name) return;
    setIsLoading(true);
    try {
      const created = await createAutomation({
        name: newAutoForm.name,
        triggerType: newAutoForm.triggerType,
      });
      setShowNewAutoModal(false);
      setNewAutoForm({ name: '', triggerType: 'contact.subscribed' });
      await loadData();
      handleSelectAuto(created);
      showNotification('Automatización creada con éxito.');
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle status (active/paused)
  const handleToggleAutoStatus = async (auto) => {
    const nextStatus = auto.status === 'active' ? 'paused' : 'active';
    try {
      await updateAutomation(auto.id, { status: nextStatus });
      await loadData();
      if (selectedAuto && selectedAuto.id === auto.id) {
        setSelectedAuto((prev) => ({ ...prev, status: nextStatus }));
      }
      showNotification(`Automatización ${nextStatus === 'active' ? 'activada' : 'pausada'}.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Delete automation
  const handleDeleteAutomation = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta automatización y sus pasos?')) return;
    try {
      await deleteAutomation(id);
      if (selectedAuto?.id === id) {
        setSelectedAuto(null);
      }
      await loadData();
      showNotification('Automatización eliminada.');
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Add step to selected automation
  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!selectedAuto) return;
    setIsLoading(true);
    try {
      let stepConfig = {};
      if (newStepForm.stepType === 'send_email') {
        stepConfig = {
          subject: newStepForm.subject,
          templateId: newStepForm.templateId || null,
        };
      } else if (newStepForm.stepType === 'add_to_list') {
        stepConfig = {
          listId: newStepForm.listId,
        };
      } else if (newStepForm.stepType === 'wait_delay') {
        stepConfig = {
          delayMinutes: Number(newStepForm.delayMinutes) || 5,
        };
      }

      await addAutomationStep(selectedAuto.id, {
        stepType: newStepForm.stepType,
        stepConfig,
      });

      setShowNewStepModal(false);
      const full = await getAutomation(selectedAuto.id);
      setSelectedAuto(full);
      showNotification('Paso agregado a la secuencia.');
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete step
  const handleDeleteStep = async (stepId) => {
    if (!selectedAuto) return;
    try {
      await deleteAutomationStep(selectedAuto.id, stepId);
      const full = await getAutomation(selectedAuto.id);
      setSelectedAuto(full);
      showNotification('Paso eliminado.');
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Test trigger event
  const handleTestTrigger = async () => {
    if (!selectedAuto) return;
    const email = window.prompt('Ingresa un email de prueba para disparar este flujo:', 'test@usuario.com');
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await triggerAutomationEvent(selectedAuto.trigger_type, {
        email,
        contact: { email, first_name: 'Usuario', last_name: 'Demo' },
      });
      showNotification(`Disparador ejecutado. ${res.executedCount || 1} flujo(s) activados.`);
      const logs = await listAutomationLogs(selectedAuto.id);
      setAutoLogs(logs);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Webhook
  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!newWebhookForm.url) return;
    setIsLoading(true);
    try {
      await createWebhook({
        url: newWebhookForm.url,
        secret: newWebhookForm.secret || null,
        events: newWebhookForm.events,
      });
      setShowNewWebhookModal(false);
      setNewWebhookForm({ url: '', secret: '', events: ['*'] });
      await loadData();
      showNotification('Webhook registrado exitosamente con firma HMAC-SHA256.');
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch Test Ping Webhook
  const handleDispatchTestPing = async (hook) => {
    setIsLoading(true);
    try {
      const res = await dispatchWebhookEvent('ping.test', {
        message: 'PrettierMails Webhook Ping Verification',
        timestamp: new Date().toISOString(),
        webhookId: hook.id,
      });
      showNotification(`Ping enviado. ${res.deliveries?.length || 1} entrega(s) registradas.`);
      handleViewDeliveries(hook);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // View Deliveries
  const handleViewDeliveries = async (hook) => {
    setSelectedWebhook(hook);
    setIsLoading(true);
    try {
      const dels = await listWebhookDeliveries(hook.id);
      setDeliveries(dels);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este webhook?')) return;
    try {
      await deleteWebhook(id);
      if (selectedWebhook?.id === id) setSelectedWebhook(null);
      await loadData();
      showNotification('Webhook eliminado.');
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">
                  Automatizaciones & Webhooks
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Fase 9 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Flujos de trabajo basados en eventos, secuencias de correo y notificaciones salientes HMAC-SHA256
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center space-x-2 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex space-x-6">
          <button
            onClick={() => {
              setActiveTab('automations');
              setSelectedWebhook(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'automations'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Flujos y Automatizaciones ({automations.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('webhooks');
              setSelectedAuto(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'webhooks'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhooks Salientes ({webhooks.length})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AUTOMATIONS */}
          {activeTab === 'automations' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Automations list */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tus Automatizaciones
                  </h4>
                  <button
                    onClick={() => setShowNewAutoModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Flujo</span>
                  </button>
                </div>

                {automations.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                    <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">No hay automatizaciones activas</p>
                    <p className="text-[11px] text-slate-500 mt-1">Crea tu primer flujo de bienvenida o seguimiento automático</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {automations.map((auto) => {
                      const isSelected = selectedAuto?.id === auto.id;
                      return (
                        <div
                          key={auto.id}
                          onClick={() => handleSelectAuto(auto)}
                          className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/5'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="text-xs font-bold text-slate-100">{auto.name}</h5>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    auto.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {auto.status === 'active' ? 'Activo' : 'Pausado'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-400">
                                <span className="font-mono text-purple-400">{auto.trigger_type}</span>
                                <span>•</span>
                                <span>{auto.step_count || 0} pasos</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleAutoStatus(auto)}
                                title={auto.status === 'active' ? 'Pausar' : 'Activar'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition"
                              >
                                {auto.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteAutomation(auto.id)}
                                title="Eliminar"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Workflow Steps & Sequence Builder */}
              <div className="lg:col-span-7 space-y-4">
                {selectedAuto ? (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-5">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-100">{selectedAuto.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {selectedAuto.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Disparador: <code className="text-purple-400 font-mono">{selectedAuto.trigger_type}</code>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleTestTrigger}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                        >
                          <Play className="w-3 h-3" />
                          <span>Probar Disparador</span>
                        </button>
                        <button
                          onClick={() => setShowNewStepModal(true)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Añadir Paso</span>
                        </button>
                      </div>
                    </div>

                    {/* Pipeline Sequence */}
                    <div className="space-y-3">
                      {/* Step 0: Trigger Box */}
                      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Evento Disparador</span>
                          <h6 className="text-xs font-bold text-slate-200">{selectedAuto.trigger_type}</h6>
                        </div>
                      </div>

                      {/* Sequenced Steps */}
                      {selectedAuto.steps && selectedAuto.steps.length > 0 ? (
                        selectedAuto.steps.map((step, idx) => (
                          <div key={step.id} className="relative pl-6 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-800">
                            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-400">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-slate-200">
                                      {step.step_type === 'send_email' && '✉️ Enviar Correo Automatizado'}
                                      {step.step_type === 'add_to_list' && '📋 Añadir a Lista de Contactos'}
                                      {step.step_type === 'wait_delay' && '⏳ Retardo / Pausa'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {step.step_type === 'send_email' && `Asunto: "${step.step_config?.subject || 'Sin asunto'}"`}
                                    {step.step_type === 'add_to_list' && `Lista ID: ${step.step_config?.listId || 'N/A'}`}
                                    {step.step_type === 'wait_delay' && `Esperar ${step.step_config?.delayMinutes || 0} minutos`}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteStep(step.id)}
                                title="Eliminar paso"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                          <p className="text-xs text-slate-400">No hay pasos en esta secuencia.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Haz clic en &ldquo;Añadir Paso&rdquo; para encadenar envíos o asignaciones.</p>
                        </div>
                      )}
                    </div>

                    {/* Execution Logs */}
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span>Historial de Ejecuciones ({autoLogs.length})</span>
                      </h5>

                      {autoLogs.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic">No hay ejecuciones registradas todavía.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                          {autoLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${log.status === 'executed' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="font-mono text-slate-300">{log.trigger_type}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400">{log.status}</span>
                              </div>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {new Date(log.executed_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 border border-slate-800 rounded-2xl bg-slate-950/20 text-center">
                    <Zap className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="text-sm font-semibold text-slate-300">Selecciona una automatización</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Visualiza su secuencia de pasos, agrega acciones de correo, revisa los registros o realiza un envío simulado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Webhooks Salientes (Outgoing Webhooks)</h4>
                  <p className="text-xs text-slate-400">
                    Envía notificaciones HTTP en tiempo real firmadas criptográficamente con HMAC-SHA256 (`x-prettiermails-signature`).
                  </p>
                </div>
                <button
                  onClick={() => setShowNewWebhookModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Webhook</span>
                </button>
              </div>

              {webhooks.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                  <Webhook className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-semibold">No hay webhooks registrados</p>
                  <p className="text-[11px] text-slate-500 mt-1">Conecta PrettierMails con Zapier, Slack, Discord o tu backend empresarial</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {webhooks.map((hook) => {
                    const isSecretVisible = showSecretMap[hook.id];
                    return (
                      <div
                        key={hook.id}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${hook.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[240px]">
                                {hook.url}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDispatchTestPing(hook)}
                                title="Enviar ping de prueba"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleViewDeliveries(hook)}
                                title="Ver historial de entregas"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition"
                              >
                                <Activity className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWebhook(hook.id)}
                                title="Eliminar webhook"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Events */}
                          <div className="flex flex-wrap gap-1.5">
                            {(hook.events || []).map((ev) => (
                              <span
                                key={ev}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>

                          {/* Secret */}
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-[11px] font-mono text-slate-400">
                                {isSecretVisible ? hook.secret : '••••••••••••••••••••••••'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() =>
                                  setShowSecretMap((prev) => ({ ...prev, [hook.id]: !prev[hook.id] }))
                                }
                                className="p-1 text-slate-400 hover:text-slate-200"
                                title="Mostrar/ocultar secreto"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(hook.secret);
                                  showNotification('Clave secreta copiada.');
                                }}
                                className="p-1 text-slate-400 hover:text-slate-200"
                                title="Copiar secreto"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>HMAC-SHA256 verificado</span>
                          </span>
                          <span>{new Date(hook.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Webhook Deliveries Drawer */}
              {selectedWebhook && (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Historial de Entregas Recientes: {selectedWebhook.url}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedWebhook(null)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cerrar
                    </button>
                  </div>

                  {deliveries.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay registros de entrega para este webhook aún.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {deliveries.map((del) => (
                        <div
                          key={del.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  del.response_status >= 200 && del.response_status < 300
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {del.response_status || 'ERROR'}
                              </span>
                              <span className="font-mono text-purple-400 font-semibold">{del.event_name}</span>
                            </div>
                            {del.error_message && (
                              <p className="text-[11px] text-rose-400">{del.error_message}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(del.delivered_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: Nueva Automatización */}
        {showNewAutoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100">Crear Automatización</h4>
                <button onClick={() => setShowNewAutoModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAutomation} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del flujo</label>
                  <input
                    type="text"
                    required
                    value={newAutoForm.name}
                    onChange={(e) => setNewAutoForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Bienvenida a nuevos suscriptores"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Evento disparador</label>
                  <select
                    value={newAutoForm.triggerType}
                    onChange={(e) => setNewAutoForm((p) => ({ ...p, triggerType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="contact.subscribed">contact.subscribed (Nuevo contacto registrado)</option>
                    <option value="contact.unsubscribed">contact.unsubscribed (Contacto dado de baja)</option>
                    <option value="email.opened">email.opened (Apertura de correo)</option>
                    <option value="email.clicked">email.clicked (Clic en enlace de correo)</option>
                    <option value="custom.event">custom.event (Evento personalizado)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAutoModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                  >
                    Crear Flujo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Nuevo Paso */}
        {showNewStepModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100">Añadir Acción a la Secuencia</h4>
                <button onClick={() => setShowNewStepModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddStep} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de acción</label>
                  <select
                    value={newStepForm.stepType}
                    onChange={(e) => setNewStepForm((p) => ({ ...p, stepType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="send_email">Enviar Correo Electrónico</option>
                    <option value="add_to_list">Añadir a Lista de Contactos</option>
                    <option value="wait_delay">Pausa / Espera programada</option>
                  </select>
                </div>

                {newStepForm.stepType === 'send_email' && (
                  <>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Asunto del correo</label>
                      <input
                        type="text"
                        required
                        value={newStepForm.subject}
                        onChange={(e) => setNewStepForm((p) => ({ ...p, subject: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Plantilla opcional</label>
                      <select
                        value={newStepForm.templateId}
                        onChange={(e) => setNewStepForm((p) => ({ ...p, templateId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">-- Contenido predeterminado --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {newStepForm.stepType === 'add_to_list' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Lista destino</label>
                    <select
                      required
                      value={newStepForm.listId}
                      onChange={(e) => setNewStepForm((p) => ({ ...p, listId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">-- Seleccionar lista --</option>
                      {contactLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newStepForm.stepType === 'wait_delay' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Minutos de retardo</label>
                    <input
                      type="number"
                      min="1"
                      value={newStepForm.delayMinutes}
                      onChange={(e) => setNewStepForm((p) => ({ ...p, delayMinutes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewStepModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                  >
                    Guardar Acción
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Nuevo Webhook */}
        {showNewWebhookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100">Registrar Webhook Saliente</h4>
                <button onClick={() => setShowNewWebhookModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL del Endpoint Receptor</label>
                  <input
                    type="url"
                    required
                    value={newWebhookForm.url}
                    onChange={(e) => setNewWebhookForm((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://tu-dominio.com/api/webhook"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clave Secreta HMAC (Opcional, se autogenera si está vacía)
                  </label>
                  <input
                    type="text"
                    value={newWebhookForm.secret}
                    onChange={(e) => setNewWebhookForm((p) => ({ ...p, secret: e.target.value }))}
                    placeholder="whsec_..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Eventos suscritos</label>
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {['*', 'contact.subscribed', 'campaign.sent', 'email.opened', 'email.clicked'].map((ev) => (
                      <label key={ev} className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWebhookForm.events.includes(ev)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookForm((p) => ({ ...p, events: [...p.events, ev] }));
                            } else {
                              setNewWebhookForm((p) => ({ ...p, events: p.events.filter((x) => x !== ev) }));
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-mono">{ev === '*' ? '* (Todos los eventos)' : ev}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewWebhookModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                  >
                    Guardar Webhook
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
