import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeders } from '../server/src/db/seeders.js';
import { createTemplate, listTemplates, getTemplateById } from '../server/src/db/templateRepository.js';
import { createWorkspace } from '../server/src/db/workspaceRepository.js';
import { createUser } from '../server/src/db/userRepository.js';
import { ROLE_HIERARCHY } from '../server/src/middlewares/auth.js';

describe('Workspace Multi-Tenancy & Template Isolation', () => {
  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    await runMigrations();
    await runSeeders();
  });

  it('isolates templates strictly between different workspaces', async () => {
    // 1. Create two distinct users and workspaces
    const userA = await createUser({
      email: `user-a-${Date.now()}@alpha.com`,
      password: 'AlphaPassword1!',
      name: 'User Alpha',
    });

    const userB = await createUser({
      email: `user-b-${Date.now()}@beta.com`,
      password: 'BetaPassword1!',
      name: 'User Beta',
    });

    const wsAlphaId = userA.workspace.id;
    const wsBetaId = userB.workspace.id;

    // 2. Create template in Workspace Alpha
    const tmplAlpha = await createTemplate({
      workspaceId: wsAlphaId,
      name: 'Alpha Secret Campaign',
      subject: 'Top Secret Alpha',
      previewText: 'Alpha only',
      createdBy: userA.user.id,
      blocks: [{ id: 'b1', type: 'heading', data: { text: 'Alpha Heading' } }],
    });

    // 3. Create template in Workspace Beta
    const tmplBeta = await createTemplate({
      workspaceId: wsBetaId,
      name: 'Beta Public Newsletter',
      subject: 'Public Beta',
      previewText: 'Beta only',
      createdBy: userB.user.id,
      blocks: [{ id: 'b2', type: 'heading', data: { text: 'Beta Heading' } }],
    });

    // 4. Listing templates in Workspace Alpha should ONLY return Alpha's templates
    const alphaTemplates = await listTemplates(wsAlphaId);
    const alphaIds = alphaTemplates.map((t) => t.id);
    expect(alphaIds).toContain(tmplAlpha.id);
    expect(alphaIds).not.toContain(tmplBeta.id);

    // 5. Listing templates in Workspace Beta should ONLY return Beta's templates
    const betaTemplates = await listTemplates(wsBetaId);
    const betaIds = betaTemplates.map((t) => t.id);
    expect(betaIds).toContain(tmplBeta.id);
    expect(betaIds).not.toContain(tmplAlpha.id);

    // 6. Direct query: Workspace Beta cannot get Alpha's template
    const leakedTemplate = await getTemplateById(tmplAlpha.id, wsBetaId);
    expect(leakedTemplate).toBeNull();

    // 7. Workspace Alpha can retrieve its own template
    const validAlphaTemplate = await getTemplateById(tmplAlpha.id, wsAlphaId);
    expect(validAlphaTemplate).not.toBeNull();
    expect(validAlphaTemplate.name).toBe('Alpha Secret Campaign');
  });

  it('validates hierarchical RBAC role permissions', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.editor);
    expect(ROLE_HIERARCHY.editor).toBeGreaterThan(ROLE_HIERARCHY.viewer);

    // Check helper evaluation logic
    const canEditorDelete = ROLE_HIERARCHY.editor >= ROLE_HIERARCHY.admin;
    expect(canEditorDelete).toBe(false);

    const canAdminDelete = ROLE_HIERARCHY.admin >= ROLE_HIERARCHY.admin;
    expect(canAdminDelete).toBe(true);

    const canViewerEdit = ROLE_HIERARCHY.viewer >= ROLE_HIERARCHY.editor;
    expect(canViewerEdit).toBe(false);

    const canOwnerAll = ROLE_HIERARCHY.owner >= ROLE_HIERARCHY.viewer &&
                        ROLE_HIERARCHY.owner >= ROLE_HIERARCHY.editor &&
                        ROLE_HIERARCHY.owner >= ROLE_HIERARCHY.admin;
    expect(canOwnerAll).toBe(true);
  });
});
