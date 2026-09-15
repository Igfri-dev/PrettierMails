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
 * Lists campaigns for the active workspace
 */
export async function listCampaigns(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `/api/campaigns${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener campañas.');
  }

  return res.json();
}

/**
 * Creates a new email campaign
 */
export async function createCampaign(campaignData) {
  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(campaignData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al crear la campaña.');
  }

  return data;
}

/**
 * Retrieves campaign details
 */
export async function getCampaign(id) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener la campaña.');
  }

  return data;
}

/**
 * Updates an existing campaign
 */
export async function updateCampaign(id, campaignData) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(campaignData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar la campaña.');
  }

  return data;
}

/**
 * Deletes a campaign
 */
export async function deleteCampaign(id) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar la campaña.');
  }

  return data;
}

/**
 * Triggers async campaign dispatch
 */
export async function dispatchCampaign(id, options = {}) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}/dispatch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(options),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al despachar la campaña.');
  }

  return data;
}

/**
 * Pauses an active campaign dispatch
 */
export async function pauseCampaign(id) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al pausar la campaña.');
  }

  return data;
}

/**
 * Resumes a paused campaign
 */
export async function resumeCampaign(id) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}/resume`, {
    method: 'POST',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al reanudar la campaña.');
  }

  return data;
}

/**
 * Retrieves campaign metrics, open rate, CTR, and top clicked URLs
 */
export async function getCampaignStats(id) {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}/stats`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener estadísticas de la campaña.');
  }

  return data;
}

/**
 * Retrieves recipient delivery logs
 */
export async function getCampaignLogs(id, params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `/api/campaigns/${encodeURIComponent(id)}/logs${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener logs de envío.');
  }

  return res.json();
}
