import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders } from '../server/src/db/seeders.js';
import { createUser } from '../server/src/db/userRepository.js';
import { addWorkspaceMember } from '../server/src/db/workspaceRepository.js';
import templatesRouter from '../server/src/routes/templates.js';
import { signToken } from '../server/src/utils/crypto.js';

describe('Template Locks REST API Endpoints', () => {
  let server;
  let baseUrl;
  let tokenUser1;
  let tokenUser2;
  let user1;
  let user2;
  const workspaceId = 'ws-default';
  const templateId = 'tmpl-collab-1';

  beforeAll(async () => {
    process.env.DB_ENGINE = 'memory';
    await runMigrations();
    await runSeeders();

    user1 = await createUser({
      email: 'alice@company.com',
      password: 'Password123!',
      name: 'Alice Cooper',
    });

    user2 = await createUser({
      email: 'bob@company.com',
      password: 'Password123!',
      name: 'Bob Dylan',
    });

    await addWorkspaceMember(workspaceId, { email: 'alice@company.com', role: 'editor' });
    await addWorkspaceMember(workspaceId, { email: 'bob@company.com', role: 'editor' });

    tokenUser1 = signToken({
      userId: user1.user.id,
      email: 'alice@company.com',
      name: 'Alice Cooper',
      role: 'editor',
    });

    tokenUser2 = signToken({
      userId: user2.user.id,
      email: 'bob@company.com',
      name: 'Bob Dylan',
      role: 'editor',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/templates', templatesRouter);

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

  it('manages collaborative presence, lock acquisition, conflict reporting, and release', async () => {
    const headersUser1 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
      'x-workspace-id': workspaceId,
    };

    const headersUser2 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser2}`,
      'x-workspace-id': workspaceId,
    };

    // 1. Initial lock status should be unlocked
    const initLockRes = await fetch(`${baseUrl}/api/templates/${templateId}/lock`, {
      headers: headersUser1,
    });
    expect(initLockRes.status).toBe(200);
    const initLockData = await initLockRes.json();
    expect(initLockData.locked).toBe(false);

    // 2. User 1 acquires lock
    const acquireRes1 = await fetch(`${baseUrl}/api/templates/${templateId}/lock`, {
      method: 'POST',
      headers: headersUser1,
      body: JSON.stringify({ ttlSeconds: 60 }),
    });
    expect(acquireRes1.status).toBe(200);
    const acquireData1 = await acquireRes1.json();
    expect(acquireData1.success).toBe(true);
    expect(acquireData1.acquired).toBe(true);
    expect(acquireData1.lock.user_id).toBe(user1.user.id);

    // 3. User 2 tries to acquire lock on same template -> Conflict (409)
    const acquireRes2 = await fetch(`${baseUrl}/api/templates/${templateId}/lock`, {
      method: 'POST',
      headers: headersUser2,
      body: JSON.stringify({ ttlSeconds: 60 }),
    });
    expect(acquireRes2.status).toBe(409);
    const acquireData2 = await acquireRes2.json();
    expect(acquireData2.acquired).toBe(false);
    expect(acquireData2.message).toContain('Alice Cooper');

    // 4. User 1 sends heartbeat to renew
    const heartbeatRes = await fetch(`${baseUrl}/api/templates/${templateId}/heartbeat`, {
      method: 'POST',
      headers: headersUser1,
      body: JSON.stringify({ ttlSeconds: 120 }),
    });
    expect(heartbeatRes.status).toBe(200);
    const heartbeatData = await heartbeatRes.json();
    expect(heartbeatData.renewed).toBe(true);

    // 5. User 1 unlocks template
    const unlockRes = await fetch(`${baseUrl}/api/templates/${templateId}/unlock`, {
      method: 'POST',
      headers: headersUser1,
    });
    expect(unlockRes.status).toBe(200);
    const unlockData = await unlockRes.json();
    expect(unlockData.released).toBe(true);

    // 6. User 2 can now acquire the lock
    const acquireRes2After = await fetch(`${baseUrl}/api/templates/${templateId}/lock`, {
      method: 'POST',
      headers: headersUser2,
      body: JSON.stringify({ ttlSeconds: 60 }),
    });
    expect(acquireRes2After.status).toBe(200);
    const acquireData2After = await acquireRes2After.json();
    expect(acquireData2After.acquired).toBe(true);
    expect(acquireData2After.lock.user_id).toBe(user2.user.id);
  });
});
