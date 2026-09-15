import { executeQuery } from './connection.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

/**
 * User Repository for PrettierMails
 */
export async function createUser({ email, password, name, avatarUrl = '' }) {
  if (!email || !password || !name) {
    throw new Error('Email, contraseña y nombre son obligatorios');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new Error('Ya existe una cuenta registrada con este correo electrónico');
  }

  const passwordHash = await hashPassword(password);
  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = name.trim();

  // 1. Insert user
  await executeQuery(
    'INSERT INTO users (id, email, name, avatar_url, password_hash) VALUES (?, ?, ?, ?, ?)',
    [userId, normalizedEmail, cleanName, avatarUrl || '', passwordHash]
  );

  // 2. Create personal default workspace
  const workspaceId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const slug = `ws-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
  const workspaceName = `Espacio de ${cleanName}`;

  await executeQuery(
    'INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)',
    [workspaceId, workspaceName, slug]
  );

  // 3. Add user as owner of the workspace
  const memberId = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await executeQuery(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)',
    [memberId, workspaceId, userId, 'owner']
  );

  const user = {
    id: userId,
    email: normalizedEmail,
    name: cleanName,
    avatar_url: avatarUrl || '',
    created_at: new Date().toISOString(),
  };

  const workspace = {
    id: workspaceId,
    name: workspaceName,
    slug,
    role: 'owner',
  };

  return { user, workspace };
}

export async function verifyUser(email, password) {
  if (!email || !password) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const res = await executeQuery('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  if (res.rows.length === 0) return null;

  const user = res.rows[0];
  if (!user.password_hash) return null;

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url || '',
    created_at: user.created_at,
  };
}

export async function getUserById(id) {
  const res = await executeQuery('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?', [id]);
  return res.rows[0] || null;
}

export async function getUserByEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const res = await executeQuery('SELECT id, email, name, avatar_url, created_at FROM users WHERE email = ?', [normalizedEmail]);
  return res.rows[0] || null;
}

export async function updateUserProfile(id, { name, avatarUrl }) {
  const current = await getUserById(id);
  if (!current) throw new Error('Usuario no encontrado');

  const newName = name !== undefined ? name.trim() : current.name;
  const newAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url;

  await executeQuery(
    'UPDATE users SET name = ?, avatar_url = ? WHERE id = ?',
    [newName, newAvatar, id]
  );

  return {
    ...current,
    name: newName,
    avatar_url: newAvatar,
  };
}

export default {
  createUser,
  verifyUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
};
