import React, { useState, useMemo } from 'react';
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
import { PlusCircle, Sliders, Palette, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
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
    setSidebarTab('blocks');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        subject={subject}
        setSubject={setSubject}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenSaveTemplate={() => setIsSaveTemplateOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenHtmlExport={() => setIsHtmlExportOpen(true)}
        onOpenSendModal={() => setIsSendModalOpen(true)}
        onClearCanvas={handleClearCanvas}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className="w-80 md:w-88 lg:w-96 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
          {/* Sidebar Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 select-none">
            <button
              onClick={() => setSidebarTab('blocks')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                sidebarTab === 'blocks'
                  ? 'bg-slate-800 text-brand-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Bloques</span>
            </button>

            <button
              onClick={() => setSidebarTab('style')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                sidebarTab === 'style'
                  ? 'bg-slate-800 text-brand-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                Estilo {selectedBlock ? `(${selectedBlock.type})` : ''}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('settings')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                sidebarTab === 'settings'
                  ? 'bg-slate-800 text-brand-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </button>
          </div>

          {/* Sidebar Panels */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'blocks' && (
              <BlockPicker onAddBlock={handleAddBlock} />
            )}

            {sidebarTab === 'style' && (
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
            )}

            {sidebarTab === 'settings' && (
              <GlobalSettings
                globalSettings={globalSettings}
                setGlobalSettings={setGlobalSettings}
              />
            )}
          </div>
        </aside>

        {/* Central Visual Canvas */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
      </div>

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
