import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '../server/src/db/migrations.js';
import {
  createSmtpAccount,
  listSmtpAccounts,
  getSmtpAccountById,
  updateSmtpAccount,
  deleteSmtpAccount,
  setDefaultSmtpAccount,
} from '../server/src/db/smtpRepository.js';

describe('SMTP Repository with Encrypted Credentials & Multi-Tenancy', () => {
  beforeEach(async () => {
    await runMigrations();
  });

  it('creates an SMTP account with encrypted password and masks it in listings', async () => {
    const wsId = 'ws-test-smtp-1';
    const rawPass = 'UltraSecret123!';

    const created = await createSmtpAccount({
      workspaceId: wsId,
      label: 'Google Workspace SMTP',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      authUser: 'marketing@mycompany.com',
      password: rawPass,
      fromName: 'Equipo de Marketing',
      fromEmail: 'marketing@mycompany.com',
      isDefault: true,
    });

    expect(created.id).toMatch(/^smtp-/);
    expect(created.label).toBe('Google Workspace SMTP');
    expect(created.host).toBe('smtp.gmail.com');
    expect(created.hasPassword).toBe(true);
    expect(created.encrypted_pass).toBeUndefined();
    expect(created.password).toBeUndefined();

    // Listing should not reveal password
    const list = await listSmtpAccounts(wsId);
    expect(list.length).toBeGreaterThan(0);
    const item = list.find((a) => a.id === created.id);
    expect(item).toBeDefined();
    expect(item.hasPassword).toBe(true);
    expect(item.encrypted_pass).toBeUndefined();
    expect(item.password).toBeUndefined();
  });

  it('decrypts password only when includeDecryptedPass is explicitly requested', async () => {
    const wsId = 'ws-test-smtp-2';
    const plainPass = 'SesTokenSecret#99';

    const created = await createSmtpAccount({
      workspaceId: wsId,
      label: 'Amazon SES',
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      authUser: 'AKIA_SAMPLE_KEY',
      password: plainPass,
      fromEmail: 'alerts@domain.com',
    });

    // Default retrieval
    const normal = await getSmtpAccountById(created.id, wsId);
    expect(normal.password).toBeUndefined();
    expect(normal.encrypted_pass).toBeUndefined();

    // Internal retrieval with includeDecryptedPass
    const decrypted = await getSmtpAccountById(created.id, wsId, { includeDecryptedPass: true });
    expect(decrypted.password).toBe(plainPass);
    expect(decrypted.encrypted_pass).toBeUndefined();
  });

  it('switches default account exclusivity within the workspace', async () => {
    const wsId = 'ws-test-smtp-default';

    const acc1 = await createSmtpAccount({
      workspaceId: wsId,
      label: 'SMTP Primario',
      host: 'smtp.primario.com',
      port: 587,
      isDefault: true,
    });

    const acc2 = await createSmtpAccount({
      workspaceId: wsId,
      label: 'SMTP Secundario',
      host: 'smtp.secundario.com',
      port: 587,
      isDefault: false,
    });

    let currentAcc1 = await getSmtpAccountById(acc1.id, wsId);
    let currentAcc2 = await getSmtpAccountById(acc2.id, wsId);
    expect(Boolean(currentAcc1.is_default)).toBe(true);
    expect(Boolean(currentAcc2.is_default)).toBe(false);

    // Switch default to acc2
    await setDefaultSmtpAccount(acc2.id, wsId);

    currentAcc1 = await getSmtpAccountById(acc1.id, wsId);
    currentAcc2 = await getSmtpAccountById(acc2.id, wsId);
    expect(Boolean(currentAcc1.is_default)).toBe(false);
    expect(Boolean(currentAcc2.is_default)).toBe(true);
  });

  it('updates configuration and re-encrypts password if changed', async () => {
    const wsId = 'ws-test-smtp-update';

    const created = await createSmtpAccount({
      workspaceId: wsId,
      label: 'Old Label',
      host: 'smtp.mail.com',
      port: 587,
      password: 'OldPassword1',
    });

    const updated = await updateSmtpAccount(created.id, wsId, {
      label: 'New Label',
      port: 2525,
      password: 'NewPassword2',
    });

    expect(updated.label).toBe('New Label');
    expect(updated.port).toBe(2525);

    const decrypted = await getSmtpAccountById(created.id, wsId, { includeDecryptedPass: true });
    expect(decrypted.password).toBe('NewPassword2');
  });

  it('enforces multi-tenancy isolation between workspaces', async () => {
    const wsAlpha = 'ws-tenant-alpha';
    const wsBeta = 'ws-tenant-beta';

    const accountAlpha = await createSmtpAccount({
      workspaceId: wsAlpha,
      label: 'Alpha SMTP',
      host: 'smtp.alpha.com',
      port: 587,
      password: 'AlphaSecret',
    });

    // Beta cannot access Alpha's account
    const accessedFromBeta = await getSmtpAccountById(accountAlpha.id, wsBeta);
    expect(accessedFromBeta).toBeNull();

    // Beta cannot list Alpha's account
    const betaList = await listSmtpAccounts(wsBeta);
    expect(betaList.find((a) => a.id === accountAlpha.id)).toBeUndefined();

    // Deleting from Beta has 0 effect
    const delResult = await deleteSmtpAccount(accountAlpha.id, wsBeta);
    expect(delResult.deletedCount).toBe(0);

    // Alpha's account remains intact
    const stillExists = await getSmtpAccountById(accountAlpha.id, wsAlpha);
    expect(stillExists).not.toBeNull();
  });
});
