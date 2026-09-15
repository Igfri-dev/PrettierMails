import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting, executeQuery } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders, DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID } from '../server/src/db/seeders.js';
import templateRepo from '../server/src/db/templateRepository.js';

describe('Database Migrations & Seeders Engine', () => {
  beforeEach(() => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('executes migrations and creates all core tables idempotently', async () => {
    const res1 = await runMigrations();
    expect(res1.success).toBe(true);
    expect(res1.tablesCount).toBe(19);

    // Second run must be safe and idempotent
    const res2 = await runMigrations();
    expect(res2.success).toBe(true);
  });

  it('runs seeders and creates default workspace, admin user, and seed templates', async () => {
    await runMigrations();
    const seedRes = await runSeeders();
    expect(seedRes.success).toBe(true);
    expect(seedRes.seededCount).toBeGreaterThanOrEqual(2);

    // Verify workspace exists
    const ws = await executeQuery('SELECT * FROM workspaces WHERE id = ?', [DEFAULT_WORKSPACE_ID]);
    expect(ws.rows.length).toBe(1);
    expect(ws.rows[0].slug).toBe('default');

    // Verify admin user exists
    const user = await executeQuery('SELECT * FROM users WHERE id = ?', [DEFAULT_USER_ID]);
    expect(user.rows.length).toBe(1);
    expect(user.rows[0].email).toBe('admin@prettiermails.local');

    // Verify seeded templates are readable via templateRepository
    const templates = await templateRepo.listTemplates(DEFAULT_WORKSPACE_ID);
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates.some((t) => t.id === 'tmpl-corporate-onboarding')).toBe(true);
    expect(templates.some((t) => t.id === 'tmpl-youtube-showcase')).toBe(true);
  });
});
