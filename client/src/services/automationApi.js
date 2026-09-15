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
 * Lists automations for the active workspace
 */
export async function listAutomations() {
  const res = await fetch('/api/automations', { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener automatizaciones.');
  }
  return data.data || [];
}

/**
 * Gets automation details by ID including sequenced steps
 */
export async function getAutomation(id) {
  const res = await fetch(`/api/automations/${id}`, { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener detalles de la automatización.');
  }
  return data.data;
}

/**
 * Creates a new automation
 */
export async function createAutomation(autoData) {
  const res = await fetch('/api/automations', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(autoData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al crear automatización.');
  }
  return data.data;
}

/**
 * Updates an automation
 */
export async function updateAutomation(id, updates) {
  const res = await fetch(`/api/automations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar automatización.');
  }
  return data.data;
}

/**
 * Deletes an automation
 */
export async function deleteAutomation(id) {
  const res = await fetch(`/api/automations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar automatización.');
  }
  return true;
}

/**
 * Adds a step to an automation
 */
export async function addAutomationStep(automationId, stepData) {
  const res = await fetch(`/api/automations/${automationId}/steps`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(stepData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al agregar paso a la automatización.');
  }
  return data.data;
}

/**
 * Deletes a step from an automation
 */
export async function deleteAutomationStep(automationId, stepId) {
  const res = await fetch(`/api/automations/${automationId}/steps/${stepId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar paso.');
  }
  return true;
}

/**
 * Fetches execution logs for an automation
 */
export async function listAutomationLogs(automationId) {
  const res = await fetch(`/api/automations/${automationId}/logs`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener registros de ejecución.');
  }
  return data.data || [];
}

/**
 * Dispatches a simulated event to trigger workflows
 */
export async function triggerAutomationEvent(eventType, context = {}) {
  const res = await fetch('/api/automations/trigger-event', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ eventType, context }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al ejecutar disparador.');
  }
  return data;
}

export default {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  addAutomationStep,
  deleteAutomationStep,
  listAutomationLogs,
  triggerAutomationEvent,
};
