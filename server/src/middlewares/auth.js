import { verifyToken } from '../utils/crypto.js';
import { getUserRoleInWorkspace } from '../db/workspaceRepository.js';
import { DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID } from '../db/seeders.js';

export const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Authenticate token middleware
 * Extracts Bearer token if present, or falls back to default local user for seamless offline mode.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      req.user = {
        id: payload.userId || payload.id,
        email: payload.email,
        name: payload.name,
        isGuest: false,
      };
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Sesión no válida o expirada. Inicia sesión nuevamente.',
        details: err.message,
      });
    }
  }

  // Fallback guest identity for zero-friction local development & test runs
  req.user = {
    id: DEFAULT_USER_ID,
    email: 'admin@prettiermails.local',
    name: 'Administrador Local',
    isGuest: true,
  };
  return next();
}

/**
 * Strict authentication guard
 * Demands a real authenticated user session (rejects guest fallback)
 */
export function requireAuth(req, res, next) {
  if (!req.user || req.user.isGuest) {
    return res.status(401).json({
      success: false,
      error: 'Se requiere iniciar sesión para realizar esta acción',
    });
  }
  return next();
}

/**
 * RBAC Workspace Access Guard
 * Verifies that the user has at least the minimum required role in the target workspace.
 * @param {'owner' | 'admin' | 'editor' | 'viewer'} minimumRole
 */
export function requireWorkspaceRole(minimumRole = 'viewer') {
  return async (req, res, next) => {
    try {
      const workspaceId =
        req.headers['x-workspace-id'] ||
        req.query.workspaceId ||
        req.params.workspaceId ||
        req.body?.workspaceId ||
        DEFAULT_WORKSPACE_ID;

      req.workspaceId = workspaceId;

      // In local guest mode, allow access to default workspace
      if (req.user?.isGuest && workspaceId === DEFAULT_WORKSPACE_ID) {
        req.userRole = 'owner';
        return next();
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      const role = await getUserRoleInWorkspace(workspaceId, userId);

      if (!role) {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: no eres miembro de este espacio de trabajo',
        });
      }

      const userRoleLevel = ROLE_HIERARCHY[role] || 0;
      const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

      if (userRoleLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: `Permisos insuficientes. Rol actual: "${role}", rol mínimo requerido: "${minimumRole}".`,
        });
      }

      req.userRole = role;
      return next();
    } catch (err) {
      console.error('Error in requireWorkspaceRole:', err);
      return res.status(500).json({
        success: false,
        error: 'Error de verificación de permisos de espacio de trabajo',
      });
    }
  };
}

export default {
  authenticateToken,
  requireAuth,
  requireWorkspaceRole,
  ROLE_HIERARCHY,
};
