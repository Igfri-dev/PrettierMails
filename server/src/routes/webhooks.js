import express from 'express';
import { z } from 'zod';
import {
  createWebhook,
  getWebhookById,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  listWebhookDeliveries,
  dispatchWebhookEvent,
} from '../db/webhookRepository.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';
import { validateRequestBody } from '../schemas/apiSchemas.js';

const router = express.Router();
router.use(authenticateToken);

const CreateWebhookSchema = z.object({
  url: z.string().url('URL inválida. Debe ser una URL HTTP/HTTPS válida'),
  secret: z.string().optional().nullable(),
  events: z.array(z.string()).optional().default(['*']),
  isActive: z.boolean().optional().default(true),
});

const UpdateWebhookSchema = z.object({
  url: z.string().url('URL inválida.').optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/webhooks
 * List all outgoing webhooks for the current workspace
 */
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const webhooks = await listWebhooks(req.workspaceId);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    console.error('Error listando webhooks:', err);
    res.status(500).json({ success: false, error: 'Error al listar webhooks.' });
  }
});

/**
 * POST /api/webhooks
 * Create a new outgoing webhook
 */
router.post('/', requireWorkspaceRole('editor'), validateRequestBody(CreateWebhookSchema), async (req, res) => {
  try {
    const webhook = await createWebhook({
      workspaceId: req.workspaceId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    console.error('Error creando webhook:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al crear el webhook.' });
  }
});

/**
 * GET /api/webhooks/:id
 * Get webhook details
 */
router.get('/:id', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const webhook = await getWebhookById(req.params.id, req.workspaceId);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook no encontrado.' });
    }
    res.json({ success: true, data: webhook });
  } catch (err) {
    console.error('Error obteniendo webhook:', err);
    res.status(500).json({ success: false, error: 'Error al obtener webhook.' });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update an existing webhook
 */
router.put('/:id', requireWorkspaceRole('editor'), validateRequestBody(UpdateWebhookSchema), async (req, res) => {
  try {
    const updated = await updateWebhook(req.params.id, req.workspaceId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error actualizando webhook:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al actualizar el webhook.' });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook and its deliveries
 */
router.delete('/:id', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const success = await deleteWebhook(req.params.id, req.workspaceId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Webhook no encontrado o ya eliminado.' });
    }
    res.json({ success: true, message: 'Webhook eliminado exitosamente.' });
  } catch (err) {
    console.error('Error eliminando webhook:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar el webhook.' });
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * List recent deliveries for this webhook
 */
router.get('/:id/deliveries', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const webhook = await getWebhookById(req.params.id, req.workspaceId);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook no encontrado.' });
    }

    const deliveries = await listWebhookDeliveries(req.params.id, { limit: req.query.limit || 50 });
    res.json({ success: true, data: deliveries });
  } catch (err) {
    console.error('Error obteniendo entregas de webhook:', err);
    res.status(500).json({ success: false, error: 'Error al obtener registros de entrega.' });
  }
});

/**
 * POST /api/webhooks/dispatch
 * Dispatch an event manually or from internal triggers
 */
router.post('/dispatch', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const { eventName, payload = {} } = req.body;
    if (!eventName) {
      return res.status(400).json({ success: false, error: 'eventName es requerido.' });
    }

    const result = await dispatchWebhookEvent(req.workspaceId, eventName, payload);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error despachando evento a webhooks:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al despachar el webhook.' });
  }
});

export default router;
