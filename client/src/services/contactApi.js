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
 * Lists contacts for the active workspace with optional filters
 */
export async function listContacts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.listId) query.set('listId', params.listId);
  if (params.isSubscribed !== undefined && params.isSubscribed !== null) {
    query.set('isSubscribed', String(params.isSubscribed));
  }
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `/api/contacts${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener los contactos.');
  }

  return res.json();
}

/**
 * Creates or upserts a contact in the active workspace
 */
export async function createContact(contactData) {
  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(contactData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al guardar el contacto.');
  }

  return data;
}

/**
 * Retrieves a single contact by ID
 */
export async function getContact(id) {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener el contacto.');
  }

  return data;
}

/**
 * Updates a contact
 */
export async function updateContact(id, contactData) {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(contactData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar el contacto.');
  }

  return data;
}

/**
 * Deletes a contact
 */
export async function deleteContact(id) {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar el contacto.');
  }

  return data;
}

/**
 * Imports contacts from CSV text
 */
export async function importCsvContacts({ csvText, targetListId }) {
  const res = await fetch('/api/contacts/import-csv', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ csvText, targetListId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al importar contactos desde CSV.');
  }

  return data;
}

/**
 * Lists all contact lists in current workspace
 */
export async function listContactLists() {
  const res = await fetch('/api/contacts/lists', {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener listas de contactos.');
  }

  return res.json();
}

/**
 * Creates a new contact list
 */
export async function createContactList(listData) {
  const res = await fetch('/api/contacts/lists', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(listData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al crear la lista de contactos.');
  }

  return data;
}

/**
 * Retrieves a contact list and its member contacts
 */
export async function getContactList(id) {
  const res = await fetch(`/api/contacts/lists/${encodeURIComponent(id)}`, {
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener la lista de contactos.');
  }

  return data;
}

/**
 * Deletes a contact list
 */
export async function deleteContactList(id) {
  const res = await fetch(`/api/contacts/lists/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar la lista de contactos.');
  }

  return data;
}

/**
 * Adds contacts to a list
 */
export async function addMembersToList(listId, contactIds) {
  const res = await fetch(`/api/contacts/lists/${encodeURIComponent(listId)}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ contactIds }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al añadir miembros a la lista.');
  }

  return data;
}

/**
 * Removes a contact from a list
 */
export async function removeMemberFromList(listId, contactId) {
  const res = await fetch(
    `/api/contacts/lists/${encodeURIComponent(listId)}/members/${encodeURIComponent(contactId)}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al remover el contacto de la lista.');
  }

  return data;
}
