import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getDbPool,
  executeQuery,
  getActiveEngine,
  resetConnectionForTesting,
} from '../server/src/db/connection.js';

describe('Database Connection Layer (MySQL / PostgreSQL / Memory Fallback)', () => {
  beforeEach(() => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('initializes the database pool with active engine', async () => {
    const pool = await getDbPool();
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
    expect(getActiveEngine()).toBe('memory');
  });

  it('executes INSERT, SELECT, UPDATE and DELETE queries with parameter binding', async () => {
    // 1. Insert
    const insertRes = await executeQuery(
      'INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)',
      ['ws-test-1', 'Test Workspace', 'test-ws']
    );
    expect(insertRes.rowCount).toBe(1);

    // 2. Select
    const selectRes = await executeQuery(
      'SELECT * FROM workspaces WHERE id = ?',
      ['ws-test-1']
    );
    expect(selectRes.rows.length).toBe(1);
    expect(selectRes.rows[0].id).toBe('ws-test-1');
    expect(selectRes.rows[0].name).toBe('Test Workspace');

    // 3. Update
    const updateRes = await executeQuery(
      'UPDATE workspaces SET name = ? WHERE id = ?',
      ['Renamed Workspace', 'ws-test-1']
    );
    expect(updateRes.rowCount).toBe(1);

    const reselect = await executeQuery(
      'SELECT * FROM workspaces WHERE id = ?',
      ['ws-test-1']
    );
    expect(reselect.rows[0].name).toBe('Renamed Workspace');

    // 4. Delete
    const deleteRes = await executeQuery(
      'DELETE FROM workspaces WHERE id = ?',
      ['ws-test-1']
    );
    expect(deleteRes.rowCount).toBe(1);

    const emptyRes = await executeQuery(
      'SELECT * FROM workspaces WHERE id = ?',
      ['ws-test-1']
    );
    expect(emptyRes.rows.length).toBe(0);
  });
});
