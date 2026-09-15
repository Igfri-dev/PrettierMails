import React, { useState, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Navbar from './components/Navbar.jsx';
import Canvas from './components/Canvas/Canvas.jsx';
import BlockPicker from './components/Sidebar/BlockPicker.jsx';
import StyleInspector from './components/Sidebar/StyleInspector.jsx';
import GlobalSettings from './components/Sidebar/GlobalSettings.jsx';
import SendEmailModal from './components/Modals/SendEmailModal.jsx';
import PreviewModal from './components/Modals/PreviewModal.jsx';
import HtmlExportModal from './components/Modals/HtmlExportModal.jsx';
import TemplatesModal from './components/Modals/TemplatesModal.jsx';
import SaveTemplateModal from './components/Modals/SaveTemplateModal.jsx';
import VersionHistoryModal from './components/Modals/VersionHistoryModal.jsx';
import AiGeneratorModal from './components/Modals/AiGeneratorModal.jsx';
import AuthModal from './components/Modals/AuthModal.jsx';
import WorkspaceModal from './components/Modals/WorkspaceModal.jsx';
import SmtpAccountsModal from './components/Modals/SmtpAccountsModal.jsx';
import ContactsModal from './components/Modals/ContactsModal.jsx';
import CampaignsModal from './components/Modals/CampaignsModal.jsx';
import AutomationsModal from './components/Modals/AutomationsModal.jsx';
import { compileFullEmailHtml } from './utils/emailCompiler.js';
import { saveCustomTemplate } from './utils/templateStorage.js';
import { autosaveTemplate } from './services/templateApi.js';
import {
  acquireTemplateLock,
  renewTemplateLock,
  releaseTemplateLock,
  getTemplateLock,
} from './services/lockApi.js';
import useDocumentStore from './store/documentStore.js';
import useAuthStore from './store/authStore.js';
import { 
  Sliders, 
  Palette, 
  CheckCircle2, 
  Mail, 
  LayoutTemplate, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

export default function App() {
  const {
    currentTemplateId,
    currentTemplateName,
    currentVersionNumber,
    saveStatus,
    lastSavedAt,
    isDirty,
    setTemplateContext,
    setSaveStatus,
    setLastSavedAt,
    setIsDirty,
    subject,
    setSubject,
    previewText,
    globalSettings,
    setGlobalSettings,
    updateGlobalSetting,
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    previewMode,
    setPreviewMode,
    sidebarTab,
    setSidebarTab,
    currentView,
    setCurrentView,
    undo,
    redo,
    canUndo,
    canRedo,
    addBlock,
    updateBlockData,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    reorderBlocks,
    copyBlock,
    pasteBlock,
    loadTemplate,
    clearCanvas,
  } = useDocumentStore();

  // Right Inspector Accordion State
  const [isStyleSettingsOpen, setIsStyleSettingsOpen] = useState(true);
  const [isGlobalStylesOpen, setIsGlobalStylesOpen] = useState(true);

  // Auth state
  const initializeAuth = useAuthStore((state) => state.initialize);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHtmlExportOpen, setIsHtmlExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState(false);
  const [isAutomationsModalOpen, setIsAutomationsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [concurrentEditorName, setConcurrentEditorName] = useState(null);

  // Selected block object
  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Selected block index for ordering checks
  const selectedBlockIndex = useMemo(() => {
    return blocks.findIndex((b) => b.id === selectedBlockId);
  }, [blocks, selectedBlockId]);

  // Dynamic standalone full HTML email with embedded template metadata
  const fullCompiledHtml = useMemo(() => {
    return compileFullEmailHtml({
      blocks,
      globalSettings,
      subject,
      previewText,
      includeMetadata: true,
    });
  }, [blocks, globalSettings, subject, previewText]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Debounced Autosave (1.5 seconds after changes)
  useEffect(() => {
    if (!isDirty || blocks.length === 0) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await autosaveTemplate({
          id: currentTemplateId,
          name: currentTemplateName || subject || 'Borrador sin título',
          subject,
          previewText,
          globalSettings,
          blocks,
        });

        if (res && res.id) {
          setTemplateContext({
            id: res.id,
            name: res.name,
            versionNumber: res.version_number,
          });
        }
        setIsDirty(false);
        setSaveStatus('saved');
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('Autosave status (offline mode):', err.message);
        setSaveStatus('saved');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [blocks, globalSettings, subject, previewText, isDirty, currentTemplateId, currentTemplateName, setSaveStatus, setTemplateContext, setIsDirty, setLastSavedAt]);

  // Collaborative Lock & Active Presence Effect
  useEffect(() => {
    if (!currentTemplateId) {
      setConcurrentEditorName(null);
      return;
    }

    let isMounted = true;

    const acquire = async () => {
      try {
        const res = await acquireTemplateLock(currentTemplateId);
        if (!isMounted) return;
        if (!res.acquired) {
          setConcurrentEditorName(res.lock?.user_name || 'Otro miembro del equipo');
        } else {
          setConcurrentEditorName(null);
        }
      } catch (err) {
        console.warn('Lock check (offline/guest mode):', err.message);
      }
    };

    acquire();

    // Heartbeat every 25s
    const interval = setInterval(async () => {
      try {
        const res = await renewTemplateLock(currentTemplateId);
        if (!isMounted) return;
        if (!res.renewed) {
          const check = await getTemplateLock(currentTemplateId);
          if (check?.locked) {
            setConcurrentEditorName(check.lock?.user_name || 'Otro miembro del equipo');
          }
        }
      } catch {
        // ignore
      }
    }, 25000);

    const handleBeforeUnload = () => {
      releaseTemplateLock(currentTemplateId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      releaseTemplateLock(currentTemplateId);
    };
  }, [currentTemplateId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      const isEditingText = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
          showNotification('↷ Acción rehecha');
        } else {
          e.preventDefault();
          undo();
          showNotification('↶ Acción deshecha');
        }
        return;
      }

      if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        showNotification('↷ Acción rehecha');
        return;
      }

      if (!isEditingText) {
        if (isCtrlOrCmd && e.key.toLowerCase() === 'c' && selectedBlockId) {
          e.preventDefault();
          copyBlock(selectedBlockId);
          showNotification('📋 Bloque copiado');
          return;
        }

        if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
          e.preventDefault();
          const pasted = pasteBlock();
          if (pasted) {
            showNotification('📋 Bloque pegado');
          }
          return;
        }

        if (isCtrlOrCmd && e.key.toLowerCase() === 'd' && selectedBlockId) {
          e.preventDefault();
          duplicateBlock(selectedBlockId);
          showNotification('📄 Bloque duplicado');
          return;
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
          e.preventDefault();
          deleteBlock(selectedBlockId);
          showNotification('🗑️ Bloque eliminado');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copyBlock, pasteBlock, duplicateBlock, deleteBlock, selectedBlockId]);

  // Handlers
  const handleSelectBlock = (id) => {
    setSelectedBlockId(id);
  };

  const handleAddBlock = (type, customData, targetIndex) => {
    addBlock(type, customData, targetIndex);
  };

  const handleUpdateBlockData = (blockId, partialData) => {
    updateBlockData(blockId, partialData);
  };

  const handleDeleteBlock = (blockId) => {
    deleteBlock(blockId);
  };

  const handleDuplicateBlock = (blockId) => {
    duplicateBlock(blockId);
  };

  const handleMoveUp = (blockId) => {
    moveBlock(blockId, -1);
  };

  const handleMoveDown = (blockId) => {
    moveBlock(blockId, 1);
  };

  const handleClearCanvas = () => {
    if (window.confirm('¿Seguro que deseas vaciar el lienzo y comenzar desde cero?')) {
      clearCanvas();
      showNotification('Lienzo vaciado');
    }
  };

  const handleSelectTemplate = (template) => {
    loadTemplate(template);
    showNotification(`Plantilla cargada: "${template.name || template.subject || 'Diseño'}"`);
  };

  const handleApplyGeneratedEmail = ({
    subject: newSubject,
    globalSettings: newSettings,
    blocks: newBlocks,
    isFallback,
    generatedBy,
  }) => {
    loadTemplate({
      subject: newSubject || '',
      globalSettings: newSettings || globalSettings,
      blocks: newBlocks || [],
    });
    setCurrentView('editor');

    if (isFallback) {
      showNotification('🟡 Correo generado con Motor Local de Respaldo (Modo sin API Key)');
    } else {
      showNotification(`✨ ¡Correo generado en vivo con ${generatedBy || 'IA'}!`);
    }

    try {
      saveCustomTemplate({
        name: newSubject || 'Borrador Generado con IA',
        subject: newSubject || '',
        globalSettings: newSettings || globalSettings,
        blocks: newBlocks || [],
        description: isFallback
          ? 'Generado con Motor de Respaldo Local (PrettierMails)'
          : `Generado automáticamente por ${generatedBy || 'IA en vivo'}`,
      });
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  };

  const handleNewEmailFromDashboard = () => {
    clearCanvas();
    setSubject('');
    setCurrentView('editor');
  };

  const handleOpenTemplateFromDashboard = (template) => {
    loadTemplate(template);
    setCurrentView('editor');
    showNotification(`Cargado en Studio: "${template.name || template.subject || 'Diseño'}"`);
  };

  const handlePreviewTemplateFromDashboard = (template) => {
    loadTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] font-sans">
      {currentView === 'dashboard' ? (
        <Dashboard
          onNewEmail={handleNewEmailFromDashboard}
          onOpenTemplate={handleOpenTemplateFromDashboard}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onPreviewTemplate={handlePreviewTemplateFromDashboard}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
          onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
          onOpenContactsModal={() => setIsContactsModalOpen(true)}
          onOpenCampaignsModal={() => setIsCampaignsModalOpen(true)}
          onOpenAutomationsModal={() => setIsAutomationsModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Top Studio Navbar */}
          <Navbar
            subject={subject}
            setSubject={setSubject}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenSaveTemplate={() => setIsSaveTemplateOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onOpenHtmlExport={() => setIsHtmlExportOpen(true)}
            onOpenSendModal={() => setIsSendModalOpen(true)}
            onClearCanvas={handleClearCanvas}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo()}
            canRedo={canRedo()}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
            currentVersionNumber={currentVersionNumber}
            currentTemplateId={currentTemplateId}
            onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
            onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
            onOpenContactsModal={() => setIsContactsModalOpen(true)}
            onOpenCampaignsModal={() => setIsCampaignsModalOpen(true)}
            onOpenAutomationsModal={() => setIsAutomationsModalOpen(true)}
          />

          {/* Main Studio Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Ultra-Slim Left Icon Rail */}
            <div className="w-14 bg-[#0a0e17] border-r border-[#1a2233] flex flex-col justify-between py-3 items-center select-none flex-shrink-0 z-20">
              <div className="space-y-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setSidebarTab('blocks')}
                  title="Editor de Bloques"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow transition hover:scale-105 ${
                    sidebarTab === 'blocks'
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTemplatesOpen(true)}
                  title="Plantillas Predefinidas"
                  className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex items-center justify-center"
                >
                  <LayoutTemplate className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  title="Crear con IA"
                  className="w-10 h-10 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition flex items-center justify-center border border-purple-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                title="Salir al Dashboard"
                className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Modular Components Drawer (2-Column Grid) */}
            <aside className="w-72 md:w-80 flex-shrink-0 bg-[#0e1320] border-r border-[#1a2233] flex flex-col z-20 shadow-xl overflow-y-auto">
              <BlockPicker onAddBlock={handleAddBlock} />
            </aside>

            {/* Central Visual Canvas with Drag & Drop */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#070a10]">
              <Canvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
                onUpdateBlockData={handleUpdateBlockData}
                onDeleteBlock={handleDeleteBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onReorderBlocks={reorderBlocks}
                onAddBlock={handleAddBlock}
                globalSettings={globalSettings}
                previewMode={previewMode}
                concurrentEditorName={concurrentEditorName}
                onOpenTemplates={() => setIsTemplatesOpen(true)}
                onOpenAi={() => setIsAiModalOpen(true)}
              />
            </main>

            {/* Right Collapsible Inspector (Style Settings & Global Styles) */}
            <aside className="w-80 md:w-88 flex-shrink-0 bg-[#0e1320] border-l border-[#1a2233] flex flex-col z-20 shadow-xl overflow-y-auto">
              {/* Accordion 1: Style Settings */}
              <div className="border-b border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setIsStyleSettingsOpen(!isStyleSettingsOpen)}
                  className="w-full px-4 py-3 bg-[#111726]/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    <span>Configuración de Estilo {selectedBlock ? `(${selectedBlock.type})` : ''}</span>
                  </span>
                  {isStyleSettingsOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isStyleSettingsOpen && (
                  <div className="p-1">
                    <StyleInspector
                      block={selectedBlock}
                      onUpdateBlockData={handleUpdateBlockData}
                      onDeleteBlock={handleDeleteBlock}
                      onDuplicateBlock={handleDuplicateBlock}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      canMoveUp={selectedBlockIndex > 0}
                      canMoveDown={selectedBlockIndex !== -1 && selectedBlockIndex < blocks.length - 1}
                    />
                  </div>
                )}
              </div>

              {/* Accordion 2: Global Styles */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsGlobalStylesOpen(!isGlobalStylesOpen)}
                  className="w-full px-4 py-3 bg-[#111726]/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Estilos Globales</span>
                  </span>
                  {isGlobalStylesOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isGlobalStylesOpen && (
                  <div className="p-1">
                    <GlobalSettings
                      globalSettings={globalSettings}
                      setGlobalSettings={setGlobalSettings}
                      updateGlobalSetting={updateGlobalSetting}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Modals */}
      <SendEmailModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        subject={subject}
        htmlContent={fullCompiledHtml}
        globalSettings={globalSettings}
        onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={fullCompiledHtml}
        subject={subject}
      />

      <HtmlExportModal
        isOpen={isHtmlExportOpen}
        onClose={() => setIsHtmlExportOpen(false)}
        htmlContent={fullCompiledHtml}
        subject={subject}
        previewText={previewText}
        blocks={blocks}
        globalSettings={globalSettings}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onOpenSaveModal={() => setIsSaveTemplateOpen(true)}
      />

      <SaveTemplateModal
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        subject={subject}
        globalSettings={globalSettings}
        blocks={blocks}
        templateId={currentTemplateId}
        templateName={currentTemplateName}
        onSaved={(newTmpl) => {
          setTemplateContext({
            id: newTmpl.id,
            name: newTmpl.name,
            versionNumber: newTmpl.version_number,
          });
          showNotification(`¡Plantilla "${newTmpl.name}" guardada con éxito!`);
        }}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        templateId={currentTemplateId}
        templateName={currentTemplateName}
        onVersionRestored={(restored) => {
          loadTemplate(restored);
          showNotification(`Versión #${restored.version_number} restaurada`);
        }}
      />

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedEmail={handleApplyGeneratedEmail}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => showNotification('¡Sesión iniciada con éxito!')}
      />

      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      <SmtpAccountsModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
      />

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />

      <CampaignsModal
        isOpen={isCampaignsModalOpen}
        onClose={() => setIsCampaignsModalOpen(false)}
      />

      <AutomationsModal
        isOpen={isAutomationsModalOpen}
        onClose={() => setIsAutomationsModalOpen(false)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl shadow-emerald-500/10 backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="truncate max-w-sm">{notification}</span>
        </div>
      )}
    </div>
  );
}
