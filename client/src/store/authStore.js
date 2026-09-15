import { create } from 'zustand';
import authApi from '../services/authApi.js';

const TOKEN_KEY = 'prettier_mails_token';
const WORKSPACE_KEY = 'prettier_mails_active_workspace';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  workspaces: [],
  currentWorkspace: (() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_KEY);
      return saved ? JSON.parse(saved) : { id: 'ws-default', name: 'Workspace Principal', role: 'owner' };
    } catch {
      return { id: 'ws-default', name: 'Workspace Principal', role: 'owner' };
    }
  })(),
  isAuthenticated: false,
  isLoading: true,
  authError: null,

  initialize: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({
        user: { id: 'usr-admin', name: 'Usuario Local', email: 'admin@prettiermails.local' },
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      set({ isLoading: true, authError: null });
      const data = await authApi.getMe();
      if (data && data.user) {
        let activeWs = get().currentWorkspace;
        if (data.workspaces && data.workspaces.length > 0) {
          const found = data.workspaces.find((w) => w.id === activeWs?.id);
          activeWs = found || data.workspaces[0];
          localStorage.setItem(WORKSPACE_KEY, JSON.stringify(activeWs));
        }

        set({
          user: data.user,
          workspaces: data.workspaces || [],
          currentWorkspace: activeWs,
          isAuthenticated: !data.isGuest,
          isLoading: false,
        });
      }
    } catch (err) {
      console.warn('Could not restore remote session, defaulting to guest:', err.message);
      localStorage.removeItem(TOKEN_KEY);
      set({
        user: { id: 'usr-admin', name: 'Usuario Local', email: 'admin@prettiermails.local' },
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, authError: null });
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.currentWorkspace) {
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(data.currentWorkspace));
      }

      set({
        token: data.token,
        user: data.user,
        workspaces: data.workspaces || [],
        currentWorkspace: data.currentWorkspace || { id: 'ws-default', name: 'Workspace Principal', role: 'owner' },
        isAuthenticated: true,
        isLoading: false,
        authError: null,
      });
      return { success: true };
    } catch (err) {
      set({ isLoading: false, authError: err.message });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, authError: null });
    try {
      const data = await authApi.register(userData);
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.currentWorkspace) {
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(data.currentWorkspace));
      }

      set({
        token: data.token,
        user: data.user,
        workspaces: data.workspaces || [],
        currentWorkspace: data.currentWorkspace,
        isAuthenticated: true,
        isLoading: false,
        authError: null,
      });
      return { success: true };
    } catch (err) {
      set({ isLoading: false, authError: err.message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      token: null,
      user: { id: 'usr-admin', name: 'Usuario Local', email: 'admin@prettiermails.local' },
      isAuthenticated: false,
      workspaces: [],
      currentWorkspace: { id: 'ws-default', name: 'Workspace Principal', role: 'owner' },
      authError: null,
    });
  },

  switchWorkspace: (workspace) => {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    set({ currentWorkspace: workspace });
  },

  refreshWorkspaces: async () => {
    try {
      const workspaces = await authApi.listWorkspaces();
      set({ workspaces });
      const current = get().currentWorkspace;
      const updatedCurrent = workspaces.find((w) => w.id === current?.id);
      if (updatedCurrent) {
        set({ currentWorkspace: updatedCurrent });
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(updatedCurrent));
      }
    } catch (err) {
      console.warn('Error refreshing workspaces:', err);
    }
  },
}));

export default useAuthStore;
