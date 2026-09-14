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
import AiGeneratorModal from './components/Modals/AiGeneratorModal.jsx';
import { TEMPLATES } from './utils/defaultTemplates.js';
import { compileEmailToHtml, compileFullEmailHtml } from './utils/emailCompiler.js';
import { saveCustomTemplate } from './utils/templateStorage.js';
import { 
  PlusCircle, 
  Sliders, 
  Palette, 
  Layers, 
  CheckCircle2, 
  Mail, 
  LayoutTemplate, 
  Sparkles, 
  Settings, 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Send,
  Eye,
  LogOut
} from 'lucide-react';

export default function App() {
  // Navigation View State: 'dashboard' | 'editor'
  const [currentView, setCurrentView] = useState('dashboard');

  // Initial empty canvas state
  const defaultGlobalSettings = {
    backgroundColor: '#0f172a',
    contentBackgroundColor: '#ffffff',
    contentWidth: '600px',
    borderRadius: '16px',
    textColor: '#1e293b',
    padding: '32px',
  };

  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(defaultGlobalSettings);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [sidebarTab, setSidebarTab] = useState('blocks'); // 'blocks' | 'style' | 'settings'

  // Right Inspector Accordion State (matches hero mockup)
  const [isStyleSettingsOpen, setIsStyleSettingsOpen] = useState(true);
  const [isGlobalStylesOpen, setIsGlobalStylesOpen] = useState(true);

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHtmlExportOpen, setIsHtmlExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Selected block object
  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Selected block index for ordering checks
  const selectedBlockIndex = useMemo(() => {
    return blocks.findIndex((b) => b.id === selectedBlockId);
  }, [blocks, selectedBlockId]);

  // Dynamic compiled HTML (table only)
  const compiledHtml = useMemo(() => {
    return compileEmailToHtml(blocks, globalSettings);
  }, [blocks, globalSettings]);

  // Dynamic standalone full HTML email with embedded template metadata
  const fullCompiledHtml = useMemo(() => {
    return compileFullEmailHtml({
      blocks,
      globalSettings,
      subject,
      includeMetadata: true,
    });
  }, [blocks, globalSettings, subject]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Handlers
  const handleSelectBlock = (id) => {
    setSelectedBlockId(id);
    if (id) {
      setSidebarTab('style');
    }
  };

  const handleAddBlock = (type, defaultData) => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      data: { ...defaultData },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSidebarTab('style');
  };

  const handleUpdateBlockData = (blockId, partialData) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            data: {
              ...b.data,
              ...partialData,
            },
          };
        }
        return b;
      })
    );
  };

  const handleDeleteBlock = (blockId) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setSidebarTab('blocks');
    }
  };

  const handleDuplicateBlock = (blockId) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const original = blocks[index];
    const duplicated = {
      ...original,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      data: JSON.parse(JSON.stringify(original.data)),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicated);
    setBlocks(newBlocks);
    setSelectedBlockId(duplicated.id);
  };

  const handleMoveUp = (blockId) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index <= 0) return;
    const newBlocks = [...blocks];
    const item = newBlocks.splice(index, 1)[0];
    newBlocks.splice(index - 1, 0, item);
    setBlocks(newBlocks);
  };

  const handleMoveDown = (blockId) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1 || index >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    const item = newBlocks.splice(index, 1)[0];
    newBlocks.splice(index + 1, 0, item);
    setBlocks(newBlocks);
  };

  const handleClearCanvas = () => {
    if (window.confirm('¿Seguro que deseas vaciar el lienzo y comenzar desde cero?')) {
      setBlocks([]);
      setSelectedBlockId(null);
      setSidebarTab('blocks');
    }
  };

  const handleSelectTemplate = (template) => {
    if (template.blocks && Array.isArray(template.blocks)) {
      setBlocks(JSON.parse(JSON.stringify(template.blocks)));
    }
    if (template.globalSettings) {
      setGlobalSettings(JSON.parse(JSON.stringify(template.globalSettings)));
    }
    if (template.subject) {
      setSubject(template.subject);
    }
    setSelectedBlockId(null);
    setSidebarTab('blocks');
    showNotification(`Plantilla cargada: "${template.name || template.subject || 'Diseño'}"`);
  };

  const handleApplyGeneratedEmail = ({ subject: newSubject, globalSettings: newSettings, blocks: newBlocks }) => {
    if (newSubject) setSubject(newSubject);
    if (newSettings) setGlobalSettings(newSettings);
    if (newBlocks && newBlocks.length > 0) setBlocks(newBlocks);
    setSelectedBlockId(null);
    setCurrentView('editor');
    showNotification('✨ ¡Correo generado con IA cargado en el editor!');

    try {
      saveCustomTemplate({
        name: newSubject || 'Borrador Generado con IA',
        subject: newSubject || '',
        globalSettings: newSettings || globalSettings,
        blocks: newBlocks || [],
        description: 'Generado automáticamente por el Asistente de IA',
      });
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  };

  const handleNewEmailFromDashboard = () => {
    setBlocks([]);
    setSubject('');
    setSelectedBlockId(null);
    setCurrentView('editor');
  };

  const handleOpenTemplateFromDashboard = (template) => {
    if (template.blocks && Array.isArray(template.blocks)) {
      setBlocks(JSON.parse(JSON.stringify(template.blocks)));
    }
    if (template.globalSettings) {
      setGlobalSettings(JSON.parse(JSON.stringify(template.globalSettings)));
    }
    if (template.subject) {
      setSubject(template.subject);
    }
    setSelectedBlockId(null);
    setCurrentView('editor');
    showNotification(`Cargado en Studio: "${template.name || template.subject || 'Diseño'}"`);
  };

  const handlePreviewTemplateFromDashboard = (template) => {
    if (template.blocks) setBlocks(template.blocks);
    if (template.globalSettings) setGlobalSettings(template.globalSettings);
    if (template.subject) setSubject(template.subject);
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
          />

          {/* Main Studio Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Ultra-Slim Left Icon Rail (Matches Hero Mockup) */}
            <div className="w-14 bg-[#0a0e17] border-r border-[#1a2233] flex flex-col justify-between py-3 items-center select-none flex-shrink-0 z-20">
              <div className="space-y-3 flex flex-col items-center">
                <button
                  onClick={() => setSidebarTab('blocks')}
                  title="Editor de Bloques"
                  className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow transition hover:scale-105"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsTemplatesOpen(true)}
                  title="Plantillas Predefinidas"
                  className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex items-center justify-center"
                >
                  <LayoutTemplate className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  title="Crear con IA"
                  className="w-10 h-10 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition flex items-center justify-center border border-purple-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              <button
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

            {/* Central Visual Canvas */}
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
                onAddBlock={handleAddBlock}
                globalSettings={globalSettings}
                previewMode={previewMode}
                onOpenTemplates={() => setIsTemplatesOpen(true)}
                onOpenAi={() => setIsAiModalOpen(true)}
              />
            </main>

            {/* Right Collapsible Inspector (Style Settings & Global Styles) */}
            <aside className="w-80 md:w-88 flex-shrink-0 bg-[#0e1320] border-l border-[#1a2233] flex flex-col z-20 shadow-xl overflow-y-auto">
              {/* Accordion 1: Style Settings */}
              <div className="border-b border-[#1a2233]">
                <button
                  onClick={() => setIsStyleSettingsOpen(!isStyleSettingsOpen)}
                  className="w-full px-4 py-3 bg-[#111726]/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    <span>Style Settings {selectedBlock ? `(${selectedBlock.type})` : ''}</span>
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
                  onClick={() => setIsGlobalStylesOpen(!isGlobalStylesOpen)}
                  className="w-full px-4 py-3 bg-[#111726]/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Global Styles</span>
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
        onSaved={(newTmpl) => {
          showNotification(`¡Plantilla "${newTmpl.name}" guardada con éxito!`);
        }}
      />

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedEmail={handleApplyGeneratedEmail}
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
