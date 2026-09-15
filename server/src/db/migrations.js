import { executeQuery, getActiveEngine } from './connection.js';

/**
 * Migration Definitions for MySQL and PostgreSQL
 */
export async function runMigrations() {
  const engine = getActiveEngine();
  const isMysql = engine === 'mysql';

  const tableSuffix = isMysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;' : ';';

  const ddlStatements = [
    // 1. Workspaces
    `CREATE TABLE IF NOT EXISTS workspaces (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 2. Users
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 3. Workspace Members
    `CREATE TABLE IF NOT EXISTS workspace_members (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'editor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 4. Templates
    `CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(255),
      preview_text VARCHAR(255),
      thumbnail_url TEXT,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_by VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 5. Template Versions
    `CREATE TABLE IF NOT EXISTS template_versions (
      id VARCHAR(64) PRIMARY KEY,
      template_id VARCHAR(64) NOT NULL,
      version_number INT NOT NULL,
      subject VARCHAR(255),
      preview_text VARCHAR(255),
      global_settings JSON NOT NULL,
      blocks JSON NOT NULL,
      change_summary VARCHAR(255),
      created_by VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 6. SMTP Accounts
    `CREATE TABLE IF NOT EXISTS smtp_accounts (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      label VARCHAR(255) NOT NULL,
      host VARCHAR(255) NOT NULL,
      port INT NOT NULL DEFAULT 587,
      secure BOOLEAN DEFAULT FALSE,
      auth_user VARCHAR(255),
      encrypted_pass TEXT,
      from_name VARCHAR(255),
      from_email VARCHAR(255),
      is_default BOOLEAN DEFAULT FALSE,
      daily_limit INT DEFAULT 500,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 7. Audit Logs
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64),
      action VARCHAR(64) NOT NULL,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(64),
      metadata JSON,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 8. Contacts
    `CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      custom_fields JSON,
      is_subscribed BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 9. Contact Lists
    `CREATE TABLE IF NOT EXISTS contact_lists (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 10. Contact List Memberships
    `CREATE TABLE IF NOT EXISTS contact_list_members (
      id VARCHAR(64) PRIMARY KEY,
      list_id VARCHAR(64) NOT NULL,
      contact_id VARCHAR(64) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 11. Campaigns
    `CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      template_id VARCHAR(64),
      smtp_account_id VARCHAR(64),
      contact_list_id VARCHAR(64),
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(300) NOT NULL,
      from_name VARCHAR(100),
      reply_to VARCHAR(255),
      preview_text VARCHAR(300),
      html_content ${isMysql ? 'LONGTEXT' : 'TEXT'},
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      total_recipients INT NOT NULL DEFAULT 0,
      sent_count INT NOT NULL DEFAULT 0,
      delivered_count INT NOT NULL DEFAULT 0,
      opened_count INT NOT NULL DEFAULT 0,
      clicked_count INT NOT NULL DEFAULT 0,
      failed_count INT NOT NULL DEFAULT 0,
      scheduled_at TIMESTAMP NULL,
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 12. Campaign Delivery Logs
    `CREATE TABLE IF NOT EXISTS campaign_logs (
      id VARCHAR(64) PRIMARY KEY,
      campaign_id VARCHAR(64) NOT NULL,
      contact_id VARCHAR(64),
      recipient_email VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      retry_count INT NOT NULL DEFAULT 0,
      max_retries INT NOT NULL DEFAULT 3,
      error_message TEXT,
      message_id VARCHAR(255),
      sent_at TIMESTAMP NULL,
      opened_at TIMESTAMP NULL,
      clicked_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 13. Campaign Analytic Events (Opens, Clicks)
    `CREATE TABLE IF NOT EXISTS campaign_events (
      id VARCHAR(64) PRIMARY KEY,
      campaign_id VARCHAR(64) NOT NULL,
      contact_id VARCHAR(64),
      event_type VARCHAR(32) NOT NULL,
      target_url TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 14. Collaborative Editing & Template Concurrency Locks
    `CREATE TABLE IF NOT EXISTS template_locks (
      id VARCHAR(64) PRIMARY KEY,
      template_id VARCHAR(64) NOT NULL,
      workspace_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      user_name VARCHAR(255),
      locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 15. Automations / Workflows Engine
    `CREATE TABLE IF NOT EXISTS automations (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      trigger_type VARCHAR(64) NOT NULL,
      trigger_config TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 16. Automation Workflow Steps
    `CREATE TABLE IF NOT EXISTS automation_steps (
      id VARCHAR(64) PRIMARY KEY,
      automation_id VARCHAR(64) NOT NULL,
      step_order INT NOT NULL DEFAULT 1,
      step_type VARCHAR(64) NOT NULL,
      step_config TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 17. Automation Execution Logs
    `CREATE TABLE IF NOT EXISTS automation_logs (
      id VARCHAR(64) PRIMARY KEY,
      automation_id VARCHAR(64) NOT NULL,
      step_id VARCHAR(64),
      contact_id VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'executed',
      details TEXT,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 18. Outgoing Webhooks
    `CREATE TABLE IF NOT EXISTS webhooks (
      id VARCHAR(64) PRIMARY KEY,
      workspace_id VARCHAR(64) NOT NULL,
      url TEXT NOT NULL,
      secret VARCHAR(255) NOT NULL,
      events TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,

    // 19. Webhook Delivery Logs
    `CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id VARCHAR(64) PRIMARY KEY,
      webhook_id VARCHAR(64) NOT NULL,
      event_name VARCHAR(64) NOT NULL,
      payload TEXT NOT NULL,
      response_status INT,
      error_message TEXT,
      delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )${tableSuffix}`,
  ];

  for (const sql of ddlStatements) {
    await executeQuery(sql);
  }

  return { success: true, engine, tablesCount: ddlStatements.length };
}

export default {
  runMigrations,
};
