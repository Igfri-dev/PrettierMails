import express from 'express';
import { z } from 'zod';
import {
  createWorkspace,
  getWorkspaceById,
  listUserWorkspaces,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from '../db/workspaceRepository.js';
import { authenticateToken, requireAuth, requireWorkspaceRole } from '../middlewares/auth.js';

const router = express.Router();

const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'El nombre del espacio de trabajo debe tener al menos 2 caracteres'),
  slug: z.string().optional(),
});

const AddMemberSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  role: z.enum(['admin', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'El rol debe ser admin, editor o viewer' }),
  }).default('editor'),
});

const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer', 'owner'], {
    errorMap: () => ({ message: 'El rol debe ser owner, admin, editor o viewer' }),
  }),
});

/**
 * GET /api/workspaces
 * List all workspaces accessible by the current authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workspaces = await listUserWorkspaces(req.user.id);
    res.json({
      success: true,
      data: workspaces,
    });
  } catch (err) {
    console.error('Error listing workspaces:', err);
    res.status(500).json({ success: false, error: 'Error al obtener espacios de trabajo' });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', authenticateToken, requireAuth, async (req, res) => {
  try {
    const parsed = CreateWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de espacio inválidos',
      });
    }

    const ws = await createWorkspace({
      name: parsed.data.name,
      slug: parsed.data.slug,
      ownerUserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Espacio de trabajo creado con éxito',
      data: ws,
    });
  } catch (err) {
    console.error('Error creating workspace:', err);
    res.status(500).json({ success: false, error: 'Error al crear el espacio de trabajo' });
  }
});

/**
 * GET /api/workspaces/:id
 * Get workspace details
 */
router.get('/:id', authenticateToken, requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const ws = await getWorkspaceById(req.params.id);
    if (!ws) {
      return res.status(404).json({ success: false, error: 'Espacio de trabajo no encontrado' });
    }

    res.json({
      success: true,
      data: {
        ...ws,
        userRole: req.userRole,
      },
    });
  } catch (err) {
    console.error('Error getting workspace:', err);
    res.status(500).json({ success: false, error: 'Error al obtener espacio de trabajo' });
  }
});

/**
 * GET /api/workspaces/:id/members
 * List members of a workspace
 */
router.get('/:id/members', authenticateToken, requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const members = await getWorkspaceMembers(req.params.id);
    res.json({
      success: true,
      data: members,
    });
  } catch (err) {
    console.error('Error listing workspace members:', err);
    res.status(500).json({ success: false, error: 'Error al obtener miembros del espacio' });
  }
});

/**
 * POST /api/workspaces/:id/members
 * Invite or add a member to the workspace (requires admin or owner)
 */
router.post('/:id/members', authenticateToken, requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const parsed = AddMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de miembro inválidos',
      });
    }

    const member = await addWorkspaceMember(req.params.id, parsed.data);

    res.status(201).json({
      success: true,
      message: `Miembro agregado con rol "${parsed.data.role}"`,
      data: member,
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Error al agregar miembro',
    });
  }
});

/**
 * PUT /api/workspaces/:id/members/:userId
 * Update member role (requires admin or owner)
 */
router.put('/:id/members/:userId', authenticateToken, requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const parsed = UpdateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Rol inválido',
      });
    }

    const updated = await updateMemberRole(req.params.id, req.params.userId, parsed.data.role);

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Error al actualizar rol de miembro',
    });
  }
});

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove member from workspace (requires admin or owner)
 */
router.delete('/:id/members/:userId', authenticateToken, requireWorkspaceRole('admin'), async (req, res) => {
  try {
    await removeWorkspaceMember(req.params.id, req.params.userId);

    res.json({
      success: true,
      message: 'Miembro removido del espacio de trabajo',
    });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Error al remover miembro',
    });
  }
});

export default router;
