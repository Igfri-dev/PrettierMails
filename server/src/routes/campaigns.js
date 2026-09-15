import express from 'express';
import { z } from 'zod';
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  getCampaignLogs,
} from '../db/campaignRepository.js';
import { dispatchCampaign, pauseCampaign, resumeCampaign } from '../services/campaignQueue.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';
import { validateRequestBody } from '../schemas/apiSchemas.js';
import { recordAuditEvent } from '../db/auditRepository.js';

const router = express.Router();
router.use(authenticateToken);

const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'El nombre de la campaña es obligatorio').max(255),
  subject: z.string().min(1, 'El asunto es obligatorio').max(300),
  templateId: z.string().max(64).optional().nullable(),
  smtpAccountId: z.string().max(64).optional().nullable(),
  contactListId: z.string().max(64).optional().nullable(),
  fromName: z.string().max(100).optional().default('PrettierMails'),
  replyTo: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  previewText: z.string().max(300).optional().default(''),
  htmlContent: z.string().min(1, 'El contenido HTML es obligatorio').max(2000000),
  scheduledAt: z.string().optional().nullable(),
});

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(300).optional(),
  templateId: z.string().max(64).optional().nullable(),
  smtpAccountId: z.string().max(64).optional().nullable(),
  contactListId: z.string().max(64).optional().nullable(),
  fromName: z.string().max(100).optional(),
  replyTo: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  previewText: z.string().max(300).optional(),
  htmlContent: z.string().max(2000000).optional(),
  scheduledAt: z.string().optional().nullable(),
});

/**
 * GET /api/campaigns
 * List all campaigns in workspace
 */
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const campaigns = await listCampaigns(req.workspaceId, { status, limit, offset });
    res.json(campaigns);
  } catch (err) {
    console.error('Error listando campañas:', err);
    res.status(500).json({ error: 'Error al obtener campañas.' });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post(
  '/',
  requireWorkspaceRole('editor'),
  validateRequestBody(CreateCampaignSchema),
  async (req, res) => {
    try {
      const newCampaign = await createCampaign({
        workspaceId: req.workspaceId,
        ...req.validatedBody,
      });

      await recordAuditEvent({
        workspaceId: req.workspaceId,
        userId: req.user?.id || null,
        action: 'campaign.created',
        resourceType: 'campaign',
        resourceId: newCampaign.id,
        metadata: { name: newCampaign.name, subject: newCampaign.subject },
        ipAddress: req.ip,
      });

      res.status(201).json(newCampaign);
    } catch (err) {
      console.error('Error creando campaña:', err);
      res.status(400).json({ error: err.message || 'Error al crear la campaña.' });
    }
  }
);

/**
 * GET /api/campaigns/:id
 * Retrieve campaign details
 */
router.get('/:id', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id, req.workspaceId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada.' });
    }
    res.json(campaign);
  } catch (err) {
    console.error('Error obteniendo campaña:', err);
    res.status(500).json({ error: 'Error al obtener campaña.' });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update an existing campaign
 */
router.put(
  '/:id',
  requireWorkspaceRole('editor'),
  validateRequestBody(UpdateCampaignSchema),
  async (req, res) => {
    try {
      const updated = await updateCampaign(req.params.id, req.workspaceId, req.validatedBody);
      res.json(updated);
    } catch (err) {
      console.error('Error actualizando campaña:', err);
      res.status(400).json({ error: err.message || 'Error al actualizar la campaña.' });
    }
  }
);

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign and its associated records
 */
router.delete('/:id', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id, req.workspaceId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada.' });
    }

    await deleteCampaign(req.params.id, req.workspaceId);

    await recordAuditEvent({
      workspaceId: req.workspaceId,
      userId: req.user?.id || null,
      action: 'campaign.deleted',
      resourceType: 'campaign',
      resourceId: campaign.id,
      metadata: { name: campaign.name },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Campaña eliminada correctamente.' });
  } catch (err) {
    console.error('Error eliminando campaña:', err);
    res.status(500).json({ error: 'Error al eliminar la campaña.' });
  }
});

/**
 * POST /api/campaigns/:id/dispatch
 * Triggers async campaign sending
 */
router.post('/:id/dispatch', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await dispatchCampaign(req.params.id, req.workspaceId, {
      baseUrl,
      rateLimitMs: req.body?.rateLimitMs || 50,
      maxRetries: req.body?.maxRetries || 2,
    });

    res.json(result);
  } catch (err) {
    console.error('Error despachando campaña:', err);
    res.status(400).json({ error: err.message || 'Error al despachar la campaña.' });
  }
});

/**
 * POST /api/campaigns/:id/pause
 * Pauses campaign sending
 */
router.post('/:id/pause', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const result = await pauseCampaign(req.params.id, req.workspaceId);
    res.json(result);
  } catch (err) {
    console.error('Error pausando campaña:', err);
    res.status(400).json({ error: err.message || 'Error al pausar la campaña.' });
  }
});

/**
 * POST /api/campaigns/:id/resume
 * Resumes a paused campaign
 */
router.post('/:id/resume', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await resumeCampaign(req.params.id, req.workspaceId, { baseUrl });
    res.json(result);
  } catch (err) {
    console.error('Error reanudando campaña:', err);
    res.status(400).json({ error: err.message || 'Error al reanudar la campaña.' });
  }
});

/**
 * GET /api/campaigns/:id/stats
 * Retrieves performance metrics, open rate, CTR, and top clicked URLs
 */
router.get('/:id/stats', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const stats = await getCampaignStats(req.params.id, req.workspaceId);
    res.json(stats);
  } catch (err) {
    console.error('Error obteniendo estadísticas de campaña:', err);
    res.status(404).json({ error: err.message || 'Error al obtener estadísticas.' });
  }
});

/**
 * GET /api/campaigns/:id/logs
 * Retrieves recipient delivery logs
 */
router.get('/:id/logs', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const logs = await getCampaignLogs(req.params.id, { status, limit, offset });
    res.json(logs);
  } catch (err) {
    console.error('Error obteniendo logs de campaña:', err);
    res.status(500).json({ error: 'Error al obtener logs de envío.' });
  }
});

export default router;
