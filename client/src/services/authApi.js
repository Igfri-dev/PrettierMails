const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('prettier_mails_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const currentWs = localStorage.getItem('prettier_mails_active_workspace');
  if (currentWs) {
    try {
      const parsed = JSON.parse(currentWs);
      if (parsed?.id) headers['x-workspace-id'] = parsed.id;
    } catch {
      // ignore
    }
  }
  return headers;
}

async function parseResponse(res, defaultMsg = 'Error en la solicitud') {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return { error: `${defaultMsg} (HTTP ${res.status})` };
}

export async function login(credentials) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const json = await parseResponse(res, 'Error al iniciar sesión');
  if (!res.ok) {
    throw new Error(json.error || 'Error al iniciar sesión');
  }
  return json.data;
}

export async function register(data) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await parseResponse(res, 'Error al registrar usuario');
  if (!res.ok) {
    throw new Error(json.error || 'Error al registrar usuario');
  }
  return json.data;
}

export async function getMe() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(res, 'Error al obtener sesión');
  if (!res.ok) {
    throw new Error(json.error || 'Error al obtener sesión');
  }
  return json.data;
}

export async function updateProfile(data) {
  const res = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const json = await parseResponse(res, 'Error al actualizar perfil');
  if (!res.ok) {
    throw new Error(json.error || 'Error al actualizar perfil');
  }
  return json.data;
}

export async function listWorkspaces() {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(res, 'Error al listar espacios de trabajo');
  if (!res.ok) {
    throw new Error(json.error || 'Error al listar espacios de trabajo');
  }
  return json.data || [];
}

export async function createWorkspace(data) {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const json = await parseResponse(res, 'Error al crear espacio');
  if (!res.ok) {
    throw new Error(json.error || 'Error al crear espacio');
  }
  return json.data;
}

export async function getWorkspaceMembers(workspaceId) {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(res, 'Error al obtener miembros');
  if (!res.ok) {
    throw new Error(json.error || 'Error al obtener miembros');
  }
  return json.data || [];
}

export async function addWorkspaceMember(workspaceId, memberData) {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(memberData),
  });

  const json = await parseResponse(res, 'Error al agregar miembro');
  if (!res.ok) {
    throw new Error(json.error || 'Error al agregar miembro');
  }
  return json.data;
}

export async function updateMemberRole(workspaceId, userId, role) {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  const json = await parseResponse(res, 'Error al actualizar rol');
  if (!res.ok) {
    throw new Error(json.error || 'Error al actualizar rol');
  }
  return json.data;
}

export async function removeWorkspaceMember(workspaceId, userId) {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(res, 'Error al remover miembro');
  if (!res.ok) {
    throw new Error(json.error || 'Error al remover miembro');
  }
  return json;
}

export default {
  login,
  register,
  getMe,
  updateProfile,
  listWorkspaces,
  createWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};
