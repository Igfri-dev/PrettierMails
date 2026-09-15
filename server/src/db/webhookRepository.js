import crypto from 'crypto';
import { executeQuery } from './connection.js';

/**
 * Webhook Repository for Outgoing Event Notifications
 */

export async function createWebhook({
  workspaceId,
  url,
  secret = null,
  events = ['*'],
  isActive = true,
}) {
  if (!workspaceId || !url) {
    throw new Error('Workspace y URL de webhook son obligatorios.');
  }

  const id = `wh-${crypto.randomUUID()}`;
  const finalSecret = secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date().toISOString();
  const serializedEvents = Array.isArray(events) ? events : [events];

  const sql = `
    INSERT INTO webhooks (
      id, workspace_id, url, secret, events, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    workspaceId,
    url,
    finalSecret,
    JSON.stringify(serializedEvents),
    isActive ? 1 : 0,
    now,
    now,
  ]);

  return {
    id,
    workspace_id: workspaceId,
    url,
    secret: finalSecret,
    events: serializedEvents,
    is_active: Boolean(isActive),
    created_at: now,
    updated_at: now,
  };
}

export async function getWebhookById(id, workspaceId) {
  const sql = 'SELECT * FROM webhooks WHERE id = ? AND workspace_id = ?';
  const res = await executeQuery(sql, [id, workspaceId]);
  const hook = res.rows?.[0] || null;
  if (!hook) return null;

  return {
    ...hook,
    events: typeof hook.events === 'string' ? JSON.parse(hook.events || '["*"]') : hook.events,
    is_active: Boolean(hook.is_active),
  };
}

export async function listWebhooks(workspaceId) {
  const sql = 'SELECT * FROM webhooks WHERE workspace_id = ? ORDER BY created_at DESC';
  const res = await executeQuery(sql, [workspaceId]);
  return (res.rows || []).map((h) => ({
    ...h,
    events: typeof h.events === 'string' ? JSON.parse(h.events || '["*"]') : h.events,
    is_active: Boolean(h.is_active),
  }));
}

export async function updateWebhook(id, workspaceId, updates = {}) {
  const existing = await getWebhookById(id, workspaceId);
  if (!existing) throw new Error('Webhook no encontrado.');

  const fields = [];
  const params = [];

  if (updates.url !== undefined) {
    fields.push('url = ?');
    params.push(updates.url);
  }
  if (updates.events !== undefined) {
    fields.push('events = ?');
    params.push(JSON.stringify(updates.events));
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(updates.isActive ? 1 : 0);
  }

  if (fields.length === 0) return existing;

  const now = new Date().toISOString();
  fields.push('updated_at = ?');
  params.push(now);

  params.push(id);
  params.push(workspaceId);

  const sql = `UPDATE webhooks SET ${fields.join(', ')} WHERE id = ? AND workspace_id = ?`;
  await executeQuery(sql, params);

  return getWebhookById(id, workspaceId);
}

export async function deleteWebhook(id, workspaceId) {
  await executeQuery('DELETE FROM webhook_deliveries WHERE webhook_id = ?', [id]);
  const res = await executeQuery('DELETE FROM webhooks WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return (res.rowCount || 0) > 0;
}

export async function logWebhookDelivery({
  webhookId,
  eventName,
  payload,
  responseStatus = null,
  errorMessage = null,
}) {
  const deliveryId = `whd-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const serializedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload || {});

  const sql = `
    INSERT INTO webhook_deliveries (
      id, webhook_id, event_name, payload, response_status, error_message, delivered_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    deliveryId,
    webhookId,
    eventName,
    serializedPayload,
    responseStatus,
    errorMessage,
    now,
    now,
  ]);

  return {
    id: deliveryId,
    webhook_id: webhookId,
    event_name: eventName,
    response_status: responseStatus,
    error_message: errorMessage,
    delivered_at: now,
  };
}

export async function listWebhookDeliveries(webhookId, { limit = 50 } = {}) {
  const sql = 'SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?';
  const res = await executeQuery(sql, [webhookId, Math.min(Number(limit) || 50, 200)]);
  return (res.rows || []).map((d) => ({
    ...d,
    payload: typeof d.payload === 'string' ? JSON.parse(d.payload || '{}') : d.payload,
  }));
}

/**
 * Dispatches an event payload to all matching active webhooks in a workspace
 *
 * @param {string} workspaceId
 * @param {string} eventName
 * @param {object} payload
 * @param {object} [options]
 * @param {Function} [options.fetchFn] Custom fetch function for tests
 * @returns {Promise<object>}
 */
export async function dispatchWebhookEvent(workspaceId, eventName, payload, options = {}) {
  const webhooks = await listWebhooks(workspaceId);
  const activeHooks = webhooks.filter((w) => {
    if (!w.is_active) return false;
    const events = w.events || ['*'];
    return events.includes('*') || events.includes(eventName);
  });

  const timestamp = Date.now().toString();
  const payloadJson = JSON.stringify({
    event: eventName,
    timestamp: new Date().toISOString(),
    workspaceId,
    data: payload,
  });

  const customFetch = options.fetchFn || globalThis.fetch;
  const deliveries = [];

  for (const hook of activeHooks) {
    const signature = crypto
      .createHmac('sha256', hook.secret)
      .update(`${timestamp}.${payloadJson}`)
      .digest('hex');

    let responseStatus = null;
    let errorMessage = null;

    try {
      if (customFetch) {
        const response = await customFetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-prettiermails-event': eventName,
            'x-prettiermails-timestamp': timestamp,
            'x-prettiermails-signature': signature,
          },
          body: payloadJson,
        });
        responseStatus = response.status;
      } else {
        responseStatus = 200;
      }
    } catch (err) {
      errorMessage = err.message;
      responseStatus = 500;
    }

    const log = await logWebhookDelivery({
      webhookId: hook.id,
      eventName,
      payload,
      responseStatus,
      errorMessage,
    });

    deliveries.push({
      webhookId: hook.id,
      deliveryId: log.id,
      responseStatus,
      success: responseStatus >= 200 && responseStatus < 300,
    });
  }

  return {
    eventName,
    matchedWebhooks: activeHooks.length,
    deliveries,
  };
}

export default {
  createWebhook,
  getWebhookById,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  logWebhookDelivery,
  listWebhookDeliveries,
  dispatchWebhookEvent,
};
