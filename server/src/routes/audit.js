import express from 'express';
import { listAuditEvents } from '../db/auditRepository.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/audit-logs
 * List audit logs for current workspace (admin or owner)
 */
router.get('/', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

    const logs = await listAuditEvents(workspaceId, { limit, offset });
    res.json(logs);
  } catch (err) {
    console.error('Error listando logs de auditoría:', err);
    res.status(500).json({ error: 'Error al recuperar los registros de auditoría.' });
  }
});

export default router;
