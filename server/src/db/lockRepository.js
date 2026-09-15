import crypto from 'crypto';
import { executeQuery } from './connection.js';

/**
 * Checks if a lock record is currently active (not expired)
 */
function isLockActive(lock) {
  if (!lock || !lock.expires_at) return false;
  return new Date(lock.expires_at).getTime() > Date.now();
}

/**
 * Acquires an exclusive editing lock for a template within a workspace
 *
 * @param {object} params
 * @param {string} params.templateId
 * @param {string} params.workspaceId
 * @param {string} params.userId
 * @param {string} [params.userName='Usuario']
 * @param {number} [params.ttlSeconds=60]
 * @returns {Promise<{ acquired: boolean, lock: object }>}
 */
export async function acquireTemplateLock({
  templateId,
  workspaceId,
  userId,
  userName = 'Usuario',
  ttlSeconds = 60,
}) {
  if (!templateId || !workspaceId || !userId) {
    throw new Error('Faltan parámetros requeridos para adquirir el bloqueo de plantilla.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
  const nowIso = now.toISOString();

  // 1. Check existing lock
  const checkRes = await executeQuery(
    'SELECT * FROM template_locks WHERE template_id = ? AND workspace_id = ?',
    [templateId, workspaceId]
  );
  const existingLock = checkRes.rows?.[0] || null;

  if (existingLock) {
    const isActive = isLockActive(existingLock);

    // If locked by someone else and still valid
    if (isActive && existingLock.user_id !== userId) {
      return {
        acquired: false,
        lock: existingLock,
      };
    }

    // Either expired or owned by the same user -> refresh lock
    await executeQuery(
      'UPDATE template_locks SET user_id = ?, user_name = ?, locked_at = ?, expires_at = ? WHERE id = ?',
      [userId, userName, nowIso, expiresAt, existingLock.id]
    );

    const updated = {
      ...existingLock,
      user_id: userId,
      user_name: userName,
      locked_at: nowIso,
      expires_at: expiresAt,
    };

    return {
      acquired: true,
      lock: updated,
    };
  }

  // 2. Insert new lock
  const lockId = `lock-${crypto.randomUUID()}`;
  const insertSql = `
    INSERT INTO template_locks (
      id, template_id, workspace_id, user_id, user_name, locked_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await executeQuery(insertSql, [
    lockId,
    templateId,
    workspaceId,
    userId,
    userName,
    nowIso,
    expiresAt,
  ]);

  const newLock = {
    id: lockId,
    template_id: templateId,
    workspace_id: workspaceId,
    user_id: userId,
    user_name: userName,
    locked_at: nowIso,
    expires_at: expiresAt,
  };

  return {
    acquired: true,
    lock: newLock,
  };
}

/**
 * Renews an existing lock if owned by the same user
 */
export async function renewTemplateLock({
  templateId,
  workspaceId,
  userId,
  ttlSeconds = 60,
}) {
  const checkRes = await executeQuery(
    'SELECT * FROM template_locks WHERE template_id = ? AND workspace_id = ?',
    [templateId, workspaceId]
  );
  const existingLock = checkRes.rows?.[0] || null;

  if (!existingLock || existingLock.user_id !== userId) {
    return { renewed: false, lock: existingLock };
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await executeQuery(
    'UPDATE template_locks SET expires_at = ? WHERE id = ?',
    [expiresAt, existingLock.id]
  );

  return {
    renewed: true,
    lock: { ...existingLock, expires_at: expiresAt },
  };
}

/**
 * Releases a template lock when the user finishes editing or leaves
 */
export async function releaseTemplateLock({ templateId, workspaceId, userId }) {
  const checkRes = await executeQuery(
    'SELECT * FROM template_locks WHERE template_id = ? AND workspace_id = ?',
    [templateId, workspaceId]
  );
  const existingLock = checkRes.rows?.[0] || null;

  if (existingLock && existingLock.user_id === userId) {
    await executeQuery('DELETE FROM template_locks WHERE id = ?', [existingLock.id]);
    return { released: true };
  }

  return { released: false };
}

/**
 * Gets the current active lock for a template, or null if unlocked or expired
 */
export async function getTemplateLock(templateId, workspaceId) {
  const res = await executeQuery(
    'SELECT * FROM template_locks WHERE template_id = ? AND workspace_id = ?',
    [templateId, workspaceId]
  );
  const lock = res.rows?.[0] || null;

  if (!lock || !isLockActive(lock)) {
    return null;
  }

  return lock;
}

export default {
  acquireTemplateLock,
  renewTemplateLock,
  releaseTemplateLock,
  getTemplateLock,
};
