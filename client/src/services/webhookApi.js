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
 * Lists outgoing webhooks for active workspace
 */
export async function listWebhooks() {
  const res = await fetch('/api/webhooks', { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al listar webhooks.');
  }
  return data.data || [];
}

/**
 * Gets webhook details
 */
export async function getWebhook(id) {
  const res = await fetch(`/api/webhooks/${id}`, { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener webhook.');
  }
  return data.data;
}

/**
 * Creates a new outgoing webhook
 */
export async function createWebhook(webhookData) {
  const res = await fetch('/api/webhooks', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(webhookData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al registrar webhook.');
  }
  return data.data;
}

/**
 * Updates a webhook
 */
export async function updateWebhook(id, updates) {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar webhook.');
  }
  return data.data;
}

/**
 * Deletes a webhook
 */
export async function deleteWebhook(id) {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar webhook.');
  }
  return true;
}

/**
 * Lists recent deliveries for a webhook
 */
export async function listWebhookDeliveries(webhookId) {
  const res = await fetch(`/api/webhooks/${webhookId}/deliveries`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener entregas de webhook.');
  }
  return data.data || [];
}

/**
 * Dispatches a test event to outgoing webhooks
 */
export async function dispatchWebhookEvent(eventName, payload = {}) {
  const res = await fetch('/api/webhooks/dispatch', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ eventName, payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al disparar evento a webhooks.');
  }
  return data.data;
}

export default {
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  listWebhookDeliveries,
  dispatchWebhookEvent,
};
