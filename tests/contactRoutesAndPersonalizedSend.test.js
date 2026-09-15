import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders } from '../server/src/db/seeders.js';
import contactsRouter from '../server/src/routes/contacts.js';
import { signToken } from '../server/src/utils/crypto.js';
import { interpolateTemplate } from '../server/src/utils/templateInterpolator.js';

describe('Contacts & Audience REST API Endpoints', () => {
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
    app.use('/api/contacts', contactsRouter);

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

  it('performs full contact lifecycle, list management, and CSV import via REST API', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-workspace-id': workspaceId,
    };

    // 1. Create a Contact List
    const createListRes = await fetch(`${baseUrl}/api/contacts/lists`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Beta Testers 2026',
        description: 'Grupo exclusivo de usuarios',
      }),
    });
    expect(createListRes.status).toBe(201);
    const createdList = await createListRes.json();
    expect(createdList.id).toMatch(/^list-/);
    expect(createdList.name).toBe('Beta Testers 2026');

    // 2. Import Contacts from CSV into this list
    const csvContent = `email,nombre,apellido,empresa
tester1@acme.com,Elena,García,Acme Corp
tester2@beta.org,Pablo,Ríos,Beta Labs`;

    const importRes = await fetch(`${baseUrl}/api/contacts/import-csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvText: csvContent,
        targetListId: createdList.id,
      }),
    });
    expect(importRes.status).toBe(200);
    const importData = await importRes.json();
    expect(importData.success).toBe(true);
    expect(importData.createdCount).toBe(2);

    // 3. List Contacts with List Filter
    const listContactsRes = await fetch(
      `${baseUrl}/api/contacts?listId=${encodeURIComponent(createdList.id)}`,
      { headers }
    );
    expect(listContactsRes.status).toBe(200);
    const members = await listContactsRes.json();
    expect(members.length).toBe(2);
    expect(members[0].first_name).toBeDefined();

    // 4. Test Variable Personalization on Member Data
    const elena = members.find((m) => m.email === 'tester1@acme.com');
    expect(elena).toBeDefined();
    const templateHtml = '<h1>Hola {{first_name}}</h1><p>Bienvenido a {{custom.empresa}}</p>';
    const personalized = interpolateTemplate(templateHtml, elena);
    expect(personalized).toBe('<h1>Hola Elena</h1><p>Bienvenido a Acme Corp</p>');

    // 5. Update Contact
    const updateRes = await fetch(`${baseUrl}/api/contacts/${encodeURIComponent(elena.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        firstName: 'Elena María',
        isSubscribed: false,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updatedContact = await updateRes.json();
    expect(updatedContact.first_name).toBe('Elena María');
    expect(updatedContact.is_subscribed).toBe(false);

    // 6. Delete Contact
    const pablo = members.find((m) => m.email === 'tester2@beta.org');
    const delRes = await fetch(`${baseUrl}/api/contacts/${encodeURIComponent(pablo.id)}`, {
      method: 'DELETE',
      headers,
    });
    expect(delRes.status).toBe(200);
  });

  it('creates contact directly assigned to a list and verifies membership and enriched lists', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-workspace-id': workspaceId,
    };

    // 1. Create a list
    const createListRes = await fetch(`${baseUrl}/api/contacts/lists`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Direct Enrolled List',
        description: 'Test list',
      }),
    });
    const listData = await createListRes.json();

    // 2. Create contact directly with listId
    const createContactRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'direct@acme.com',
        firstName: 'Carlos',
        lastName: 'Santana',
        listId: listData.id,
      }),
    });
    expect(createContactRes.status).toBe(201);

    // 3. Query contacts in that list
    const listMembersRes = await fetch(
      `${baseUrl}/api/contacts?listId=${encodeURIComponent(listData.id)}`,
      { headers }
    );
    const members = await listMembersRes.json();
    expect(members.length).toBe(1);
    expect(members[0].email).toBe('direct@acme.com');
    expect(members[0].lists).toBeDefined();
    expect(members[0].lists.some((l) => l.id === listData.id)).toBe(true);
  });
});
