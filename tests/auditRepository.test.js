import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '../server/src/db/migrations.js';
import { recordAuditEvent, listAuditEvents } from '../server/src/db/auditRepository.js';

describe('Audit Repository & Operational Logging', () => {
  beforeEach(async () => {
    await runMigrations();
  });

  it('records audit events and retrieves them with parsed metadata', async () => {
    const wsId = 'ws-audit-test-1';

    const event = await recordAuditEvent({
      workspaceId: wsId,
      userId: 'usr-123',
      action: 'smtp_account.created',
      resourceType: 'smtp_account',
      resourceId: 'smtp-999',
      metadata: {
        host: 'smtp.sendgrid.net',
        port: 587,
      },
      ipAddress: '192.0.2.1',
    });

    expect(event.id).toMatch(/^audit-/);
    expect(event.action).toBe('smtp_account.created');

    const logs = await listAuditEvents(wsId);
    expect(logs.length).toBeGreaterThan(0);

    const logged = logs.find((l) => l.id === event.id);
    expect(logged).toBeDefined();
    expect(logged.action).toBe('smtp_account.created');
    expect(logged.resource_type).toBe('smtp_account');
    expect(logged.metadata).toEqual({
      host: 'smtp.sendgrid.net',
      port: 587,
    });
    expect(logged.ip_address).toBe('192.0.2.1');
  });

  it('enforces multi-tenancy isolation for audit logs', async () => {
    const ws1 = 'ws-audit-tenant-1';
    const ws2 = 'ws-audit-tenant-2';

    await recordAuditEvent({
      workspaceId: ws1,
      action: 'email.sent',
      resourceType: 'email',
      metadata: { count: 5 },
    });

    await recordAuditEvent({
      workspaceId: ws2,
      action: 'email.sent',
      resourceType: 'email',
      metadata: { count: 12 },
    });

    const logs1 = await listAuditEvents(ws1);
    const logs2 = await listAuditEvents(ws2);

    expect(logs1.every((l) => l.workspace_id === ws1)).toBe(true);
    expect(logs2.every((l) => l.workspace_id === ws2)).toBe(true);
  });
});
