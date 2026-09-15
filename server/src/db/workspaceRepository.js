import { executeQuery } from './connection.js';
import { getUserByEmail, getUserById } from './userRepository.js';

/**
 * Workspace Repository for Multi-Tenancy and Team Management
 */
export async function createWorkspace({ name, slug, ownerUserId }) {
  if (!name || !ownerUserId) {
    throw new Error('Nombre del espacio y propietario son obligatorios');
  }

  const workspaceId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = name.trim();
  const cleanSlug = slug
    ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    : `ws-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

  await executeQuery(
    'INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)',
    [workspaceId, cleanName, cleanSlug]
  );

  const memberId = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await executeQuery(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)',
    [memberId, workspaceId, ownerUserId, 'owner']
  );

  return {
    id: workspaceId,
    name: cleanName,
    slug: cleanSlug,
    role: 'owner',
    created_at: new Date().toISOString(),
  };
}

export async function getWorkspaceById(id) {
  const res = await executeQuery('SELECT id, name, slug, created_at, updated_at FROM workspaces WHERE id = ?', [id]);
  return res.rows[0] || null;
}

export async function listUserWorkspaces(userId) {
  if (!userId) return [];

  const memberships = await executeQuery(
    'SELECT workspace_id, role, created_at FROM workspace_members WHERE user_id = ?',
    [userId]
  );

  const result = [];
  for (const m of memberships.rows) {
    const ws = await getWorkspaceById(m.workspace_id);
    if (ws) {
      result.push({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: m.role,
        createdAt: ws.created_at,
      });
    }
  }

  return result;
}

export async function getUserRoleInWorkspace(workspaceId, userId) {
  if (!workspaceId || !userId) return null;

  // Root fallback
  if (userId === 'usr-admin') return 'owner';

  const res = await executeQuery(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );

  return res.rows[0]?.role || null;
}

export async function getWorkspaceMembers(workspaceId) {
  const res = await executeQuery(
    'SELECT id, workspace_id, user_id, role, created_at FROM workspace_members WHERE workspace_id = ?',
    [workspaceId]
  );

  const members = [];
  for (const row of res.rows) {
    const user = await getUserById(row.user_id);
    members.push({
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role,
      name: user?.name || 'Usuario',
      email: user?.email || '',
      avatarUrl: user?.avatar_url || '',
      createdAt: row.created_at,
    });
  }

  return members;
}

export async function addWorkspaceMember(workspaceId, { email, role = 'editor' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error(`No se encontró ningún usuario con el correo "${email}"`);
  }

  const existing = await executeQuery(
    'SELECT id, role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, user.id]
  );

  if (existing.rows.length > 0) {
    // Update existing member's role
    await executeQuery(
      'UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?',
      [role, workspaceId, user.id]
    );
    return {
      id: existing.rows[0].id,
      workspaceId,
      userId: user.id,
      role,
      email: user.email,
      name: user.name,
    };
  }

  const memberId = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await executeQuery(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)',
    [memberId, workspaceId, user.id, role]
  );

  return {
    id: memberId,
    workspaceId,
    userId: user.id,
    role,
    email: user.email,
    name: user.name,
  };
}

export async function updateMemberRole(workspaceId, userId, newRole) {
  const validRoles = ['owner', 'admin', 'editor', 'viewer'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Rol inválido: ${newRole}`);
  }

  await executeQuery(
    'UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?',
    [newRole, workspaceId, userId]
  );

  return { success: true, workspaceId, userId, role: newRole };
}

export async function removeWorkspaceMember(workspaceId, userId) {
  const currentRole = await getUserRoleInWorkspace(workspaceId, userId);
  if (currentRole === 'owner') {
    // Check if there are other owners
    const members = await executeQuery(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND role = ?',
      [workspaceId, 'owner']
    );
    if (members.rows.length <= 1) {
      throw new Error('No se puede eliminar al único propietario del espacio de trabajo');
    }
  }

  await executeQuery(
    'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );

  return { success: true };
}

export default {
  createWorkspace,
  getWorkspaceById,
  listUserWorkspaces,
  getUserRoleInWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};
