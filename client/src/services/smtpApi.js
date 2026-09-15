import useAuthStore from '../store/authStore.js';

/**
 * Returns common HTTP headers including Bearer token and current workspace ID
 */
function getHeaders() {
  const token = useAuthStore.getState().token;
  const currentWorkspace = useAuthStore.getState().currentWorkspace;
  const workspaceId = currentWorkspace?.id || 'ws-default';

  const headers = {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch all SMTP accounts configured for current workspace
 */
export async function listSmtpAccounts() {
  const res = await fetch('/api/smtp-accounts', {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener las cuentas SMTP.');
  }

  return res.json();
}

/**
 * Create a new SMTP account
 */
export async function createSmtpAccount(accountData) {
  const res = await fetch('/api/smtp-accounts', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(accountData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al guardar la cuenta SMTP.');
  }

  return data;
}

/**
 * Update an existing SMTP account
 */
export async function updateSmtpAccount(id, accountData) {
  const res = await fetch(`/api/smtp-accounts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(accountData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar la cuenta SMTP.');
  }

  return data;
}

/**
 * Delete an SMTP account
 */
export async function deleteSmtpAccount(id) {
  const res = await fetch(`/api/smtp-accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar la cuenta SMTP.');
  }

  return data;
}

/**
 * Test SMTP connection using saved credentials
 */
export async function testSmtpAccount(id) {
  const res = await fetch(`/api/smtp-accounts/${encodeURIComponent(id)}/test`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Error al verificar la conexión SMTP.');
  }

  return data;
}

/**
 * Set an SMTP account as workspace default
 */
export async function setDefaultSmtpAccount(id) {
  const res = await fetch(`/api/smtp-accounts/${encodeURIComponent(id)}/default`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al configurar cuenta SMTP por defecto.');
  }

  return data;
}

/**
 * Fetch operational audit logs for current workspace
 */
export async function listAuditLogs(limit = 50, offset = 0) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const res = await fetch(`/api/audit-logs?${query.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al recuperar logs de auditoría.');
  }

  return res.json();
}

export default {
  listSmtpAccounts,
  createSmtpAccount,
  updateSmtpAccount,
  deleteSmtpAccount,
  testSmtpAccount,
  setDefaultSmtpAccount,
  listAuditLogs,
};
