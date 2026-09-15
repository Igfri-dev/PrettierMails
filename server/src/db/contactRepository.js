import crypto from 'crypto';
import { executeQuery } from './connection.js';
import { isValidEmail } from '../emailService.js';

function parseCustomFields(cf) {
  if (typeof cf === 'string') {
    try {
      return JSON.parse(cf);
    } catch {
      return {};
    }
  }
  return cf || {};
}

/**
 * Creates or updates a single contact in the workspace (upsert)
 */
export async function createContact({
  workspaceId,
  email,
  firstName = '',
  lastName = '',
  customFields = {},
  isSubscribed = true,
}) {
  if (!workspaceId) {
    throw new Error('workspaceId es obligatorio para registrar un contacto.');
  }

  if (!email || !isValidEmail(email)) {
    throw new Error('Dirección de correo electrónico inválida.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = await getContactByEmail(cleanEmail, workspaceId);

  if (existing) {
    // Update existing contact
    return updateContact(existing.id, workspaceId, {
      firstName,
      lastName,
      customFields,
      isSubscribed,
    });
  }

  const id = `ct-${crypto.randomUUID()}`;
  const customJson = typeof customFields === 'string' ? customFields : JSON.stringify(customFields || {});

  const sql = `
    INSERT INTO contacts (
      id, workspace_id, email, first_name, last_name, custom_fields, is_subscribed
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    workspaceId,
    cleanEmail,
    firstName ? firstName.trim() : null,
    lastName ? lastName.trim() : null,
    customJson,
    Boolean(isSubscribed),
  ]);

  return getContactById(id, workspaceId);
}

/**
 * Retrieves a contact by ID within a workspace
 */
export async function getContactById(id, workspaceId) {
  if (!id || !workspaceId) return null;

  const sql = 'SELECT * FROM contacts WHERE id = ? AND workspace_id = ?';
  const res = await executeQuery(sql, [id, workspaceId]);

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    ...row,
    custom_fields: parseCustomFields(row.custom_fields),
    is_subscribed: Boolean(row.is_subscribed),
  };
}

/**
 * Retrieves a contact by email within a workspace
 */
export async function getContactByEmail(email, workspaceId) {
  if (!email || !workspaceId) return null;

  const sql = 'SELECT * FROM contacts WHERE workspace_id = ? AND email = ?';
  const res = await executeQuery(sql, [workspaceId, email.trim().toLowerCase()]);

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    ...row,
    custom_fields: parseCustomFields(row.custom_fields),
    is_subscribed: Boolean(row.is_subscribed),
  };
}

/**
 * Lists contacts for a workspace with search, subscription status, and list membership filters
 */
export async function listContacts(workspaceId, options = {}) {
  if (!workspaceId) return [];

  const { listId = null, search = null, isSubscribed = null, limit = 100, offset = 0 } = options;

  let memberContactIds = null;
  if (listId) {
    const memRes = await executeQuery(
      'SELECT contact_id FROM contact_list_members WHERE list_id = ?',
      [listId]
    );
    memberContactIds = new Set((memRes.rows || []).map((m) => m.contact_id));
  }

  const sql = `
    SELECT * FROM contacts
    WHERE workspace_id = ?
    ORDER BY created_at DESC
  `;

  const res = await executeQuery(sql, [workspaceId]);

  // Map list names and memberships
  const listNameMap = new Map();
  try {
    const listRes = await executeQuery('SELECT id, name FROM contact_lists WHERE workspace_id = ?', [workspaceId]);
    for (const l of listRes.rows || []) {
      listNameMap.set(l.id, l.name);
    }
  } catch {}

  const memMap = new Map();
  try {
    const memRes = await executeQuery('SELECT list_id, contact_id FROM contact_list_members');
    for (const m of memRes.rows || []) {
      if (listNameMap.has(m.list_id)) {
        if (!memMap.has(m.contact_id)) {
          memMap.set(m.contact_id, []);
        }
        memMap.get(m.contact_id).push({
          id: m.list_id,
          name: listNameMap.get(m.list_id),
        });
      }
    }
  } catch {}

  let contacts = (res.rows || []).map((row) => ({
    ...row,
    custom_fields: parseCustomFields(row.custom_fields),
    is_subscribed: Boolean(row.is_subscribed),
    lists: memMap.get(row.id) || [],
  }));

  // Filter by list membership
  if (memberContactIds) {
    contacts = contacts.filter((c) => memberContactIds.has(c.id));
  }

  // Filter by subscription status
  if (isSubscribed !== null && isSubscribed !== undefined) {
    const subTarget = Boolean(isSubscribed);
    contacts = contacts.filter((c) => c.is_subscribed === subTarget);
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    contacts = contacts.filter((c) => {
      const emailMatch = c.email.toLowerCase().includes(q);
      const fnMatch = c.first_name ? c.first_name.toLowerCase().includes(q) : false;
      const lnMatch = c.last_name ? c.last_name.toLowerCase().includes(q) : false;
      return emailMatch || fnMatch || lnMatch;
    });
  }

  // Pagination
  const parsedLimit = Math.min(Number(limit) || 100, 200);
  const parsedOffset = Number(offset) || 0;
  return contacts.slice(parsedOffset, parsedOffset + parsedLimit);
}

/**
 * Updates an existing contact
 */
export async function updateContact(id, workspaceId, updates = {}) {
  const existing = await getContactById(id, workspaceId);
  if (!existing) {
    throw new Error('Contacto no encontrado en este espacio de trabajo.');
  }

  const firstName = updates.firstName !== undefined ? updates.firstName : existing.first_name;
  const lastName = updates.lastName !== undefined ? updates.lastName : existing.last_name;
  const isSubscribed = updates.isSubscribed !== undefined ? Boolean(updates.isSubscribed) : existing.is_subscribed;

  let customFields = existing.custom_fields;
  if (updates.customFields !== undefined) {
    customFields = {
      ...existing.custom_fields,
      ...(typeof updates.customFields === 'string' ? JSON.parse(updates.customFields) : updates.customFields),
    };
  }

  const customJson = JSON.stringify(customFields);

  const sql = `
    UPDATE contacts SET
      first_name = ?,
      last_name = ?,
      custom_fields = ?,
      is_subscribed = ?
    WHERE id = ? AND workspace_id = ?
  `;

  await executeQuery(sql, [
    firstName ? String(firstName).trim() : null,
    lastName ? String(lastName).trim() : null,
    customJson,
    isSubscribed,
    id,
    workspaceId,
  ]);

  return getContactById(id, workspaceId);
}

/**
 * Deletes a contact and its list memberships
 */
export async function deleteContact(id, workspaceId) {
  await executeQuery('DELETE FROM contact_list_members WHERE contact_id = ?', [id]);
  const res = await executeQuery('DELETE FROM contacts WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return { success: true, deletedCount: res.rowCount || 0 };
}

/**
 * Bulk upserts an array of parsed contacts into a workspace and optionally assigns them to a list
 */
export async function bulkUpsertContacts(workspaceId, contactsArray = [], options = {}) {
  if (!workspaceId) throw new Error('workspaceId es requerido.');

  let createdCount = 0;
  let updatedCount = 0;
  const contactIds = [];

  for (const c of contactsArray) {
    if (!c.email || !isValidEmail(c.email)) continue;

    const cleanEmail = c.email.trim().toLowerCase();
    const existing = await getContactByEmail(cleanEmail, workspaceId);

    if (existing) {
      const updated = await updateContact(existing.id, workspaceId, {
        firstName: c.first_name || existing.first_name,
        lastName: c.last_name || existing.last_name,
        customFields: { ...existing.custom_fields, ...(c.custom_fields || {}) },
        isSubscribed: c.is_subscribed !== undefined ? c.is_subscribed : existing.is_subscribed,
      });
      updatedCount++;
      contactIds.push(updated.id);
    } else {
      const created = await createContact({
        workspaceId,
        email: cleanEmail,
        firstName: c.first_name || '',
        lastName: c.last_name || '',
        customFields: c.custom_fields || {},
        isSubscribed: c.is_subscribed !== undefined ? c.is_subscribed : true,
      });
      createdCount++;
      contactIds.push(created.id);
    }
  }

  // If a target list is provided, add all contacts to the list
  if (options.targetListId) {
    await addContactsToList(options.targetListId, contactIds);
  }

  return {
    total: contactsArray.length,
    createdCount,
    updatedCount,
    contactIds,
  };
}

/**
 * Creates a new contact list
 */
export async function createContactList({ workspaceId, name, description = '' }) {
  if (!workspaceId) throw new Error('workspaceId es obligatorio.');
  if (!name || !name.trim()) throw new Error('El nombre de la lista es obligatorio.');

  const id = `list-${crypto.randomUUID()}`;
  const sql = `
    INSERT INTO contact_lists (id, workspace_id, name, description)
    VALUES (?, ?, ?, ?)
  `;

  await executeQuery(sql, [id, workspaceId, name.trim(), description ? description.trim() : null]);
  return getContactListById(id, workspaceId);
}

/**
 * Retrieves a contact list by ID with its subscriber count
 */
export async function getContactListById(id, workspaceId) {
  if (!id || !workspaceId) return null;

  const sql = 'SELECT * FROM contact_lists WHERE id = ? AND workspace_id = ?';
  const res = await executeQuery(sql, [id, workspaceId]);

  if (!res.rows || res.rows.length === 0) return null;

  const list = res.rows[0];

  // Count active subscribers in list
  const countSql = 'SELECT contact_id FROM contact_list_members WHERE list_id = ?';
  const countRes = await executeQuery(countSql, [id]);
  const memberCount = (countRes.rows || []).length;

  return {
    ...list,
    memberCount,
  };
}

/**
 * Lists all contact lists in a workspace with their member counts
 */
export async function listContactLists(workspaceId) {
  if (!workspaceId) return [];

  const sql = `
    SELECT * FROM contact_lists
    WHERE workspace_id = ?
    ORDER BY created_at DESC
  `;

  const res = await executeQuery(sql, [workspaceId]);
  const lists = res.rows || [];

  // Fetch counts for all lists
  const result = [];
  for (const l of lists) {
    const countRes = await executeQuery(
      'SELECT contact_id FROM contact_list_members WHERE list_id = ?',
      [l.id]
    );
    result.push({
      ...l,
      memberCount: (countRes.rows || []).length,
    });
  }

  return result;
}

/**
 * Deletes a contact list and its memberships
 */
export async function deleteContactList(id, workspaceId) {
  await executeQuery('DELETE FROM contact_list_members WHERE list_id = ?', [id]);
  const res = await executeQuery('DELETE FROM contact_lists WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return { success: true, deletedCount: res.rowCount || 0 };
}

/**
 * Adds an array of contact IDs to a list (idempotent, skips existing)
 */
export async function addContactsToList(listId, contactIds = []) {
  if (!listId || !contactIds || contactIds.length === 0) return { addedCount: 0 };

  const existingRes = await executeQuery(
    'SELECT contact_id FROM contact_list_members WHERE list_id = ?',
    [listId]
  );
  const existingSet = new Set((existingRes.rows || []).map((m) => m.contact_id));

  let addedCount = 0;
  for (const cid of contactIds) {
    if (!existingSet.has(cid)) {
      const memberId = `clm-${crypto.randomUUID()}`;
      await executeQuery(
        'INSERT INTO contact_list_members (id, list_id, contact_id) VALUES (?, ?, ?)',
        [memberId, listId, cid]
      );
      addedCount++;
    }
  }

  return { success: true, addedCount };
}

/**
 * Removes a single contact from a list
 */
export async function removeContactFromList(listId, contactId) {
  const res = await executeQuery(
    'DELETE FROM contact_list_members WHERE list_id = ? AND contact_id = ?',
    [listId, contactId]
  );
  return { success: true, removedCount: res.rowCount || 0 };
}

/**
 * Returns all contacts belonging to a specific list in a workspace
 */
export async function getContactsInList(listId, workspaceId) {
  return listContacts(workspaceId, { listId });
}

export default {
  createContact,
  getContactById,
  getContactByEmail,
  listContacts,
  updateContact,
  deleteContact,
  bulkUpsertContacts,
  createContactList,
  getContactListById,
  listContactLists,
  deleteContactList,
  addContactsToList,
  removeContactFromList,
  getContactsInList,
};
