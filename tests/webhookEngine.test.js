import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import {
  createWebhook,
  getWebhookById,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  dispatchWebhookEvent,
  listWebhookDeliveries,
} from '../server/src/db/webhookRepository.js';

describe('Outgoing Webhooks & HMAC Delivery Engine', () => {
  const ws = 'ws-test-webhooks';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('creates, lists, updates, and deletes webhooks with workspace isolation', async () => {
    const webhook = await createWebhook({
      workspaceId: ws,
      url: 'https://example.com/api/webhook-listener',
      events: ['contact.subscribed', 'email.bounced'],
    });

    expect(webhook.id).toMatch(/^wh-/);
    expect(webhook.url).toBe('https://example.com/api/webhook-listener');
    expect(webhook.secret).toMatch(/^whsec_/);
    expect(webhook.events).toEqual(['contact.subscribed', 'email.bounced']);
    expect(webhook.is_active).toBe(true);

    // List webhooks in this workspace
    const list = await listWebhooks(ws);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(webhook.id);

    // List webhooks in different workspace (isolation)
    const otherList = await listWebhooks('ws-other');
    expect(otherList.length).toBe(0);

    // Update webhook
    const updated = await updateWebhook(webhook.id, ws, {
      url: 'https://example.com/api/updated-endpoint',
      isActive: false,
    });
    expect(updated.url).toBe('https://example.com/api/updated-endpoint');
    expect(updated.is_active).toBe(false);

    // Delete webhook
    const deleted = await deleteWebhook(webhook.id, ws);
    expect(deleted).toBe(true);

    const checkNull = await getWebhookById(webhook.id, ws);
    expect(checkNull).toBeNull();
  });

  it('dispatches webhook events with correct HMAC-SHA256 signature and records delivery log', async () => {
    const customSecret = 'my-super-secret-key-12345';
    const hook = await createWebhook({
      workspaceId: ws,
      url: 'https://webhook.site/test-endpoint',
      secret: customSecret,
      events: ['campaign.sent', 'contact.subscribed'],
      isActive: true,
    });

    let interceptedRequest = null;
    const mockFetch = vi.fn(async (url, options) => {
      interceptedRequest = { url, options };
      return {
        status: 200,
        ok: true,
      };
    });

    const payloadData = {
      campaignId: 'camp-999',
      recipientEmail: 'lead@enterprise.com',
      status: 'delivered',
    };

    const dispatchResult = await dispatchWebhookEvent(ws, 'campaign.sent', payloadData, {
      fetchFn: mockFetch,
    });

    expect(dispatchResult.matchedWebhooks).toBe(1);
    expect(dispatchResult.deliveries.length).toBe(1);
    expect(dispatchResult.deliveries[0].success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify HMAC-SHA256 signature
    const headers = interceptedRequest.options.headers;
    expect(headers['x-prettiermails-event']).toBe('campaign.sent');
    const timestamp = headers['x-prettiermails-timestamp'];
    const signature = headers['x-prettiermails-signature'];
    const requestBody = interceptedRequest.options.body;

    const expectedSignature = crypto
      .createHmac('sha256', customSecret)
      .update(`${timestamp}.${requestBody}`)
      .digest('hex');

    expect(signature).toBe(expectedSignature);

    // Verify delivery logged in database
    const deliveries = await listWebhookDeliveries(hook.id);
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].event_name).toBe('campaign.sent');
    expect(deliveries[0].response_status).toBe(200);
    expect(deliveries[0].error_message).toBeNull();
  });

  it('handles and logs webhook delivery failures gracefully', async () => {
    const hook = await createWebhook({
      workspaceId: ws,
      url: 'https://failing-endpoint.local/webhook',
      events: ['*'],
      isActive: true,
    });

    const mockFailingFetch = vi.fn(async () => {
      throw new Error('Connection refused (ECONNREFUSED)');
    });

    const result = await dispatchWebhookEvent(ws, 'system.alert', { msg: 'High CPU' }, {
      fetchFn: mockFailingFetch,
    });

    expect(result.deliveries[0].success).toBe(false);
    expect(result.deliveries[0].responseStatus).toBe(500);

    const deliveries = await listWebhookDeliveries(hook.id);
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].response_status).toBe(500);
    expect(deliveries[0].error_message).toContain('ECONNREFUSED');
  });
});
