import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders } from '../server/src/db/seeders.js';
import smtpRouter from '../server/src/routes/smtp.js';
import auditRouter from '../server/src/routes/audit.js';
import { signToken } from '../server/src/utils/crypto.js';

describe('SMTP & Audit REST API Endpoints', () => {
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
    app.use('/api/smtp-accounts', smtpRouter);
    app.use('/api/audit-logs', auditRouter);

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

  it('creates, lists, sets default, and deletes an SMTP account via REST API', async () => {
    // 1. Create SMTP Account
    const createRes = await fetch(`${baseUrl}/api/smtp-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        label: 'API Test SMTP',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        authUser: 'test@example.com',
        password: 'AppPassword1234',
        fromName: 'Test Bot',
        fromEmail: 'test@example.com',
        isDefault: true,
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toMatch(/^smtp-/);
    expect(created.label).toBe('API Test SMTP');
    expect(created.hasPassword).toBe(true);
    expect(created.password).toBeUndefined();

    const accountId = created.id;

    // 2. List Accounts
    const listRes = await fetch(`${baseUrl}/api/smtp-accounts`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': workspaceId,
      },
    });

    expect(listRes.status).toBe(200);
    const accounts = await listRes.json();
    expect(Array.isArray(accounts)).toBe(true);
    const found = accounts.find((a) => a.id === accountId);
    expect(found).toBeDefined();
    expect(found.hasPassword).toBe(true);
    expect(found.password).toBeUndefined();

    // 3. Set Default
    const defaultRes = await fetch(`${baseUrl}/api/smtp-accounts/${accountId}/default`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': workspaceId,
      },
    });
    expect(defaultRes.status).toBe(200);
    const updatedDefault = await defaultRes.json();
    expect(Boolean(updatedDefault.is_default)).toBe(true);

    // 4. Delete Account
    const deleteRes = await fetch(`${baseUrl}/api/smtp-accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': workspaceId,
      },
    });
    expect(deleteRes.status).toBe(200);
    const deleteJson = await deleteRes.json();
    expect(deleteJson.success).toBe(true);

    // 5. Verify Audit Logs recorded actions
    const auditRes = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': workspaceId,
      },
    });
    expect(auditRes.status).toBe(200);
    const logs = await auditRes.json();
    expect(Array.isArray(logs)).toBe(true);

    const hasCreatedLog = logs.some((l) => l.action === 'smtp_account.created');
    const hasDeletedLog = logs.some((l) => l.action === 'smtp_account.deleted');
    expect(hasCreatedLog).toBe(true);
    expect(hasDeletedLog).toBe(true);
  });
});
