const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getHeaders(customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
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

/**
 * Checks active lock status for a template
 */
export async function getTemplateLock(templateId) {
  if (!templateId) return { locked: false, lock: null };
  const res = await fetch(`${API_URL}/api/templates/${encodeURIComponent(templateId)}/lock`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    return { locked: false, lock: null };
  }
  return res.json();
}

/**
 * Acquires exclusive editing lock for a template
 */
export async function acquireTemplateLock(templateId, ttlSeconds = 60) {
  if (!templateId) return { acquired: true };
  const res = await fetch(`${API_URL}/api/templates/${encodeURIComponent(templateId)}/lock`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ttlSeconds }),
  });

  const data = await res.json();
  if (res.status === 409) {
    return { acquired: false, ...data };
  }
  if (!res.ok) {
    throw new Error(data.error || 'Error al adquirir bloqueo');
  }
  return data;
}

/**
 * Sends heartbeat to renew active lock
 */
export async function renewTemplateLock(templateId, ttlSeconds = 60) {
  if (!templateId) return { renewed: true };
  const res = await fetch(`${API_URL}/api/templates/${encodeURIComponent(templateId)}/heartbeat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ttlSeconds }),
  });
  if (!res.ok) return { renewed: false };
  return res.json();
}

/**
 * Releases editing lock for a template
 */
export async function releaseTemplateLock(templateId) {
  if (!templateId) return { released: true };
  try {
    const res = await fetch(`${API_URL}/api/templates/${encodeURIComponent(templateId)}/unlock`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default {
  getTemplateLock,
  acquireTemplateLock,
  renewTemplateLock,
  releaseTemplateLock,
};
