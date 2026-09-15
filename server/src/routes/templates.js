import express from 'express';
import templateRepo from '../db/templateRepository.js';
import {
  acquireTemplateLock,
  renewTemplateLock,
  releaseTemplateLock,
  getTemplateLock,
} from '../db/lockRepository.js';
import { z } from 'zod';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre de la plantilla es obligatorio'),
  description: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  previewText: z.string().optional().default(''),
  globalSettings: z.record(z.any()).optional().default({}),
  blocks: z.array(z.record(z.any())).optional().default([]),
  changeSummary: z.string().optional().default('Versión inicial'),
  isFavorite: z.boolean().optional().default(false),
});

const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  previewText: z.string().optional(),
  globalSettings: z.record(z.any()).optional(),
  blocks: z.array(z.record(z.any())).optional(),
  changeSummary: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

// GET /api/templates - List templates
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { search, isFavorite } = req.query;

    const templates = await templateRepo.listTemplates(workspaceId, {
      search: search || '',
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : null,
    });

    res.json({
      success: true,
      data: templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ success: false, error: 'Error al listar plantillas' });
  }
});

// POST /api/templates - Create template
router.post('/', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const parsed = CreateTemplateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos de plantilla inválidos',
        details: parsed.error.issues,
      });
    }

    const template = await templateRepo.createTemplate({
      workspaceId,
      ...parsed.data,
      createdBy: req.user?.id || 'usr-admin',
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Plantilla creada con éxito',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Error al crear la plantilla' });
  }
});

// POST /api/templates/autosave - Autosave draft
router.post('/autosave', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id, name, subject, previewText, globalSettings, blocks } = req.body;

    if (id) {
      const existing = await templateRepo.getTemplateById(id, workspaceId);
      if (existing) {
        const updated = await templateRepo.updateTemplate(id, workspaceId, {
          name: name || existing.name,
          subject: subject !== undefined ? subject : existing.subject,
          previewText: previewText !== undefined ? previewText : existing.preview_text,
          globalSettings: globalSettings || existing.global_settings,
          blocks: blocks || existing.blocks,
          changeSummary: 'Autosave automático',
        });
        return res.json({ success: true, data: updated, isNew: false });
      }
    }

    // Create new template draft
    const newTemplate = await templateRepo.createTemplate({
      workspaceId,
      name: name || subject || 'Borrador sin título',
      subject: subject || '',
      previewText: previewText || '',
      globalSettings: globalSettings || {},
      blocks: blocks || [],
      changeSummary: 'Autosave inicial',
      createdBy: req.user?.id || 'usr-admin',
    });

    res.json({ success: true, data: newTemplate, isNew: true });
  } catch (error) {
    console.error('Error in autosave:', error);
    res.status(500).json({ success: false, error: 'Error en autoguardado' });
  }
});

// POST /api/templates/import-json - Import template from JSON file/bundle
router.post('/import-json', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const body = req.body || {};
    const tmplData = body.template || body;

    if (!tmplData || typeof tmplData !== 'object') {
      return res.status(400).json({ success: false, error: 'El contenido JSON es inválido o está vacío.' });
    }

    const name = tmplData.name ? String(tmplData.name).trim() : `Plantilla Importada ${new Date().toLocaleDateString('es-ES')}`;
    const description = tmplData.description ? String(tmplData.description) : 'Importada desde archivo JSON';
    const subject = tmplData.subject ? String(tmplData.subject) : '';
    const previewText = tmplData.previewText || tmplData.preview_text || '';
    const globalSettings = (tmplData.globalSettings || tmplData.global_settings || {});
    const blocks = Array.isArray(tmplData.blocks) ? tmplData.blocks : [];

    const sanitizedBlocks = blocks.map((b, idx) => ({
      ...b,
      id: b.id || `blk-${Date.now()}-${idx}`,
      type: b.type || 'text',
    }));

    const created = await templateRepo.createTemplate({
      workspaceId,
      name,
      description,
      subject,
      previewText,
      globalSettings,
      blocks: sanitizedBlocks,
      changeSummary: 'Importación inicial desde JSON',
      createdBy: req.user?.id || 'usr-admin',
      isFavorite: Boolean(tmplData.isFavorite || tmplData.is_favorite),
    });

    res.status(201).json({
      success: true,
      data: created,
      message: 'Plantilla importada exitosamente.',
    });
  } catch (error) {
    console.error('Error importing template from JSON:', error);
    res.status(500).json({ success: false, error: 'Error al importar la plantilla desde JSON' });
  }
});

// GET /api/templates/:id/export-json - Export template as JSON bundle
router.get('/:id/export-json', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const template = await templateRepo.getTemplateById(req.params.id, workspaceId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
    }

    const exportBundle = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'PrettierMails Enterprise Template Engine',
      workspaceId,
      template: {
        id: template.id,
        name: template.name,
        description: template.description || '',
        subject: template.subject || '',
        previewText: template.preview_text || '',
        isFavorite: Boolean(template.is_favorite),
        versionNumber: template.version_number || 1,
        globalSettings: template.global_settings || {},
        blocks: template.blocks || [],
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${template.id}.json"`);
    res.json(exportBundle);
  } catch (error) {
    console.error('Error exporting template to JSON:', error);
    res.status(500).json({ success: false, error: 'Error al exportar la plantilla a JSON' });
  }
});

// GET /api/templates/:id - Get template details
router.get('/:id', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const template = await templateRepo.getTemplateById(req.params.id, workspaceId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ success: false, error: 'Error al obtener la plantilla' });
  }
});

// PUT /api/templates/:id - Update template (new version)
router.put('/:id', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const parsed = UpdateTemplateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos de actualización inválidos',
        details: parsed.error.issues,
      });
    }

    const updated = await templateRepo.updateTemplate(
      req.params.id,
      workspaceId,
      parsed.data
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Plantilla actualizada con éxito',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la plantilla' });
  }
});

// DELETE /api/templates/:id - Delete template (requires admin or owner)
router.delete('/:id', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const deleted = await templateRepo.deleteTemplate(req.params.id, workspaceId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
    }

    res.json({ success: true, message: 'Plantilla eliminada con éxito' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la plantilla' });
  }
});

// GET /api/templates/:id/versions - List version history
router.get('/:id/versions', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const versions = await templateRepo.listVersions(req.params.id);
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el historial de versiones' });
  }
});

// GET /api/templates/:id/versions/:versionId - Get specific version
router.get('/:id/versions/:versionId', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const version = await templateRepo.getVersionById(req.params.id, req.params.versionId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Versión no encontrada' });
    }
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ success: false, error: 'Error al obtener la versión' });
  }
});

// POST /api/templates/:id/versions/:versionId/restore - Restore version
router.post('/:id/versions/:versionId/restore', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const restored = await templateRepo.restoreVersion(
      req.params.id,
      req.params.versionId,
      req.user?.id || 'usr-admin'
    );

    if (!restored) {
      return res.status(404).json({ success: false, error: 'Versión o plantilla no encontrada' });
    }

    res.json({
      success: true,
      data: restored,
      message: `Versión restaurada con éxito`,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ success: false, error: 'Error al restaurar la versión' });
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name } = req.body;
    const duplicated = await templateRepo.duplicateTemplate(
      req.params.id,
      workspaceId,
      name
    );

    if (!duplicated) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
    }

    res.status(201).json({
      success: true,
      data: duplicated,
      message: 'Plantilla duplicada con éxito',
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ success: false, error: 'Error al duplicar la plantilla' });
  }
});

// GET /api/templates/:id/lock - Inspect lock status
router.get('/:id/lock', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const lock = await getTemplateLock(req.params.id, req.workspaceId);
    res.json({ locked: Boolean(lock), lock });
  } catch (error) {
    console.error('Error checking template lock:', error);
    res.status(500).json({ error: 'Error al verificar el bloqueo de la plantilla' });
  }
});

// POST /api/templates/:id/lock - Acquire editing lock
router.post('/:id/lock', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const userId = req.user?.id || 'usr-anon';
    const userName = req.user?.name || req.user?.email || 'Usuario';
    const ttlSeconds = req.body?.ttlSeconds ? Number(req.body.ttlSeconds) : 60;

    const result = await acquireTemplateLock({
      templateId: req.params.id,
      workspaceId: req.workspaceId,
      userId,
      userName,
      ttlSeconds,
    });

    if (!result.acquired) {
      return res.status(409).json({
        success: false,
        acquired: false,
        message: `La plantilla está siendo editada por ${result.lock?.user_name || 'otro usuario'}.`,
        lock: result.lock,
      });
    }

    res.json({
      success: true,
      acquired: true,
      lock: result.lock,
    });
  } catch (error) {
    console.error('Error acquiring template lock:', error);
    res.status(500).json({ error: 'Error al adquirir el bloqueo de la plantilla' });
  }
});

// POST /api/templates/:id/heartbeat - Renew lock
router.post('/:id/heartbeat', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const userId = req.user?.id || 'usr-anon';
    const ttlSeconds = req.body?.ttlSeconds ? Number(req.body.ttlSeconds) : 60;

    const result = await renewTemplateLock({
      templateId: req.params.id,
      workspaceId: req.workspaceId,
      userId,
      ttlSeconds,
    });

    if (!result.renewed) {
      return res.status(409).json({
        success: false,
        renewed: false,
        message: 'No se pudo renovar el bloqueo (expirado o transferido).',
      });
    }

    res.json({
      success: true,
      renewed: true,
      lock: result.lock,
    });
  } catch (error) {
    console.error('Error renewing template lock:', error);
    res.status(500).json({ error: 'Error al renovar el bloqueo' });
  }
});

// POST /api/templates/:id/unlock - Release lock
router.post('/:id/unlock', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const userId = req.user?.id || 'usr-anon';
    const result = await releaseTemplateLock({
      templateId: req.params.id,
      workspaceId: req.workspaceId,
      userId,
    });

    res.json({
      success: true,
      released: result.released,
    });
  } catch (error) {
    console.error('Error releasing template lock:', error);
    res.status(500).json({ error: 'Error al liberar el bloqueo' });
  }
});

export default router;

