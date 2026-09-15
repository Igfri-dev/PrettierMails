import crypto from 'crypto';
import { executeQuery } from './connection.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { validateSmtpHost } from '../utils/ssrfProtection.js';

/**
 * Sanitizes an SMTP account record for public/client consumption
 *
 * @param {object} account
 * @param {boolean} [includePassword=false]
 * @returns {object}
 */
function sanitizeAccount(account, includePassword = false) {
  if (!account) return null;
  const copy = { ...account };
  copy.hasPassword = Boolean(copy.encrypted_pass);
  if (includePassword && copy.encrypted_pass) {
    try {
      copy.password = decrypt(copy.encrypted_pass);
    } catch {
      copy.password = '';
    }
  }
  delete copy.encrypted_pass;
  return copy;
}

/**
 * Creates a new SMTP account with encrypted credentials
 */
export async function createSmtpAccount({
  workspaceId,
  label,
  host,
  port = 587,
  secure = false,
  authUser = '',
  password = '',
  fromName = '',
  fromEmail = '',
  isDefault = false,
  dailyLimit = 500,
}) {
  if (!workspaceId) {
    throw new Error('El workspaceId es obligatorio para registrar una cuenta SMTP.');
  }

  if (!label || !label.trim()) {
    throw new Error('La etiqueta o nombre de la cuenta SMTP es obligatoria.');
  }

  const cleanHost = validateSmtpHost(host);
  const parsedPort = Number(port) || 587;
  const isSecure = Boolean(secure || parsedPort === 465);

  const id = `smtp-${crypto.randomUUID()}`;
  const encryptedPass = password ? encrypt(password) : null;

  // If set as default, reset other accounts for this workspace
  if (isDefault) {
    await executeQuery(
      'UPDATE smtp_accounts SET is_default = ? WHERE workspace_id = ?',
      [false, workspaceId]
    );
  }

  const sql = `
    INSERT INTO smtp_accounts (
      id, workspace_id, label, host, port, secure, auth_user,
      encrypted_pass, from_name, from_email, is_default, daily_limit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    workspaceId,
    label.trim(),
    cleanHost,
    parsedPort,
    isSecure,
    authUser ? authUser.trim() : null,
    encryptedPass,
    fromName ? fromName.trim() : null,
    fromEmail ? fromEmail.trim().toLowerCase() : null,
    Boolean(isDefault),
    Number(dailyLimit) || 500,
  ]);

  return getSmtpAccountById(id, workspaceId);
}

/**
 * Lists all SMTP accounts for a given workspace
 */
export async function listSmtpAccounts(workspaceId) {
  if (!workspaceId) return [];

  const sql = `
    SELECT * FROM smtp_accounts
    WHERE workspace_id = ?
    ORDER BY is_default DESC, created_at ASC
  `;

  const result = await executeQuery(sql, [workspaceId]);
  return (result.rows || []).map((acc) => sanitizeAccount(acc, false));
}

/**
 * Retrieves a single SMTP account by ID and workspace
 */
export async function getSmtpAccountById(id, workspaceId, { includeDecryptedPass = false } = {}) {
  if (!id || !workspaceId) return null;

  const sql = 'SELECT * FROM smtp_accounts WHERE id = ? AND workspace_id = ?';
  const result = await executeQuery(sql, [id, workspaceId]);

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  return sanitizeAccount(result.rows[0], includeDecryptedPass);
}

/**
 * Updates an existing SMTP account
 */
export async function updateSmtpAccount(id, workspaceId, updates = {}) {
  const existing = await getSmtpAccountById(id, workspaceId);
  if (!existing) {
    throw new Error('Cuenta SMTP no encontrada en este espacio de trabajo.');
  }

  if (updates.isDefault) {
    await executeQuery(
      'UPDATE smtp_accounts SET is_default = ? WHERE workspace_id = ?',
      [false, workspaceId]
    );
  }

  const cleanHost = updates.host ? validateSmtpHost(updates.host) : existing.host;
  const parsedPort = updates.port !== undefined ? Number(updates.port) || 587 : existing.port;
  const isSecure = updates.secure !== undefined ? Boolean(updates.secure) : existing.secure;

  let encryptedPass;
  if (updates.password !== undefined) {
    encryptedPass = updates.password ? encrypt(updates.password) : null;
  } else {
    // Keep existing encrypted password
    const rawExisting = await executeQuery('SELECT encrypted_pass FROM smtp_accounts WHERE id = ?', [id]);
    encryptedPass = rawExisting.rows?.[0]?.encrypted_pass || null;
  }

  const sql = `
    UPDATE smtp_accounts SET
      label = ?,
      host = ?,
      port = ?,
      secure = ?,
      auth_user = ?,
      encrypted_pass = ?,
      from_name = ?,
      from_email = ?,
      is_default = ?,
      daily_limit = ?
    WHERE id = ? AND workspace_id = ?
  `;

  await executeQuery(sql, [
    updates.label !== undefined ? updates.label.trim() : existing.label,
    cleanHost,
    parsedPort,
    isSecure,
    updates.authUser !== undefined ? (updates.authUser ? updates.authUser.trim() : null) : existing.auth_user,
    encryptedPass,
    updates.fromName !== undefined ? (updates.fromName ? updates.fromName.trim() : null) : existing.from_name,
    updates.fromEmail !== undefined ? (updates.fromEmail ? updates.fromEmail.trim().toLowerCase() : null) : existing.from_email,
    updates.isDefault !== undefined ? Boolean(updates.isDefault) : existing.is_default,
    updates.dailyLimit !== undefined ? Number(updates.dailyLimit) || 500 : existing.daily_limit,
    id,
    workspaceId,
  ]);

  return getSmtpAccountById(id, workspaceId);
}

/**
 * Deletes an SMTP account
 */
export async function deleteSmtpAccount(id, workspaceId) {
  const result = await executeQuery(
    'DELETE FROM smtp_accounts WHERE id = ? AND workspace_id = ?',
    [id, workspaceId]
  );
  return { success: true, deletedCount: result.rowCount || 0 };
}

/**
 * Sets an account as the default sender for the workspace
 */
export async function setDefaultSmtpAccount(id, workspaceId) {
  const account = await getSmtpAccountById(id, workspaceId);
  if (!account) {
    throw new Error('Cuenta SMTP no encontrada.');
  }

  await executeQuery(
    'UPDATE smtp_accounts SET is_default = ? WHERE workspace_id = ?',
    [false, workspaceId]
  );

  await executeQuery(
    'UPDATE smtp_accounts SET is_default = ? WHERE id = ? AND workspace_id = ?',
    [true, id, workspaceId]
  );

  return getSmtpAccountById(id, workspaceId);
}

export default {
  createSmtpAccount,
  listSmtpAccounts,
  getSmtpAccountById,
  updateSmtpAccount,
  deleteSmtpAccount,
  setDefaultSmtpAccount,
};
