import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  createCampaignLog,
  updateCampaignLog,
  getCampaignLogs,
  recordCampaignOpen,
  recordCampaignClick,
  getCampaignStats,
} from '../server/src/db/campaignRepository.js';

describe('Campaigns & Analytics Repository', () => {
  const ws1 = 'ws-company-1';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('creates, retrieves, updates, and lists campaigns in workspace', async () => {
    const campaign = await createCampaign({
      workspaceId: ws1,
      name: 'Black Friday 2026',
      subject: '¡50% de Descuento Hoy!',
      fromName: 'PrettierMails Store',
      htmlContent: '<h1>Oferta</h1><a href="https://store.com/buy">Comprar</a>',
    });

    expect(campaign).toBeDefined();
    expect(campaign.id).toMatch(/^cmp-/);
    expect(campaign.name).toBe('Black Friday 2026');
    expect(campaign.status).toBe('draft');

    // Update campaign
    const updated = await updateCampaign(campaign.id, ws1, {
      subject: '¡Últimas horas 50%!',
      status: 'queued',
      totalRecipients: 150,
    });
    expect(updated.subject).toBe('¡Últimas horas 50%!');
    expect(updated.status).toBe('queued');
    expect(updated.total_recipients).toBe(150);

    // List campaigns
    const list = await listCampaigns(ws1);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(campaign.id);
  });

  it('manages recipient delivery logs', async () => {
    const campaign = await createCampaign({
      workspaceId: ws1,
      name: 'Newsletter #1',
      subject: 'Resumen Semanal',
    });

    const log = await createCampaignLog({
      campaignId: campaign.id,
      contactId: 'ct-1',
      recipientEmail: 'reader1@example.com',
      status: 'queued',
    });

    expect(log).toBeDefined();
    expect(log.status).toBe('queued');
    expect(log.recipient_email).toBe('reader1@example.com');

    // Update log to sent
    const updatedLog = await updateCampaignLog(log.id, {
      status: 'sent',
      messageId: 'msg-test-123',
      sentAt: new Date().toISOString(),
    });
    expect(updatedLog.status).toBe('sent');
    expect(updatedLog.message_id).toBe('msg-test-123');

    const logs = await getCampaignLogs(campaign.id);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('sent');
  });

  it('records opens, clicks, and computes comprehensive campaign statistics', async () => {
    const campaign = await createCampaign({
      workspaceId: ws1,
      name: 'Summer Sale',
      subject: 'Rebajas de Verano',
      htmlContent: '<p>Rebajas</p>',
    });

    // Create 2 logs
    await createCampaignLog({
      campaignId: campaign.id,
      contactId: 'ct-user-1',
      recipientEmail: 'user1@shop.com',
      status: 'sent',
    });

    await createCampaignLog({
      campaignId: campaign.id,
      contactId: 'ct-user-2',
      recipientEmail: 'user2@shop.com',
      status: 'sent',
    });

    await updateCampaign(campaign.id, ws1, {
      status: 'completed',
      totalRecipients: 2,
      sentCount: 2,
      deliveredCount: 2,
    });

    // Record open for user 1
    await recordCampaignOpen(campaign.id, 'ct-user-1', {
      ipAddress: '192.0.2.1',
      userAgent: 'Mozilla/5.0 Test',
    });

    // Record click for user 1
    await recordCampaignClick(campaign.id, 'ct-user-1', 'https://shop.com/summer-items', {
      ipAddress: '192.0.2.1',
      userAgent: 'Mozilla/5.0 Test',
    });

    const stats = await getCampaignStats(campaign.id, ws1);
    expect(stats).toBeDefined();
    expect(stats.metrics.total).toBe(2);
    expect(stats.metrics.delivered).toBe(2);
    expect(stats.metrics.opened).toBe(1);
    expect(stats.metrics.clicked).toBe(1);
    expect(stats.metrics.openRate).toBe(50); // 1 out of 2 = 50%
    expect(stats.metrics.clickRate).toBe(50); // 1 out of 2 = 50%
    expect(stats.metrics.clickToOpenRate).toBe(100); // 1 click out of 1 open = 100%
    expect(stats.topUrls.length).toBe(1);
    expect(stats.topUrls[0].url).toBe('https://shop.com/summer-items');
    expect(stats.topUrls[0].count).toBe(1);
  });

  it('deletes a campaign and cascades associated records', async () => {
    const campaign = await createCampaign({
      workspaceId: ws1,
      name: 'Campaña a Borrar',
      subject: 'Prueba',
    });

    await createCampaignLog({
      campaignId: campaign.id,
      recipientEmail: 'del@test.com',
    });

    await recordCampaignOpen(campaign.id, 'anon');

    const res = await deleteCampaign(campaign.id, ws1);
    expect(res.success).toBe(true);

    const check = await getCampaignById(campaign.id, ws1);
    expect(check).toBeNull();

    const remainingLogs = await getCampaignLogs(campaign.id);
    expect(remainingLogs.length).toBe(0);
  });
});
