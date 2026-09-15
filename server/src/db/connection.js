import mysql from 'mysql2/promise';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let activeEngine = process.env.DB_ENGINE || 'mysql';
let pool = null;
let memoryDb = null;

function matchesWhere(item, whereClause, whereParams) {
  if (!whereClause) return true;
  const conditions = whereClause.split(/\s+AND\s+/i);
  return conditions.every((cond, idx) => {
    const val = whereParams[idx];
    if (val === undefined) return true;
    const m = cond.match(/\b([a-zA-Z0-9_]+)\s*(=|!=|<>)\s*\?/i);
    if (!m) return true;
    const field = m[1].toLowerCase();
    const op = m[2];
    const itemVal = item[field];
    if (op === '=') {
      if (typeof itemVal === 'boolean') return Boolean(itemVal) === Boolean(val);
      return String(itemVal) === String(val);
    }
    if (op === '!=' || op === '<>') {
      return String(itemVal) !== String(val);
    }
    return true;
  });
}

/**
 * Lightweight in-memory database store for test and offline development environments
 */
function createMemoryDb() {
  const tables = {
    workspaces: [],
    users: [],
    workspace_members: [],
    templates: [],
    template_versions: [],
    smtp_accounts: [],
    audit_logs: [],
    contacts: [],
    contact_lists: [],
    contact_list_members: [],
    campaigns: [],
    campaign_logs: [],
    campaign_events: [],
  };

  return {
    tables,
    query(sql, params = []) {
      const trimmed = sql.trim();

      // DDL statements (no-op in memory)
      if (/^CREATE\s+/i.test(trimmed) || /^ALTER\s+/i.test(trimmed) || /^DROP\s+/i.test(trimmed)) {
        return { rows: [], rowCount: 0 };
      }

      // INSERT INTO table (col1, col2) VALUES (?, ?)
      const insertMatch = trimmed.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (insertMatch) {
        const tableName = insertMatch[1].toLowerCase();
        const columns = insertMatch[2].split(',').map((c) => c.trim());
        const targetTable = tables[tableName] || (tables[tableName] = []);

        const record = {};
        columns.forEach((col, idx) => {
          let val = params[idx];
          if (typeof val === 'string' && (
            col === 'blocks' ||
            col === 'global_settings' ||
            col === 'metadata' ||
            col === 'custom_fields' ||
            col === 'trigger_config' ||
            col === 'step_config' ||
            col === 'events' ||
            col === 'payload' ||
            col === 'details'
          )) {
            try {
              val = JSON.parse(val);
            } catch {
              // keep as is
            }
          }
          record[col] = val;
        });

        if (!record.created_at) record.created_at = new Date().toISOString();
        if (!record.updated_at) record.updated_at = new Date().toISOString();

        targetTable.push(record);
        return { rows: [record], rowCount: 1, insertId: record.id };
      }

      // SELECT queries
      const selectMatch = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+|\?))?(?:\s+OFFSET\s+(\d+|\?))?$/i);
      if (selectMatch) {
        const tableName = selectMatch[2].toLowerCase();
        let list = [...(tables[tableName] || [])];

        const whereClause = selectMatch[3];
        if (whereClause) {
          list = list.filter((item) => matchesWhere(item, whereClause, params));
        }

        // ORDER BY
        const orderBy = selectMatch[4];
        if (orderBy) {
          const isDesc = /desc/i.test(orderBy);
          if (/is_default/i.test(orderBy)) {
            list.sort((a, b) => {
              const valA = a.is_default ? 1 : 0;
              const valB = b.is_default ? 1 : 0;
              if (valA !== valB) {
                return isDesc ? valB - valA : valA - valB;
              }
              return new Date(b.created_at) - new Date(a.created_at);
            });
          } else if (/version_number/i.test(orderBy)) {
            list.sort((a, b) => (isDesc ? b.version_number - a.version_number : a.version_number - b.version_number));
          } else if (/created_at/i.test(orderBy)) {
            list.sort((a, b) => (isDesc ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)));
          } else if (/updated_at/i.test(orderBy)) {
            list.sort((a, b) => (isDesc ? new Date(b.updated_at) - new Date(a.updated_at) : new Date(a.updated_at) - new Date(b.updated_at)));
          }
        }

        // LIMIT & OFFSET
        const limitVal = selectMatch[5] ? parseInt(selectMatch[5], 10) : null;
        const offsetVal = selectMatch[6] ? parseInt(selectMatch[6], 10) : 0;
        if (limitVal !== null && !isNaN(limitVal)) {
          list = list.slice(offsetVal, offsetVal + limitVal);
        }

        // Deep copy rows to prevent external mutation
        const clonedRows = JSON.parse(JSON.stringify(list));
        return { rows: clonedRows, rowCount: clonedRows.length };
      }

      // UPDATE table SET col1 = ?, col2 = ? WHERE ...
      const updateMatch = trimmed.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+)$/i);
      if (updateMatch) {
        const tableName = updateMatch[1].toLowerCase();
        const setParts = updateMatch[2].split(',').map((s) => s.trim().split('=')[0].trim());
        const whereClause = updateMatch[3];
        const targetTable = tables[tableName] || [];
        const whereParams = params.slice(setParts.length);

        let count = 0;
        targetTable.forEach((item) => {
          if (matchesWhere(item, whereClause, whereParams)) {
            setParts.forEach((col, idx) => {
              let val = params[idx];
              if (typeof val === 'string' && (
                col === 'blocks' ||
                col === 'global_settings' ||
                col === 'metadata' ||
                col === 'custom_fields' ||
                col === 'trigger_config' ||
                col === 'step_config' ||
                col === 'events' ||
                col === 'payload' ||
                col === 'details'
              )) {
                try {
                  val = JSON.parse(val);
                } catch {
                  // ignore
                }
              }
              item[col] = val;
            });
            item.updated_at = new Date().toISOString();
            count++;
          }
        });

        return { rows: [], rowCount: count };
      }

      // DELETE FROM table WHERE ...
      const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+([\s\S]+)$/i);
      if (deleteMatch) {
        const tableName = deleteMatch[1].toLowerCase();
        const whereClause = deleteMatch[2];
        const initialLength = (tables[tableName] || []).length;

        tables[tableName] = (tables[tableName] || []).filter((item) => !matchesWhere(item, whereClause, params));

        return { rows: [], rowCount: initialLength - (tables[tableName] || []).length };
      }

      return { rows: [], rowCount: 0 };
    },
  };
}

/**
 * Initialize connection pool according to active DB_ENGINE
 */
export async function getDbPool() {
  if (pool) return pool;

  const engine = (process.env.DB_ENGINE || 'mysql').toLowerCase();
  activeEngine = engine;

  if (engine === 'memory') {
    memoryDb = createMemoryDb();
    pool = {
      query: (sql, params) => Promise.resolve(memoryDb.query(sql, params)),
      end: () => Promise.resolve(),
      isMemory: true,
    };
    return pool;
  }

  if (engine === 'postgresql' || engine === 'postgres') {
    try {
      const pgPool = new pg.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'prettier_mails',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      await pgPool.query('SELECT 1');
      pool = pgPool;
      return pool;
    } catch (err) {
      console.warn(`[DB] Could not connect to PostgreSQL (${err.message}). Using memory fallback.`);
      activeEngine = 'memory';
      memoryDb = createMemoryDb();
      pool = {
        query: (sql, params) => Promise.resolve(memoryDb.query(sql, params)),
        end: () => Promise.resolve(),
        isMemory: true,
      };
      return pool;
    }
  }

  // Default: MySQL
  const dbName = process.env.DB_NAME || 'prettier_mails';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  try {
    const mysqlPool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: dbSsl,
      connectTimeout: 2000,
    });

    try {
      const conn = await mysqlPool.getConnection();
      conn.release();
    } catch (connErr) {
      if (connErr.code === 'ER_BAD_DB_ERROR' || (connErr.message && connErr.message.includes('Unknown database'))) {
        console.log(`[DB] Base de datos "${dbName}" no encontrada en MySQL. Creándola automáticamente...`);
        const tempConn = await mysql.createConnection({
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          ssl: dbSsl,
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempConn.end();
        console.log(`[DB] Base de datos "${dbName}" creada con éxito.`);

        const connRetry = await mysqlPool.getConnection();
        connRetry.release();
      } else {
        throw connErr;
      }
    }

    pool = mysqlPool;
    return pool;
  } catch (err) {
    console.warn(`[DB] Could not connect to MySQL (${err.message}). Using memory fallback.`);
    activeEngine = 'memory';
    memoryDb = createMemoryDb();
    pool = {
      query: (sql, params) => Promise.resolve(memoryDb.query(sql, params)),
      end: () => Promise.resolve(),
      isMemory: true,
    };
    return pool;
  }
}

/**
 * Universal Query Executor
 * Automatically converts '?' placeholders to '$1, $2...' for PostgreSQL.
 * @param {string} sql
 * @param {Array<any>} params
 * @returns {Promise<{ rows: Array<any>, rowCount: number, insertId?: any }>}
 */
export async function executeQuery(sql, params = []) {
  const currentPool = await getDbPool();

  if (currentPool.isMemory) {
    return memoryDb.query(sql, params);
  }

  if (activeEngine === 'postgresql' || activeEngine === 'postgres') {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    const res = await currentPool.query(pgSql, params);
    return {
      rows: res.rows || [],
      rowCount: res.rowCount || 0,
      insertId: res.rows?.[0]?.id,
    };
  }

  // MySQL Execution
  const [rows, fields] = await currentPool.query(sql, params);
  const rowCount = Array.isArray(rows) ? rows.length : rows.affectedRows || 0;
  const insertId = rows.insertId || undefined;

  return {
    rows: Array.isArray(rows) ? rows : [],
    rowCount,
    insertId,
    fields,
  };
}

export function getActiveEngine() {
  return activeEngine;
}

export function resetConnectionForTesting() {
  if (pool && typeof pool.end === 'function') {
    pool.end().catch(() => {});
  }
  pool = null;
  memoryDb = null;
}

export default {
  getDbPool,
  executeQuery,
  getActiveEngine,
  resetConnectionForTesting,
};
