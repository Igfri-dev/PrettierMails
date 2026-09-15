import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import {
  acquireTemplateLock,
  renewTemplateLock,
  releaseTemplateLock,
  getTemplateLock,
} from '../server/src/db/lockRepository.js';

describe('Template Locks Repository & Concurrency Control', () => {
  const ws = 'ws-test-locks';
  const templateId = 'tmpl-shared-1';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('allows user 1 to acquire a lock, and rejects concurrent lock by user 2', async () => {
    // 1. User 1 acquires lock
    const u1Res = await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-1',
      userName: 'Lucía Diseñadora',
      ttlSeconds: 60,
    });

    expect(u1Res.acquired).toBe(true);
    expect(u1Res.lock.template_id).toBe(templateId);
    expect(u1Res.lock.user_id).toBe('usr-1');
    expect(u1Res.lock.user_name).toBe('Lucía Diseñadora');

    // 2. User 2 tries to acquire lock on the same template
    const u2Res = await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-2',
      userName: 'Martín Redactor',
      ttlSeconds: 60,
    });

    expect(u2Res.acquired).toBe(false);
    expect(u2Res.lock.user_id).toBe('usr-1');
    expect(u2Res.lock.user_name).toBe('Lucía Diseñadora');

    // 3. Inspect active lock
    const active = await getTemplateLock(templateId, ws);
    expect(active).not.toBeNull();
    expect(active.user_id).toBe('usr-1');
  });

  it('allows the lock owner to renew and release the lock', async () => {
    await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-1',
      userName: 'Lucía',
      ttlSeconds: 30,
    });

    // Renew
    const renewRes = await renewTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-1',
      ttlSeconds: 60,
    });
    expect(renewRes.renewed).toBe(true);

    // Release
    const relRes = await releaseTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-1',
    });
    expect(relRes.released).toBe(true);

    // After release, lock should be null
    const activeAfterRel = await getTemplateLock(templateId, ws);
    expect(activeAfterRel).toBeNull();

    // Now User 2 can acquire it
    const u2Res = await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-2',
      userName: 'Martín',
      ttlSeconds: 60,
    });
    expect(u2Res.acquired).toBe(true);
  });

  it('automatically allows re-acquisition if previous lock has expired', async () => {
    // Acquire with TTL of -10 seconds (already expired)
    await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-old',
      userName: 'Usuario Inactivo',
      ttlSeconds: -10,
    });

    // Active check returns null for expired lock
    const active = await getTemplateLock(templateId, ws);
    expect(active).toBeNull();

    // User 2 acquires lock because previous lock is expired
    const newLockRes = await acquireTemplateLock({
      templateId,
      workspaceId: ws,
      userId: 'usr-new',
      userName: 'Nuevo Editor',
      ttlSeconds: 60,
    });

    expect(newLockRes.acquired).toBe(true);
    expect(newLockRes.lock.user_id).toBe('usr-new');
  });
});
