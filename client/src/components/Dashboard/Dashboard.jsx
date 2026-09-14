import React, { useState, useMemo } from 'react';
import {
  Mail,
  Plus,
  Sparkles,
  LayoutDashboard,
  FileText,
  Send,
  Bell,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Video,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  Shield,
  User,
  Settings,
  Flame,
  LayoutTemplate
} from 'lucide-react';
import { TEMPLATES } from '../../utils/defaultTemplates.js';
import { getSavedTemplates, deleteCustomTemplate } from '../../utils/templateStorage.js';

export default function Dashboard({
  onNewEmail,
  onOpenTemplate,
  onOpenAiModal,
  onPreviewTemplate,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'drafts' | 'templates' | 'sent'
  const [searchQuery, setSearchQuery] = useState('');
  const [savedDrafts, setSavedDrafts] = useState(() => getSavedTemplates());

  // Merge built-in templates with user saved drafts
  const allItems = useMemo(() => {
    const builtIns = TEMPLATES.map((tmpl) => ({
      id: tmpl.id,
      name: tmpl.name,
      subject: tmpl.subject || tmpl.name,
      type: 'template',
      description: tmpl.description,
      updatedAt: 'Predefinida',
      blocks: tmpl.blocks,
      globalSettings: tmpl.globalSettings,
      badge: tmpl.id === 'youtube-showcase' ? '⭐ Más Popular' : 'Plantilla Oficial',
      badgeColor: tmpl.id === 'youtube-showcase' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: tmpl.id === 'youtube-showcase' ? Video : LayoutTemplate,
    }));

    const userDrafts = savedDrafts.map((draft) => ({
      id: draft.id,
      name: draft.name,
      subject: draft.subject || 'Borrador sin título',
      type: 'draft',
      description: draft.description || 'Borrador guardado localmente',
      updatedAt: draft.createdAt ? new Date(draft.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente',
      blocks: draft.blocks,
      globalSettings: draft.globalSettings,
      badge: 'Borrador',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: FileText,
    }));

    return [...userDrafts, ...builtIns];
  }, [savedDrafts]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab === 'drafts' && item.type !== 'draft') return false;
      if (activeTab === 'templates' && item.type !== 'template') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allItems, activeTab, searchQuery]);

  const handleDeleteDraft = (e, draftId) => {
    e.stopPropagation();
    if (window.confirm('¿Deseas eliminar este borrador permanentemente?')) {
      const updated = deleteCustomTemplate(draftId);
      setSavedDrafts(updated);
    }
  };

  const handleDuplicateDraft = (e, item) => {
    e.stopPropagation();
    const duplicated = {
      ...item,
      id: `copy-${Date.now()}`,
      name: `${item.name} (Copia)`,
      subject: `${item.subject} (Copia)`,
      type: 'draft',
    };
    onOpenTemplate(duplicated);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0d14] text-slate-100 overflow-hidden font-sans">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="w-64 bg-[#0e131f] border-r border-[#1a2233] flex flex-col justify-between select-none">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center space-x-3 border-b border-[#1a2233]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/10">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">PrettierMails</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Email Studio & Dispatcher</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-brand-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('drafts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'drafts'
                  ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Borradores</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                {savedDrafts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'templates'
                  ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <LayoutTemplate className="w-4 h-4 text-purple-400" />
                <span>Plantillas Oficiales</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                {TEMPLATES.length}
              </span>
            </button>

            <button
              onClick={() => onOpenAiModal()}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-950/30 transition border border-purple-500/20"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Generar con IA</span>
            </button>
          </nav>
        </div>

        {/* User profile bottom rail */}
        <div className="p-3 border-t border-[#1a2233]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-brand-500/30">
                JD
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">John Doe</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Plan Pro Activo</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]">
        {/* Top Navbar */}
        <header className="h-16 px-8 border-b border-[#1a2233] bg-[#0c101a]/80 backdrop-blur flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-brand-400" />
              <span>Dashboard de Correos</span>
            </h1>
            <span className="text-slate-600">•</span>
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por asunto o plantilla..."
                className="w-full bg-[#111726] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAiModal()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 border border-purple-400/30 transition flex items-center space-x-1.5 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar con IA</span>
            </button>

            <button
              onClick={() => onNewEmail()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 border border-brand-400/30 transition flex items-center space-x-1.5 hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Correo</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Quick Access Hero Showcase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Acceso Rápido</h2>
                <p className="text-xs text-slate-400">Comienza un diseño desde cero o carga nuestras plantillas destacadas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Blank Canvas */}
              <div
                onClick={() => onNewEmail()}
                className="group p-5 rounded-2xl bg-gradient-to-br from-[#121829] to-[#0e1322] border border-slate-800/80 hover:border-brand-500/50 transition cursor-pointer shadow-lg hover:shadow-brand-500/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition"></div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition">Lienzo en Blanco</h3>
                    <p className="text-xs text-slate-400 mt-1">Inicia un diseño limpio y añade bloques a tu medida.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center text-xs font-semibold text-brand-400 group-hover:translate-x-1 transition">
                  <span>Crear en blanco &rarr;</span>
                </div>
              </div>

              {/* Card 2: YouTube Video Showcase */}
              <div
                onClick={() => {
                  const tmpl = TEMPLATES.find((t) => t.id === 'youtube-showcase');
                  if (tmpl) onOpenTemplate(tmpl);
                }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-[#181528] to-[#110e20] border border-red-500/20 hover:border-red-500/50 transition cursor-pointer shadow-lg hover:shadow-red-500/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition"></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition">
                      <Video className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      ★ Estrella
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-red-300 transition">Lanzamiento con Video</h3>
                    <p className="text-xs text-slate-400 mt-1">Modo oscuro con reproductor HD de YouTube, puntos clave y CTA.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-red-500/20 flex items-center text-xs font-semibold text-red-400 group-hover:translate-x-1 transition">
                  <span>Cargar plantilla &rarr;</span>
                </div>
              </div>

              {/* Card 3: AI Assistant */}
              <div
                onClick={() => onOpenAiModal()}
                className="group p-5 rounded-2xl bg-gradient-to-br from-[#1c142e] to-[#120d22] border border-purple-500/20 hover:border-purple-500/50 transition cursor-pointer shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition"></div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">Asistente con IA</h3>
                    <p className="text-xs text-slate-400 mt-1">Genera correos autónomos con Gemini o OpenAI adjuntando links.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition">
                  <span>Abrir generador &rarr;</span>
                </div>
              </div>

              {/* Card 4: Corporate Onboarding */}
              <div
                onClick={() => {
                  const tmpl = TEMPLATES.find((t) => t.id === 'corporate-onboarding');
                  if (tmpl) onOpenTemplate(tmpl);
                }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-[#101b2a] to-[#0c1421] border border-blue-500/20 hover:border-blue-500/50 transition cursor-pointer shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition"></div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">Bienvenida Corporativa</h3>
                    <p className="text-xs text-slate-400 mt-1">Cabecera en Grid con logo a la izquierda y tabla de accesos.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-500/20 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition">
                  <span>Cargar plantilla &rarr;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Campaigns & Drafts Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">Mis Correos y Plantillas</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {filteredItems.length}
                </span>
              </div>

              {/* Tabs filter */}
              <div className="flex items-center bg-[#111726] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'drafts' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Borradores ({savedDrafts.length})
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'templates' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Plantillas ({TEMPLATES.length})
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-[#0e1320] border border-[#1a2233] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#111726]/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Asunto / Nombre del Correo</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Modificado</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-400">No se encontraron correos</p>
                        <p className="text-[11px] text-slate-500 mt-1">Prueba con otro término de búsqueda o crea un correo nuevo.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const IconComponent = item.icon || FileText;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => onOpenTemplate(item)}
                          className="hover:bg-slate-800/40 transition cursor-pointer group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:border-brand-500/40 group-hover:text-brand-400 transition">
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-200 group-hover:text-white transition">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate max-w-md">
                                  {item.subject}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px]">
                            {item.updatedAt}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onOpenTemplate(item)}
                                title="Editar en Studio"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onPreviewTemplate(item)}
                                title="Vista Previa"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDuplicateDraft(e, item)}
                                title="Duplicar"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {item.type === 'draft' && (
                                <button
                                  onClick={(e) => handleDeleteDraft(e, item.id)}
                                  title="Eliminar borrador"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
