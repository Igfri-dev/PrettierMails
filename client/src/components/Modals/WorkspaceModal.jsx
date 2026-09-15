import { useState, useEffect } from 'react';
import { X, Building2, Plus, Check, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import authApi from '../../services/authApi.js';

export default function WorkspaceModal({ isOpen, onClose }) {
  const { workspaces, currentWorkspace, switchWorkspace, refreshWorkspaces, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'members'
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const canManageMembers = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin';

  // Load members when members tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'members' && currentWorkspace?.id) {
      authApi
        .getWorkspaceMembers(currentWorkspace.id)
        .then(setMembers)
        .catch((err) => console.warn('Error al cargar miembros:', err));
    }
  }, [isOpen, activeTab, currentWorkspace]);

  if (!isOpen) return null;

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setError(null);
    setIsLoading(true);
    try {
      const created = await authApi.createWorkspace({ name: newWorkspaceName.trim() });
      await refreshWorkspaces();
      switchWorkspace(created);
      setNewWorkspaceName('');
      setActiveTab('list');
      setSuccessMsg(`Espacio "${created.name}" creado con éxito`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al crear espacio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setError(null);
    setIsLoading(true);
    try {
      await authApi.addWorkspaceMember(currentWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      const updated = await authApi.getWorkspaceMembers(currentWorkspace.id);
      setMembers(updated);
      setSuccessMsg('Miembro agregado exitosamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al agregar miembro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('¿Seguro que deseas remover a este miembro del espacio?')) return;

    try {
      await authApi.removeWorkspaceMember(currentWorkspace.id, memberUserId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
    } catch (err) {
      alert(`Error al remover miembro: ${err.message}`);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      await authApi.updateMemberRole(currentWorkspace.id, memberUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert(`Error al actualizar rol: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0e1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-[#0c101a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Espacios de Trabajo</h3>
              <p className="text-[11px] text-slate-400">
                Activo: <span className="font-semibold text-brand-400">{currentWorkspace?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-[#090d16] text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 font-semibold transition border-b-2 ${
              activeTab === 'list'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mis Espacios ({workspaces.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 font-semibold transition border-b-2 ${
              activeTab === 'members'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Equipo y Miembros
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 font-semibold transition border-b-2 ${
              activeTab === 'create'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            + Crear Nuevo
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-400">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: WORKSPACE LIST */}
          {activeTab === 'list' && (
            <div className="space-y-2.5">
              {workspaces.map((ws) => {
                const isActive = ws.id === currentWorkspace?.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-brand-500/10 border-brand-500/50 shadow-md shadow-brand-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-100">{ws.name}</p>
                          {isActive && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                          Rol: {ws.role || 'editor'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {isActive ? 'Seleccionado' : 'Cambiar →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {canManageMembers && (
                <form onSubmit={handleInviteMember} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                    <UserPlus className="w-4 h-4 text-brand-400" />
                    <span>Invitar Miembro al Espacio</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="correo@colega.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-[#121829] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="bg-[#121829] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Lector</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Miembros Actuales ({members.length})
                </p>
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-[11px]">
                        {m.name ? m.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200 leading-none">{m.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {canManageMembers && m.userId !== user?.id ? (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-0.5"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Lector</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                            title="Remover miembro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {m.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE WORKSPACE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Nombre del Nuevo Espacio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Marketing 2026, Equipo Ventas"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-[#121829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Espacio de Trabajo</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
