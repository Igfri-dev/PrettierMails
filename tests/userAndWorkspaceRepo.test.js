import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders, DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID } from '../server/src/db/seeders.js';
import { createUser, verifyUser, getUserById, getUserByEmail, updateUserProfile } from '../server/src/db/userRepository.js';
import {
  createWorkspace,
  getWorkspaceById,
  listUserWorkspaces,
  getUserRoleInWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from '../server/src/db/workspaceRepository.js';

describe('User & Workspace Repository (RBAC & Multi-Tenancy)', () => {
  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    await runMigrations();
    await runSeeders();
  });

  it('creates a user with hashed password and personal workspace', async () => {
    const email = `test-${Date.now()}@domain.com`;
    const res = await createUser({
      email,
      password: 'StrongPassword123!',
      name: 'Maria Garcia',
    });

    expect(res.user.id).toBeDefined();
    expect(res.user.email).toBe(email);
    expect(res.user.name).toBe('Maria Garcia');
    expect(res.user.password_hash).toBeUndefined(); // Should not leak hash

    expect(res.workspace.id).toBeDefined();
    expect(res.workspace.name).toContain('Maria Garcia');
    expect(res.workspace.role).toBe('owner');
  });

  it('verifies valid password and rejects invalid password', async () => {
    const email = `auth-check-${Date.now()}@domain.com`;
    await createUser({
      email,
      password: 'CorrectPassword!',
      name: 'Carlos Ruiz',
    });

    const validUser = await verifyUser(email, 'CorrectPassword!');
    expect(validUser).not.toBeNull();
    expect(validUser.email).toBe(email);

    const invalidUser = await verifyUser(email, 'WrongPassword!');
    expect(invalidUser).toBeNull();
  });

  it('manages workspace memberships and RBAC roles', async () => {
    // 1. Create owner
    const owner = await createUser({
      email: `owner-${Date.now()}@domain.com`,
      password: 'OwnerPassword!',
      name: 'Empresa Owner',
    });

    // 2. Create editor
    const editor = await createUser({
      email: `editor-${Date.now()}@domain.com`,
      password: 'EditorPassword!',
      name: 'Editor Team',
    });

    const wsId = owner.workspace.id;

    // Check owner role
    const ownerRole = await getUserRoleInWorkspace(wsId, owner.user.id);
    expect(ownerRole).toBe('owner');

    // Add editor
    const added = await addWorkspaceMember(wsId, {
      email: editor.user.email,
      role: 'editor',
    });
    expect(added.role).toBe('editor');

    // Verify role of editor
    const editorRole = await getUserRoleInWorkspace(wsId, editor.user.id);
    expect(editorRole).toBe('editor');

    // Update role to admin
    await updateMemberRole(wsId, editor.user.id, 'admin');
    const updatedRole = await getUserRoleInWorkspace(wsId, editor.user.id);
    expect(updatedRole).toBe('admin');

    // List members
    const members = await getWorkspaceMembers(wsId);
    expect(members.length).toBe(2);

    // Remove editor
    await removeWorkspaceMember(wsId, editor.user.id);
    const roleAfterRemoval = await getUserRoleInWorkspace(wsId, editor.user.id);
    expect(roleAfterRemoval).toBeNull();
  });
});
