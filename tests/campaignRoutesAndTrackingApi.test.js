import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders } from '../server/src/db/seeders.js';
import campaignsRouter from '../server/src/routes/campaigns.js';
import trackingRouter from '../server/src/routes/tracking.js';
import { signToken } from '../server/src/utils/crypto.js';

describe('Campaigns & Public Tracking REST API Endpoints', () => {
  let server;
  let baseUrl;
  let adminToken;
  const workspaceId = 'ws-default';

  beforeAll(async () => {
    process.env.DB_ENGINE = 'memory';
    await runMigrations();
    await runSeeders();

    adminToken = signToken({
      userId: 'usr-admin',
      email: 'admin@prettiermails.local',
      role: 'owner',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/campaigns', campaignsRouter);
    app.use('/api/track', trackingRouter);

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
  });

  it('performs full campaign lifecycle, public pixel tracking, click redirect, and stats calculation', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-workspace-id': workspaceId,
    };

    // 1. Create a campaign
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Campaña Primavera 2026',
        subject: 'Descubre las novedades para {{first_name}}',
        htmlContent: '<h1>Hola {{first_name}}</h1><a href="https://example.com/promo">Ver Oferta</a>',
        fromName: 'Equipo PrettierMails',
      }),
    });

    expect(createRes.status).toBe(201);
    const campaign = await createRes.json();
    expect(campaign.id).toMatch(/^cmp-/);
    expect(campaign.name).toBe('Campaña Primavera 2026');
    expect(campaign.status).toBe('draft');

    const campaignId = campaign.id;

    // 2. List campaigns
    const listRes = await fetch(`${baseUrl}/api/campaigns`, {
      headers,
    });
    expect(listRes.status).toBe(200);
    const campaignList = await listRes.json();
    expect(Array.isArray(campaignList)).toBe(true);
    const found = campaignList.find((c) => c.id === campaignId);
    expect(found).toBeDefined();

    // 3. Get single campaign
    const getRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      headers,
    });
    expect(getRes.status).toBe(200);
    const fetchedCampaign = await getRes.json();
    expect(fetchedCampaign.id).toBe(campaignId);
    expect(fetchedCampaign.subject).toBe('Descubre las novedades para {{first_name}}');

    // 4. Update campaign
    const updateRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        subject: 'Asunto Actualizado!',
      }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.subject).toBe('Asunto Actualizado!');

    // 5. Test Public Tracking Pixel (GET /api/track/open/:campaignId/:contactId)
    const pixelRes = await fetch(`${baseUrl}/api/track/open/${campaignId}/ct-subscriber-1`);
    expect(pixelRes.status).toBe(200);
    expect(pixelRes.headers.get('content-type')).toBe('image/gif');
    expect(pixelRes.headers.get('cache-control')).toContain('no-cache');
    const pixelBuf = await pixelRes.arrayBuffer();
    expect(pixelBuf.byteLength).toBe(42);

    // 6. Test Public Click Tracking (GET /api/track/click/:campaignId/:contactId?url=...)
    // 6a. Malicious redirect should be rejected
    const badClickRes = await fetch(
      `${baseUrl}/api/track/click/${campaignId}/ct-subscriber-1?url=${encodeURIComponent('javascript:alert(1)')}`,
      { redirect: 'manual' }
    );
    expect(badClickRes.status).toBe(400);

    // 6b. Safe HTTP redirect should return 302
    const safeTarget = 'https://example.com/promo';
    const clickRes = await fetch(
      `${baseUrl}/api/track/click/${campaignId}/ct-subscriber-1?url=${encodeURIComponent(safeTarget)}`,
      { redirect: 'manual' }
    );
    expect(clickRes.status).toBe(302);
    expect(clickRes.headers.get('location')).toBe(safeTarget);

    // 7. Verify Campaign Stats reflects tracking activity
    const statsRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}/stats`, {
      headers,
    });
    expect(statsRes.status).toBe(200);
    const stats = await statsRes.json();
    expect(stats.campaignId).toBe(campaignId);
    expect(stats.metrics.opened).toBeGreaterThanOrEqual(1);
    expect(stats.metrics.clicked).toBeGreaterThanOrEqual(1);
    expect(stats.topUrls).toEqual(
      expect.arrayContaining([expect.objectContaining({ url: safeTarget, count: 1 })])
    );

    // 8. Delete campaign
    const deleteRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers,
    });
    expect(deleteRes.status).toBe(200);
    const delResult = await deleteRes.json();
    expect(delResult.success).toBe(true);

    // Verify 404 after deletion
    const afterDeleteRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      headers,
    });
    expect(afterDeleteRes.status).toBe(404);
  });
});
