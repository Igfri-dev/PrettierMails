import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import templateRepo from '../server/src/db/templateRepository.js';

describe('Template Repository & Versioning System', () => {
  const workspaceId = 'ws-test-repo';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('creates template and initial version 1', async () => {
    const created = await templateRepo.createTemplate({
      workspaceId,
      name: 'Plantilla de Lanzamiento',
      subject: '¡Gran Lanzamiento 2026!',
      previewText: 'No te pierdas las novedades',
      globalSettings: { backgroundColor: '#0f172a' },
      blocks: [{ id: 'b-1', type: 'heading', data: { content: 'Bienvenido' } }],
      changeSummary: 'Creación inicial',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Plantilla de Lanzamiento');
    expect(created.version_number).toBe(1);
    expect(created.blocks.length).toBe(1);
    expect(created.blocks[0].data.content).toBe('Bienvenido');
  });

  it('updates template and creates sequential version 2 with change summary', async () => {
    const created = await templateRepo.createTemplate({
      workspaceId,
      name: 'Venta Flash',
      subject: 'Descuento 50%',
      blocks: [{ id: 'b-1', type: 'text', data: { content: 'Texto inicial' } }],
    });

    const updated = await templateRepo.updateTemplate(created.id, workspaceId, {
      subject: 'Descuento 70% Extendido',
      blocks: [
        { id: 'b-1', type: 'text', data: { content: 'Texto inicial' } },
        { id: 'b-2', type: 'button', data: { text: 'Comprar Ahora' } },
      ],
      changeSummary: 'Añadido botón de compra',
    });

    expect(updated.version_number).toBe(2);
    expect(updated.subject).toBe('Descuento 70% Extendido');
    expect(updated.blocks.length).toBe(2);

    // Verify version history
    const versions = await templateRepo.listVersions(created.id);
    expect(versions.length).toBe(2);
    expect(versions[0].version_number).toBe(2);
    expect(versions[0].change_summary).toBe('Añadido botón de compra');
    expect(versions[1].version_number).toBe(1);
  });

  it('restores previous version and appends a new version entry', async () => {
    // Version 1
    const created = await templateRepo.createTemplate({
      workspaceId,
      name: 'Boletín Mensual',
      subject: 'Edición #1',
      blocks: [{ id: 'b-1', type: 'heading', data: { content: 'Titular v1' } }],
    });

    const v1List = await templateRepo.listVersions(created.id);
    const v1Id = v1List[0].id;

    // Version 2
    await templateRepo.updateTemplate(created.id, workspaceId, {
      subject: 'Edición #2 Modificada',
      blocks: [{ id: 'b-1', type: 'heading', data: { content: 'Titular v2' } }],
      changeSummary: 'Modificación errónea',
    });

    // Restore to Version 1
    const restored = await templateRepo.restoreVersion(created.id, v1Id, 'admin');
    expect(restored.version_number).toBe(3);
    expect(restored.subject).toBe('Edición #1');
    expect(restored.blocks[0].data.content).toBe('Titular v1');
    expect(restored.change_summary).toContain('Restaurado desde versión #1');

    const versions = await templateRepo.listVersions(created.id);
    expect(versions.length).toBe(3);
    expect(versions[0].version_number).toBe(3);
  });

  it('duplicates template into a fresh standalone copy', async () => {
    const original = await templateRepo.createTemplate({
      workspaceId,
      name: 'Plantilla Base',
      subject: 'Asunto Base',
      blocks: [{ id: 'b-1', type: 'image', data: { url: 'https://img.test' } }],
    });

    const duplicate = await templateRepo.duplicateTemplate(
      original.id,
      workspaceId,
      'Plantilla Base (Copia VIP)'
    );

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toBe('Plantilla Base (Copia VIP)');
    expect(duplicate.version_number).toBe(1);
    expect(duplicate.blocks.length).toBe(1);
  });

  it('deletes template and cascades to delete all version history', async () => {
    const created = await templateRepo.createTemplate({
      workspaceId,
      name: 'Para Borrar',
      blocks: [],
    });

    await templateRepo.updateTemplate(created.id, workspaceId, { changeSummary: 'Ver 2' });
    expect((await templateRepo.listVersions(created.id)).length).toBe(2);

    const deleted = await templateRepo.deleteTemplate(created.id, workspaceId);
    expect(deleted).toBe(true);

    const notFound = await templateRepo.getTemplateById(created.id, workspaceId);
    expect(notFound).toBeNull();

    const emptyVersions = await templateRepo.listVersions(created.id);
    expect(emptyVersions.length).toBe(0);
  });
});
