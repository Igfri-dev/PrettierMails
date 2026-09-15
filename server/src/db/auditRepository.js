import crypto from 'crypto';
import { executeQuery } from './connection.js';

/**
 * Records an operational or security audit event
 */
export async function recordAuditEvent({
  workspaceId,
  userId = null,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
  ipAddress = null,
}) {
  if (!workspaceId) {
    throw new Error('El workspaceId es obligatorio para registrar un evento de auditoría.');
  }

  if (!action || !resourceType) {
    throw new Error('La acción y el tipo de recurso son obligatorios.');
  }

  const id = `audit-${crypto.randomUUID()}`;
  const metaString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

  const sql = `
    INSERT INTO audit_logs (
      id, workspace_id, user_id, action, resource_type, resource_id, metadata, ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    workspaceId,
    userId,
    action,
    resourceType,
    resourceId,
    metaString,
    ipAddress,
  ]);

  return {
    id,
    workspace_id: workspaceId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  };
}

/**
 * Lists audit events for a workspace with pagination and metadata parsing
 */
export async function listAuditEvents(workspaceId, { limit = 50, offset = 0 } = {}) {
  if (!workspaceId) return [];

  const parsedLimit = Math.min(Number(limit) || 50, 100);
  const parsedOffset = Number(offset) || 0;

  const sql = `
    SELECT * FROM audit_logs
    WHERE workspace_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const result = await executeQuery(sql, [workspaceId, parsedLimit, parsedOffset]);

  return (result.rows || []).map((row) => {
    let parsedMetadata = row.metadata;
    if (typeof row.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(row.metadata);
      } catch {
        parsedMetadata = {};
      }
    }
    return {
      ...row,
      metadata: parsedMetadata,
    };
  });
}

export default {
  recordAuditEvent,
  listAuditEvents,
};
