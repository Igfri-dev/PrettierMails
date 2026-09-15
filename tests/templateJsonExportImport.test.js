import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from '../server/node_modules/express/index.js';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import templateRoutes from '../server/src/routes/templates.js';
import { signToken } from '../server/src/utils/crypto.js';
import { createWorkspace, addWorkspaceMember } from '../server/src/db/workspaceRepository.js';
import { createUser } from '../server/src/db/userRepository.js';
import { createTemplate } from '../server/src/db/templateRepository.js';

describe('Template JSON Export and Import API Endpoints', () => {
  let server;
  let baseUrl;
  let token;
  let workspaceId;
  let userId;

  beforeAll(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();

    const created = await createUser({
      email: 'designer@prettiermails.com',
      password: 'Password123!',
      name: 'Design Lead',
    });
    userId = created.user.id;

    const ws = await createWorkspace({
      name: 'Design Studio WS',
      ownerUserId: userId,
    });
    workspaceId = ws.id;

    await addWorkspaceMember(workspaceId, { email: 'designer@prettiermails.com', role: 'admin' });

    token = signToken({
      userId,
      email: 'designer@prettiermails.com',
      workspaceId,
      role: 'admin',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/templates', templateRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    resetConnectionForTesting();
  });

  it('exports a template as a JSON bundle and imports it back with full fidelity', async () => {
    // 1. Create a template to export
    const initialTmpl = await createTemplate({
      workspaceId,
      name: 'Newsletter Verano 2026',
      description: 'Edición especial para clientes premium',
      subject: '¡Llegaron las novedades de verano!',
      previewText: 'Descuentos exclusivos y más...',
      globalSettings: { maxWidth: 640, backgroundColor: '#f8fafc' },
      blocks: [
        { id: 'b1', type: 'header', content: { title: 'Verano 2026' } },
        { id: 'b2', type: 'text', content: { text: '¡Aprovecha nuestras ofertas!' } },
      ],
      createdBy: userId,
      isFavorite: true,
    });

    // 2. Export template as JSON
    const exportRes = await fetch(`${baseUrl}/api/templates/${initialTmpl.id}/export-json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });

    expect(exportRes.status).toBe(200);
    const exportBody = await exportRes.json();
    expect(exportBody.schemaVersion).toBe('1.0');
    expect(exportBody.template.name).toBe('Newsletter Verano 2026');
    expect(exportBody.template.blocks.length).toBe(2);
    expect(exportBody.template.globalSettings.maxWidth).toBe(640);

    // 3. Import the exported bundle into the workspace
    exportBody.template.name = 'Newsletter Verano 2026 (Copia Importada)';
    const importRes = await fetch(`${baseUrl}/api/templates/import-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify(exportBody),
    });

    expect(importRes.status).toBe(201);
    const importBody = await importRes.json();
    expect(importBody.success).toBe(true);
    expect(importBody.data.id).toMatch(/^tmpl-/);
    expect(importBody.data.name).toBe('Newsletter Verano 2026 (Copia Importada)');
    expect(importBody.data.blocks.length).toBe(2);
    expect(importBody.data.blocks[0].type).toBe('header');
  });

  it('returns 404 when exporting a non-existent template', async () => {
    const res = await fetch(`${baseUrl}/api/templates/non-existent-tmpl/export-json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
