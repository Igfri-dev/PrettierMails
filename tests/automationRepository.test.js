import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { createContactList, createContact } from '../server/src/db/contactRepository.js';
import {
  createAutomation,
  getAutomationById,
  listAutomations,
  addAutomationStep,
  listAutomationSteps,
  triggerAutomations,
  listAutomationLogs,
  deleteAutomation,
} from '../server/src/db/automationRepository.js';

describe('Automation Workflows & Event Triggers Repository', () => {
  const ws = 'ws-test-auto';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('creates an automation, sequences workflow steps, and evaluates triggers with execution logs', async () => {
    // 1. Create a target list for workflow actions
    const vipList = await createContactList({
      workspaceId: ws,
      name: 'Lista VIP Automática',
    });

    // 2. Create Automation
    const auto = await createAutomation({
      workspaceId: ws,
      name: 'Flujo de Bienvenida para Nuevos Suscriptores',
      triggerType: 'contact.subscribed',
      triggerConfig: { source: 'web-signup' },
      status: 'active',
    });

    expect(auto.id).toMatch(/^auto-/);
    expect(auto.name).toBe('Flujo de Bienvenida para Nuevos Suscriptores');
    expect(auto.trigger_type).toBe('contact.subscribed');

    // 3. Add Steps
    const step1 = await addAutomationStep(auto.id, {
      stepType: 'send_email',
      stepConfig: { subject: '¡Bienvenido a PrettierMails!' },
      stepOrder: 1,
    });
    expect(step1.id).toMatch(/^step-/);
    expect(step1.step_order).toBe(1);

    const step2 = await addAutomationStep(auto.id, {
      stepType: 'add_to_list',
      stepConfig: { listId: vipList.id },
      stepOrder: 2,
    });
    expect(step2.step_order).toBe(2);

    // Verify steps listed in order
    const steps = await listAutomationSteps(auto.id);
    expect(steps.length).toBe(2);
    expect(steps[0].step_type).toBe('send_email');
    expect(steps[1].step_type).toBe('add_to_list');

    // 4. Create a Contact to trigger
    const contact = await createContact({
      workspaceId: ws,
      email: 'sofia@empresa.com',
      firstName: 'Sofía',
      isSubscribed: true,
    });

    // 5. Trigger automation event
    const triggerRes = await triggerAutomations(ws, 'contact.subscribed', {
      contact,
      email: contact.email,
    });

    expect(triggerRes.matchedAutomations).toBe(1);
    expect(triggerRes.results[0].stepsExecuted).toBe(2);

    // 6. Verify Execution Logs
    const logs = await listAutomationLogs(auto.id);
    expect(logs.length).toBe(2);
    expect(logs.every((l) => l.status === 'executed')).toBe(true);

    // 7. Delete Automation cascades steps and logs
    const deleted = await deleteAutomation(auto.id, ws);
    expect(deleted).toBe(true);

    const afterDel = await getAutomationById(auto.id, ws);
    expect(afterDel).toBeNull();
  });
});
