import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import automationsRouter from '../server/src/routes/automations.js';
import webhooksRouter from '../server/src/routes/webhooks.js';
import { signToken } from '../server/src/utils/crypto.js';
import { createWorkspace, addWorkspaceMember } from '../server/src/db/workspaceRepository.js';
import { createUser } from '../server/src/db/userRepository.js';

describe('Automations and Webhooks REST API Routes', () => {
  let server;
  let baseUrl;
  let token;
  let workspaceId;
  let userId;

  beforeAll(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();

    const created = await createUser({
      email: 'ops@prettiermails.com',
      password: 'Password123!',
      name: 'Ops Lead',
    });
    userId = created.user.id;

    const ws = await createWorkspace({
      name: 'Automations Studio WS',
      ownerUserId: userId,
    });
    workspaceId = ws.id;

    await addWorkspaceMember(workspaceId, { email: 'ops@prettiermails.com', role: 'admin' });

    token = signToken({
      userId,
      email: 'ops@prettiermails.com',
      workspaceId,
      role: 'admin',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/automations', automationsRouter);
    app.use('/api/webhooks', webhooksRouter);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    resetConnectionForTesting();
  });

  it('completes the full automation lifecycle: create, add step, trigger, view logs', async () => {
    // 1. Create automation
    const createRes = await fetch(`${baseUrl}/api/automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        name: 'Flujo Bienvenida Usuario Nuevo',
        triggerType: 'contact.subscribed',
        triggerConfig: { tag: 'vip' },
      }),
    });

    expect(createRes.status).toBe(201);
    const createdAuto = await createRes.json();
    expect(createdAuto.success).toBe(true);
    expect(createdAuto.data.id).toMatch(/^auto-/);
    const autoId = createdAuto.data.id;

    // 2. Add step to automation
    const stepRes = await fetch(`${baseUrl}/api/automations/${autoId}/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        stepType: 'send_email',
        stepConfig: { subject: '¡Hola y bienvenido a PrettierMails!' },
        stepOrder: 1,
      }),
    });

    expect(stepRes.status).toBe(201);
    const stepData = await stepRes.json();
    expect(stepData.data.id).toMatch(/^step-/);

    // 3. Trigger event matching automation
    const triggerRes = await fetch(`${baseUrl}/api/automations/trigger-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        eventType: 'contact.subscribed',
        context: { email: 'newmember@client.com' },
      }),
    });

    expect(triggerRes.status).toBe(200);
    const triggerData = await triggerRes.json();
    expect(triggerData.success).toBe(true);
    expect(triggerData.executedCount).toBe(1);

    // 4. View automation logs
    const logsRes = await fetch(`${baseUrl}/api/automations/${autoId}/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });

    expect(logsRes.status).toBe(200);
    const logsData = await logsRes.json();
    expect(logsData.success).toBe(true);
    expect(logsData.data.length).toBeGreaterThanOrEqual(1);
    expect(logsData.data[0].status).toBe('executed');
  });

  it('completes the full webhook lifecycle: create, list, update, dispatch, check deliveries', async () => {
    // 1. Create webhook
    const createRes = await fetch(`${baseUrl}/api/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        url: 'https://httpbin.org/post',
        events: ['contact.subscribed', 'campaign.sent'],
      }),
    });

    expect(createRes.status).toBe(201);
    const createdWh = await createRes.json();
    expect(createdWh.success).toBe(true);
    expect(createdWh.data.id).toMatch(/^wh-/);
    const whId = createdWh.data.id;

    // 2. List webhooks
    const listRes = await fetch(`${baseUrl}/api/webhooks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.data.length).toBe(1);

    // 3. Update webhook
    const updateRes = await fetch(`${baseUrl}/api/webhooks/${whId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        events: ['*'],
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.data.events).toEqual(['*']);

    // 4. Dispatch event
    const dispatchRes = await fetch(`${baseUrl}/api/webhooks/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        eventName: 'campaign.sent',
        payload: { campaignId: 'c123', total: 42 },
      }),
    });

    expect(dispatchRes.status).toBe(200);
    const dispatchData = await dispatchRes.json();
    expect(dispatchData.success).toBe(true);
    expect(dispatchData.data.matchedWebhooks).toBe(1);

    // 5. Check deliveries
    const deliveriesRes = await fetch(`${baseUrl}/api/webhooks/${whId}/deliveries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });

    expect(deliveriesRes.status).toBe(200);
    const deliveriesData = await deliveriesRes.json();
    expect(deliveriesData.data.length).toBe(1);
    expect(deliveriesData.data[0].event_name).toBe('campaign.sent');

    // 6. Delete webhook
    const deleteRes = await fetch(`${baseUrl}/api/webhooks/${whId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });
    expect(deleteRes.status).toBe(200);
  });
});
