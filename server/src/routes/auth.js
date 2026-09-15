import express from 'express';
import { z } from 'zod';
import { createUser, verifyUser, getUserById, updateUserProfile } from '../db/userRepository.js';
import { listUserWorkspaces } from '../db/workspaceRepository.js';
import { signToken } from '../utils/crypto.js';
import { authenticateToken, requireAuth } from '../middlewares/auth.js';

const router = express.Router();

const RegisterSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  avatarUrl: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  avatarUrl: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user and provision an initial personal workspace
 */
router.post('/register', async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de registro inválidos',
        details: parsed.error.issues,
      });
    }

    const { user, workspace } = await createUser(parsed.data);

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const workspaces = await listUserWorkspaces(user.id);

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        token,
        user,
        workspaces,
        currentWorkspace: workspace,
      },
    });
  } catch (err) {
    console.error('Error in register:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Error al registrar usuario',
    });
  }
});

/**
 * POST /api/auth/login
 * Verify credentials and return session token
 */
router.post('/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Credenciales inválidas',
      });
    }

    const user = await verifyUser(parsed.data.email, parsed.data.password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Correo electrónico o contraseña incorrectos',
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const workspaces = await listUserWorkspaces(user.id);
    const currentWorkspace = workspaces[0] || null;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user,
        workspaces,
        currentWorkspace,
      },
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current session profile and workspaces
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.json({
        success: true,
        data: {
          user: req.user,
          workspaces: [
            {
              id: 'ws-default',
              name: 'Workspace Principal',
              slug: 'default',
              role: 'owner',
            },
          ],
          currentWorkspace: {
            id: 'ws-default',
            name: 'Workspace Principal',
            slug: 'default',
            role: 'owner',
          },
          isGuest: true,
        },
      });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const workspaces = await listUserWorkspaces(user.id);

    res.json({
      success: true,
      data: {
        user,
        workspaces,
        currentWorkspace: workspaces[0] || null,
        isGuest: false,
      },
    });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ success: false, error: 'Error al obtener sesión' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, requireAuth, async (req, res) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de perfil inválidos',
      });
    }

    const updated = await updateUserProfile(req.user.id, parsed.data);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updated,
    });
  } catch (err) {
    console.error('Error in update profile:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar perfil' });
  }
});

export default router;
