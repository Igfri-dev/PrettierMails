import express from 'express';
import { z } from 'zod';
import {
  createAutomation,
  getAutomationById,
  listAutomations,
  updateAutomation,
  deleteAutomation,
  addAutomationStep,
  deleteAutomationStep,
  listAutomationSteps,
  listAutomationLogs,
  triggerAutomations,
} from '../db/automationRepository.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';
import { validateRequestBody } from '../schemas/apiSchemas.js';

const router = express.Router();
router.use(authenticateToken);

const CreateAutomationSchema = z.object({
  name: z.string().min(1, 'El nombre de la automatización es obligatorio').max(255),
  triggerType: z.enum([
    'contact.subscribed',
    'contact.unsubscribed',
    'email.opened',
    'email.clicked',
    'custom.event',
  ]),
  triggerConfig: z.record(z.any()).optional().default({}),
  status: z.enum(['active', 'paused', 'draft']).optional().default('active'),
});

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  triggerType: z.enum([
    'contact.subscribed',
    'contact.unsubscribed',
    'email.opened',
    'email.clicked',
    'custom.event',
  ]).optional(),
  triggerConfig: z.record(z.any()).optional(),
  status: z.enum(['active', 'paused', 'draft']).optional(),
});

const AddStepSchema = z.object({
  stepType: z.enum(['send_email', 'add_to_list', 'wait_delay']),
  stepConfig: z.record(z.any()).optional().default({}),
  stepOrder: z.number().int().min(1).optional(),
});

/**
 * GET /api/automations
 * List all automations for the current workspace
 */
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const automations = await listAutomations(req.workspaceId);
    res.json({ success: true, data: automations });
  } catch (err) {
    console.error('Error listando automatizaciones:', err);
    res.status(500).json({ success: false, error: 'Error al obtener automatizaciones.' });
  }
});

/**
 * POST /api/automations
 * Create a new automation
 */
router.post('/', requireWorkspaceRole('editor'), validateRequestBody(CreateAutomationSchema), async (req, res) => {
  try {
    const automation = await createAutomation({
      workspaceId: req.workspaceId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: automation });
  } catch (err) {
    console.error('Error creando automatización:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al crear la automatización.' });
  }
});

/**
 * GET /api/automations/:id
 * Get automation details with its sequenced steps
 */
router.get('/:id', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const automation = await getAutomationById(req.params.id, req.workspaceId);
    if (!automation) {
      return res.status(404).json({ success: false, error: 'Automatización no encontrada.' });
    }
    const steps = await listAutomationSteps(automation.id);
    res.json({ success: true, data: { ...automation, steps } });
  } catch (err) {
    console.error('Error obteniendo automatización:', err);
    res.status(500).json({ success: false, error: 'Error al obtener la automatización.' });
  }
});

/**
 * PUT /api/automations/:id
 * Update automation configuration
 */
router.put('/:id', requireWorkspaceRole('editor'), validateRequestBody(UpdateAutomationSchema), async (req, res) => {
  try {
    const updated = await updateAutomation(req.params.id, req.workspaceId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error actualizando automatización:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al actualizar la automatización.' });
  }
});

/**
 * DELETE /api/automations/:id
 * Delete an automation and its associated steps
 */
router.delete('/:id', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const success = await deleteAutomation(req.params.id, req.workspaceId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Automatización no encontrada o ya eliminada.' });
    }
    res.json({ success: true, message: 'Automatización eliminada exitosamente.' });
  } catch (err) {
    console.error('Error eliminando automatización:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar la automatización.' });
  }
});

/**
 * GET /api/automations/:id/steps
 * List steps in sequence for an automation
 */
router.get('/:id/steps', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const steps = await listAutomationSteps(req.params.id);
    res.json({ success: true, data: steps });
  } catch (err) {
    console.error('Error listando pasos de automatización:', err);
    res.status(500).json({ success: false, error: 'Error al listar los pasos.' });
  }
});

/**
 * POST /api/automations/:id/steps
 * Add a new sequenced step to an automation
 */
router.post('/:id/steps', requireWorkspaceRole('editor'), validateRequestBody(AddStepSchema), async (req, res) => {
  try {
    const automation = await getAutomationById(req.params.id, req.workspaceId);
    if (!automation) {
      return res.status(404).json({ success: false, error: 'Automatización no encontrada.' });
    }

    const step = await addAutomationStep(req.params.id, req.body);
    res.status(201).json({ success: true, data: step });
  } catch (err) {
    console.error('Error agregando paso a la automatización:', err);
    res.status(500).json({ success: false, error: 'Error al agregar el paso.' });
  }
});

/**
 * DELETE /api/automations/:id/steps/:stepId
 * Delete a step from an automation
 */
router.delete('/:id/steps/:stepId', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const success = await deleteAutomationStep(req.params.stepId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Paso no encontrado.' });
    }
    res.json({ success: true, message: 'Paso eliminado exitosamente.' });
  } catch (err) {
    console.error('Error eliminando paso de automatización:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar el paso.' });
  }
});

/**
 * GET /api/automations/:id/logs
 * List execution history logs for an automation
 */
router.get('/:id/logs', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const logs = await listAutomationLogs(req.params.id, { limit: req.query.limit || 50 });
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Error obteniendo logs de automatización:', err);
    res.status(500).json({ success: false, error: 'Error al obtener logs.' });
  }
});

/**
 * POST /api/automations/trigger-event
 * Trigger automations that match an event type with context payload
 */
router.post('/trigger-event', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const { eventType, context = {} } = req.body;
    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType es requerido.' });
    }

    const results = await triggerAutomations(req.workspaceId, eventType, context);
    res.json({
      success: true,
      executedCount: results.matchedAutomations ?? results.results?.length ?? 0,
      data: results,
    });
  } catch (err) {
    console.error('Error ejecutando evento de automatización:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al ejecutar la automatización.' });
  }
});

export default router;
