import crypto from 'crypto';
import { executeQuery } from './connection.js';
import { sendEmail } from '../emailService.js';
import { getTemplateById } from './templateRepository.js';
import { addContactsToList, getContactById } from './contactRepository.js';
import { renderEmailHtml } from '../htmlRenderer.js';

/**
 * Automation Repository for Event-Driven Workflows
 */

export async function createAutomation({
  workspaceId,
  name,
  triggerType,
  triggerConfig = {},
  status = 'active',
}) {
  if (!workspaceId || !name || !triggerType) {
    throw new Error('Workspace, nombre y tipo de disparador son obligatorios.');
  }

  const id = `auto-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const serializedConfig = JSON.stringify(triggerConfig || {});

  const sql = `
    INSERT INTO automations (
      id, workspace_id, name, trigger_type, trigger_config, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [id, workspaceId, name, triggerType, serializedConfig, status, now, now]);

  return {
    id,
    workspace_id: workspaceId,
    name,
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    status,
    created_at: now,
    updated_at: now,
    steps: [],
  };
}

export async function getAutomationById(id, workspaceId) {
  const sql = 'SELECT * FROM automations WHERE id = ? AND workspace_id = ?';
  const res = await executeQuery(sql, [id, workspaceId]);
  const auto = res.rows?.[0] || null;
  if (!auto) return null;

  const stepsSql = 'SELECT * FROM automation_steps WHERE automation_id = ? ORDER BY step_order ASC';
  const stepsRes = await executeQuery(stepsSql, [id]);

  return {
    ...auto,
    trigger_config: typeof auto.trigger_config === 'string' ? JSON.parse(auto.trigger_config || '{}') : auto.trigger_config,
    steps: (stepsRes.rows || []).map((s) => ({
      ...s,
      step_config: typeof s.step_config === 'string' ? JSON.parse(s.step_config || '{}') : s.step_config,
    })),
  };
}

export async function listAutomations(workspaceId, { status = null } = {}) {
  let sql = 'SELECT * FROM automations WHERE workspace_id = ?';
  const params = [workspaceId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';
  const res = await executeQuery(sql, params);
  const rows = res.rows || [];

  const result = [];
  for (const row of rows) {
    const stepsCountRes = await executeQuery(
      'SELECT COUNT(*) as cnt FROM automation_steps WHERE automation_id = ?',
      [row.id]
    );
    const count = Number(stepsCountRes.rows?.[0]?.cnt) || 0;

    result.push({
      ...row,
      trigger_config: typeof row.trigger_config === 'string' ? JSON.parse(row.trigger_config || '{}') : row.trigger_config,
      stepsCount: count,
    });
  }

  return result;
}

export async function updateAutomation(id, workspaceId, updates = {}) {
  const existing = await getAutomationById(id, workspaceId);
  if (!existing) throw new Error('Automatización no encontrada.');

  const fields = [];
  const params = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    params.push(updates.name);
  }
  if (updates.triggerType !== undefined) {
    fields.push('trigger_type = ?');
    params.push(updates.triggerType);
  }
  if (updates.triggerConfig !== undefined) {
    fields.push('trigger_config = ?');
    params.push(JSON.stringify(updates.triggerConfig));
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }

  if (fields.length === 0) return existing;

  const now = new Date().toISOString();
  fields.push('updated_at = ?');
  params.push(now);

  params.push(id);
  params.push(workspaceId);

  const sql = `UPDATE automations SET ${fields.join(', ')} WHERE id = ? AND workspace_id = ?`;
  await executeQuery(sql, params);

  return getAutomationById(id, workspaceId);
}

export async function deleteAutomation(id, workspaceId) {
  await executeQuery('DELETE FROM automation_logs WHERE automation_id = ?', [id]);
  await executeQuery('DELETE FROM automation_steps WHERE automation_id = ?', [id]);
  const res = await executeQuery('DELETE FROM automations WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return (res.rowCount || 0) > 0;
}

export async function addAutomationStep(automationId, {
  stepType,
  stepConfig = {},
  stepOrder = null,
}) {
  const stepId = `step-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  let finalOrder = stepOrder;
  if (!finalOrder) {
    const existing = await executeQuery(
      'SELECT MAX(step_order) as max_ord FROM automation_steps WHERE automation_id = ?',
      [automationId]
    );
    finalOrder = (Number(existing.rows?.[0]?.max_ord) || 0) + 1;
  }

  const serializedConfig = JSON.stringify(stepConfig || {});
  const sql = `
    INSERT INTO automation_steps (
      id, automation_id, step_order, step_type, step_config, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  await executeQuery(sql, [stepId, automationId, finalOrder, stepType, serializedConfig, now]);

  return {
    id: stepId,
    automation_id: automationId,
    step_order: finalOrder,
    step_type: stepType,
    step_config: stepConfig,
    created_at: now,
  };
}

export async function deleteAutomationStep(stepId, automationId) {
  const res = await executeQuery(
    'DELETE FROM automation_steps WHERE id = ? AND automation_id = ?',
    [stepId, automationId]
  );
  return (res.rowCount || 0) > 0;
}

export async function listAutomationSteps(automationId) {
  const sql = 'SELECT * FROM automation_steps WHERE automation_id = ? ORDER BY step_order ASC';
  const res = await executeQuery(sql, [automationId]);
  return (res.rows || []).map((s) => ({
    ...s,
    step_config: typeof s.step_config === 'string' ? JSON.parse(s.step_config || '{}') : s.step_config,
  }));
}

export async function createAutomationLog({
  automationId,
  stepId = null,
  contactId = null,
  status = 'executed',
  details = {},
}) {
  const logId = `alog-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const serializedDetails = JSON.stringify(details || {});

  const sql = `
    INSERT INTO automation_logs (
      id, automation_id, step_id, contact_id, status, details, executed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await executeQuery(sql, [logId, automationId, stepId, contactId, status, serializedDetails, now, now]);

  return {
    id: logId,
    automation_id: automationId,
    step_id: stepId,
    contact_id: contactId,
    status,
    details,
    executed_at: now,
  };
}

export async function listAutomationLogs(automationId, { limit = 50 } = {}) {
  const sql = 'SELECT * FROM automation_logs WHERE automation_id = ? ORDER BY created_at DESC LIMIT ?';
  const res = await executeQuery(sql, [automationId, Math.min(Number(limit) || 50, 200)]);
  return (res.rows || []).map((l) => ({
    ...l,
    details: typeof l.details === 'string' ? JSON.parse(l.details || '{}') : l.details,
  }));
}

/**
 * Triggers and evaluates active automations matching a specific event trigger
 *
 * @param {string} workspaceId
 * @param {string} triggerType 'contact.subscribed' | 'campaign.opened' | 'campaign.clicked'
 * @param {object} context Data containing contact, campaign, targetUrl, etc.
 * @returns {Promise<object>}
 */
export async function triggerAutomations(workspaceId, triggerType, context = {}) {
  const matchingRes = await executeQuery(
    'SELECT * FROM automations WHERE workspace_id = ? AND trigger_type = ? AND status = ?',
    [workspaceId, triggerType, 'active']
  );

  const automations = matchingRes.rows || [];
  const results = [];

  for (const auto of automations) {
    const steps = await listAutomationSteps(auto.id);
    const executionResults = [];

    for (const step of steps) {
      try {
        let stepResult = null;

        if (step.step_type === 'send_email') {
          const { templateId, subject, smtpAccountId } = step.step_config || {};
          let html = '<p>Mensaje automatizado de PrettierMails</p>';
          let finalSubject = subject || 'Mensaje de Bienvenida';

          if (templateId) {
            const tmpl = await getTemplateById(templateId, workspaceId);
            if (tmpl) {
              finalSubject = subject || tmpl.subject || tmpl.name;
              html = tmpl.html_content
                ? renderEmailHtml(tmpl.html_content, { title: finalSubject })
                : renderEmailHtml('<p>Contenido automatizado de plantilla PrettierMails</p>', { title: finalSubject });
            }
          }

          const recipient = context.contact?.email || context.email;
          if (recipient) {
            stepResult = await sendEmail({
              recipients: [recipient],
              contacts: context.contact ? [context.contact] : null,
              subject: finalSubject,
              html,
              smtpAccountId,
              workspaceId,
            });
          }
        } else if (step.step_type === 'add_to_list') {
          const { listId } = step.step_config || {};
          const contactId = context.contact?.id || context.contactId;
          if (listId && contactId) {
            await addContactsToList(listId, [contactId]);
            stepResult = { success: true, addedToListId: listId };
          }
        } else if (step.step_type === 'delay') {
          stepResult = { scheduled: true, delayMinutes: step.step_config?.delayMinutes || 0 };
        }

        await createAutomationLog({
          automationId: auto.id,
          stepId: step.id,
          contactId: context.contact?.id || null,
          status: 'executed',
          details: { stepType: step.step_type, result: stepResult },
        });

        executionResults.push({ stepId: step.id, success: true, stepResult });
      } catch (err) {
        await createAutomationLog({
          automationId: auto.id,
          stepId: step.id,
          contactId: context.contact?.id || null,
          status: 'failed',
          details: { stepType: step.step_type, error: err.message },
        });
        executionResults.push({ stepId: step.id, success: false, error: err.message });
      }
    }

    results.push({
      automationId: auto.id,
      name: auto.name,
      stepsExecuted: executionResults.length,
      stepResults: executionResults,
    });
  }

  return {
    triggerType,
    matchedAutomations: automations.length,
    results,
  };
}

export default {
  createAutomation,
  getAutomationById,
  listAutomations,
  updateAutomation,
  deleteAutomation,
  addAutomationStep,
  deleteAutomationStep,
  listAutomationSteps,
  createAutomationLog,
  listAutomationLogs,
  triggerAutomations,
};
