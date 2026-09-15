import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { createContact, createContactList, addContactsToList } from '../server/src/db/contactRepository.js';
import { createCampaign, getCampaignById, getCampaignLogs } from '../server/src/db/campaignRepository.js';
import { dispatchCampaign, pauseCampaign } from '../server/src/services/campaignQueue.js';

describe('Campaign Queue & Asynchronous Dispatcher', () => {
  const ws = 'ws-test-queue';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('dispatches campaign to target contact list with personalized content and tracking', async () => {
    // 1. Create List & Contacts
    const list = await createContactList({
      workspaceId: ws,
      name: 'Lista VIP',
    });

    const c1 = await createContact({
      workspaceId: ws,
      email: 'member1@test.com',
      firstName: 'Camila',
      isSubscribed: true,
    });

    const c2 = await createContact({
      workspaceId: ws,
      email: 'member2@test.com',
      firstName: 'Mateo',
      isSubscribed: true,
    });

    await addContactsToList(list.id, [c1.id, c2.id]);

    // 2. Create Campaign
    const campaign = await createCampaign({
      workspaceId: ws,
      contactListId: list.id,
      name: 'Bienvenida VIP',
      subject: 'Hola {{first_name}}!',
      htmlContent: '<h1>Hola {{first_name}}</h1><a href="https://example.com/start">Comenzar</a>',
    });

    // 3. Dispatch
    const dispatchRes = await dispatchCampaign(campaign.id, ws, {
      baseUrl: 'http://localhost:3001',
      rateLimitMs: 10,
    });

    expect(dispatchRes.success).toBe(true);
    expect(dispatchRes.totalRecipients).toBe(2);

    // Wait for queue completion
    if (dispatchRes.processQueuePromise) {
      await dispatchRes.processQueuePromise;
    }

    // 4. Verify campaign finished
    const finishedCampaign = await getCampaignById(campaign.id, ws);
    expect(finishedCampaign.status).toBe('completed');
    expect(finishedCampaign.delivered_count).toBe(2);

    // 5. Verify delivery logs
    const logs = await getCampaignLogs(campaign.id);
    expect(logs.length).toBe(2);
    expect(logs.every((l) => l.status === 'sent')).toBe(true);
  });

  it('handles empty subscriber list gracefully', async () => {
    const emptyList = await createContactList({
      workspaceId: ws,
      name: 'Lista Vacía',
    });

    const campaign = await createCampaign({
      workspaceId: ws,
      contactListId: emptyList.id,
      name: 'Sin Destinatarios',
      subject: 'Prueba',
    });

    await expect(dispatchCampaign(campaign.id, ws)).rejects.toThrow(
      'No hay contactos suscritos para esta campaña.'
    );
  });
});
