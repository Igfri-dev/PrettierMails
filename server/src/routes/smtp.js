import express from 'express';
import {
  createSmtpAccount,
  listSmtpAccounts,
  getSmtpAccountById,
  updateSmtpAccount,
  deleteSmtpAccount,
  setDefaultSmtpAccount,
} from '../db/smtpRepository.js';
import { recordAuditEvent } from '../db/auditRepository.js';
import { verifyConnection } from '../emailService.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';
import {
  validateRequestBody,
  CreateSmtpAccountSchema,
  UpdateSmtpAccountSchema,
} from '../schemas/apiSchemas.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/smtp-accounts
 * List all configured SMTP accounts for current workspace (viewer or higher)
 */
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const accounts = await listSmtpAccounts(workspaceId);
    res.json(accounts);
  } catch (err) {
    console.error('Error listando cuentas SMTP:', err);
    res.status(500).json({ error: 'Error al listar las cuentas SMTP del workspace.' });
  }
});

/**
 * POST /api/smtp-accounts
 * Create a new SMTP account with encrypted password (admin or owner)
 */
router.post(
  '/',
  requireWorkspaceRole('admin'),
  validateRequestBody(CreateSmtpAccountSchema),
  async (req, res) => {
    try {
      const workspaceId = req.workspaceId;
      const accountData = req.validatedBody;

      const newAccount = await createSmtpAccount({
        workspaceId,
        ...accountData,
      });

      await recordAuditEvent({
        workspaceId,
        userId: req.user?.id || null,
        action: 'smtp_account.created',
        resourceType: 'smtp_account',
        resourceId: newAccount.id,
        metadata: {
          label: newAccount.label,
          host: newAccount.host,
          port: newAccount.port,
          isDefault: newAccount.is_default,
        },
        ipAddress: req.ip,
      });

      res.status(201).json(newAccount);
    } catch (err) {
      console.error('Error creando cuenta SMTP:', err);
      res.status(400).json({ error: err.message || 'Error al guardar la cuenta SMTP.' });
    }
  }
);

/**
 * POST /api/smtp-accounts/:id/test
 * Test SMTP connection using decrypted credentials (editor or higher)
 */
router.post('/:id/test', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const account = await getSmtpAccountById(id, workspaceId, { includeDecryptedPass: true });
    if (!account) {
      return res.status(404).json({ error: 'Cuenta SMTP no encontrada.' });
    }

    const testResult = await verifyConnection(null, account);

    // Audit log connection test
    await recordAuditEvent({
      workspaceId,
      userId: req.user?.id || null,
      action: 'smtp_account.tested',
      resourceType: 'smtp_account',
      resourceId: id,
      metadata: {
        success: testResult.success,
        host: account.host,
        port: account.port,
      },
      ipAddress: req.ip,
    });

    res.json(testResult);
  } catch (err) {
    console.error('Error testeando cuenta SMTP:', err);
    res.status(500).json({ success: false, message: err.message || 'Error al verificar la conexión SMTP.' });
  }
});

/**
 * PUT /api/smtp-accounts/:id
 * Update an existing SMTP account (admin or owner)
 */
router.put(
  '/:id',
  requireWorkspaceRole('admin'),
  validateRequestBody(UpdateSmtpAccountSchema),
  async (req, res) => {
    try {
      const workspaceId = req.workspaceId;
      const { id } = req.params;
      const updates = req.validatedBody;

      const updated = await updateSmtpAccount(id, workspaceId, updates);

      await recordAuditEvent({
        workspaceId,
        userId: req.user?.id || null,
        action: 'smtp_account.updated',
        resourceType: 'smtp_account',
        resourceId: id,
        metadata: {
          label: updated.label,
          host: updated.host,
          port: updated.port,
          isDefault: updated.is_default,
        },
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (err) {
      console.error('Error actualizando cuenta SMTP:', err);
      res.status(400).json({ error: err.message || 'Error al actualizar la cuenta SMTP.' });
    }
  }
);

/**
 * DELETE /api/smtp-accounts/:id
 * Remove an SMTP account (admin or owner)
 */
router.delete('/:id', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const existing = await getSmtpAccountById(id, workspaceId);
    if (!existing) {
      return res.status(404).json({ error: 'Cuenta SMTP no encontrada.' });
    }

    await deleteSmtpAccount(id, workspaceId);

    await recordAuditEvent({
      workspaceId,
      userId: req.user?.id || null,
      action: 'smtp_account.deleted',
      resourceType: 'smtp_account',
      resourceId: id,
      metadata: {
        label: existing.label,
        host: existing.host,
      },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Cuenta SMTP eliminada correctamente.' });
  } catch (err) {
    console.error('Error eliminando cuenta SMTP:', err);
    res.status(500).json({ error: 'Error al eliminar la cuenta SMTP.' });
  }
});

/**
 * POST /api/smtp-accounts/:id/default
 * Set an SMTP account as the workspace default (admin or owner)
 */
router.post('/:id/default', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const updated = await setDefaultSmtpAccount(id, workspaceId);

    await recordAuditEvent({
      workspaceId,
      userId: req.user?.id || null,
      action: 'smtp_account.set_default',
      resourceType: 'smtp_account',
      resourceId: id,
      metadata: {
        label: updated.label,
      },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    console.error('Error configurando cuenta SMTP por defecto:', err);
    res.status(400).json({ error: err.message || 'Error al configurar cuenta SMTP por defecto.' });
  }
});

export default router;
