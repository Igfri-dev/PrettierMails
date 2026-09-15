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
 * PrettierMails Template API Client
 */
export async function listTemplates(options = {}) {
  const { search, isFavorite } = options;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (isFavorite !== undefined && isFavorite !== null) {
    params.append('isFavorite', String(isFavorite));
  }

  const url = `${API_URL}/api/templates${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error al listar plantillas: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || [];
}

export async function getTemplate(id) {
  const res = await fetch(`${API_URL}/api/templates/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Error al obtener plantilla: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function createTemplate(data) {
  const res = await fetch(`${API_URL}/api/templates`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error al crear plantilla: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function updateTemplate(id, data) {
  const res = await fetch(`${API_URL}/api/templates/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error al actualizar plantilla: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function deleteTemplate(id) {
  const res = await fetch(`${API_URL}/api/templates/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error al eliminar plantilla: ${res.statusText}`);
  }

  return true;
}

export async function autosaveTemplate(data) {
  const res = await fetch(`${API_URL}/api/templates/autosave`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Error en autoguardado: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function listTemplateVersions(templateId) {
  const res = await fetch(`${API_URL}/api/templates/${templateId}/versions`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Error al listar versiones: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

export async function restoreTemplateVersion(templateId, versionId) {
  const res = await fetch(`${API_URL}/api/templates/${templateId}/versions/${versionId}/restore`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error al restaurar versión: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function duplicateTemplate(templateId, newName) {
  const res = await fetch(`${API_URL}/api/templates/${templateId}/duplicate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) {
    throw new Error(`Error al duplicar plantilla: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function exportTemplateJson(templateId) {
  const res = await fetch(`${API_URL}/api/templates/${templateId}/export-json`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Error al exportar plantilla: ${res.statusText}`);
  }
  return res.json();
}

export async function importTemplateJson(jsonData) {
  const res = await fetch(`${API_URL}/api/templates/import-json`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(jsonData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error al importar plantilla: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export default {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  autosaveTemplate,
  listTemplateVersions,
  restoreTemplateVersion,
  duplicateTemplate,
  exportTemplateJson,
  importTemplateJson,
};
