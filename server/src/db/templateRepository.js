import { executeQuery } from './connection.js';

export async function listTemplates(workspaceId, options = {}) {
  const { search = '', isFavorite = null } = options;

  let sql = 'SELECT * FROM templates WHERE workspace_id = ?';
  const params = [workspaceId];

  if (isFavorite !== null) {
    sql += ' AND is_favorite = ?';
    params.push(isFavorite ? 1 : 0);
  }

  sql += ' ORDER BY updated_at DESC';

  const res = await executeQuery(sql, params);
  let list = res.rows || [];

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    list = list.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.subject && t.subject.toLowerCase().includes(term))
    );
  }

  // Attach latest version summary
  const enriched = await Promise.all(
    list.map(async (tmpl) => {
      const vRes = await executeQuery(
        'SELECT version_number, blocks, created_at FROM template_versions WHERE template_id = ? ORDER BY version_number DESC LIMIT 1',
        [tmpl.id]
      );
      const latestVer = vRes.rows[0] || null;
      let blockCount = 0;
      if (latestVer) {
        const parsedBlocks =
          typeof latestVer.blocks === 'string'
            ? JSON.parse(latestVer.blocks)
            : latestVer.blocks || [];
        blockCount = parsedBlocks.length;
      }

      return {
        ...tmpl,
        is_favorite: Boolean(tmpl.is_favorite),
        latest_version: latestVer ? latestVer.version_number : 1,
        block_count: blockCount,
      };
    })
  );

  return enriched;
}

export async function getTemplateById(id, workspaceId = null) {
  let sql = 'SELECT * FROM templates WHERE id = ?';
  const params = [id];

  if (workspaceId) {
    sql += ' AND workspace_id = ?';
    params.push(workspaceId);
  }

  const tmplRes = await executeQuery(sql, params);
  if (tmplRes.rows.length === 0) return null;

  const template = tmplRes.rows[0];

  // Fetch latest version
  const vRes = await executeQuery(
    'SELECT * FROM template_versions WHERE template_id = ? ORDER BY version_number DESC LIMIT 1',
    [template.id]
  );
  const latestVer = vRes.rows[0] || null;

  let globalSettings = {};
  let blocks = [];

  if (latestVer) {
    globalSettings =
      typeof latestVer.global_settings === 'string'
        ? JSON.parse(latestVer.global_settings)
        : latestVer.global_settings || {};
    blocks =
      typeof latestVer.blocks === 'string'
        ? JSON.parse(latestVer.blocks)
        : latestVer.blocks || [];
  }

  return {
    ...template,
    is_favorite: Boolean(template.is_favorite),
    version_number: latestVer ? latestVer.version_number : 1,
    change_summary: latestVer ? latestVer.change_summary : '',
    global_settings: globalSettings,
    blocks,
  };
}

export async function createTemplate({
  workspaceId,
  name,
  description = '',
  subject = '',
  previewText = '',
  globalSettings = {},
  blocks = [],
  changeSummary = 'Versión inicial',
  createdBy = 'user',
  isFavorite = false,
}) {
  const id = `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await executeQuery(
    'INSERT INTO templates (id, workspace_id, name, description, subject, preview_text, is_favorite, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      workspaceId,
      name,
      description,
      subject,
      previewText,
      isFavorite ? 1 : 0,
      createdBy,
    ]
  );

  const versionId = `ver-${id}-1`;
  await executeQuery(
    'INSERT INTO template_versions (id, template_id, version_number, subject, preview_text, global_settings, blocks, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      versionId,
      id,
      1,
      subject,
      previewText,
      JSON.stringify(globalSettings),
      JSON.stringify(blocks),
      changeSummary,
      createdBy,
    ]
  );

  return {
    id,
    workspace_id: workspaceId,
    name,
    description,
    subject,
    preview_text: previewText,
    is_favorite: Boolean(isFavorite),
    version_number: 1,
    global_settings: globalSettings,
    blocks,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
}

export async function updateTemplate(id, workspaceId, data = {}) {
  const existing = await getTemplateById(id, workspaceId);
  if (!existing) return null;

  const {
    name = existing.name,
    description = existing.description,
    subject = existing.subject,
    previewText = existing.preview_text,
    globalSettings = existing.global_settings,
    blocks = existing.blocks,
    changeSummary = 'Actualización de diseño',
    isFavorite = existing.is_favorite,
    createdBy = 'user',
  } = data;

  // Determine next version number
  const vRes = await executeQuery(
    'SELECT version_number FROM template_versions WHERE template_id = ? ORDER BY version_number DESC LIMIT 1',
    [id]
  );
  const nextVersionNumber = (vRes.rows[0]?.version_number || 0) + 1;
  const versionId = `ver-${id}-${nextVersionNumber}`;

  // Insert new version
  await executeQuery(
    'INSERT INTO template_versions (id, template_id, version_number, subject, preview_text, global_settings, blocks, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      versionId,
      id,
      nextVersionNumber,
      subject,
      previewText,
      JSON.stringify(globalSettings),
      JSON.stringify(blocks),
      changeSummary,
      createdBy,
    ]
  );

  // Update template
  await executeQuery(
    'UPDATE templates SET name = ?, description = ?, subject = ?, preview_text = ?, is_favorite = ? WHERE id = ?',
    [name, description, subject, previewText, isFavorite ? 1 : 0, id]
  );

  return {
    ...existing,
    name,
    description,
    subject,
    preview_text: previewText,
    is_favorite: Boolean(isFavorite),
    version_number: nextVersionNumber,
    global_settings: globalSettings,
    blocks,
    change_summary: changeSummary,
  };
}

export async function deleteTemplate(id, workspaceId) {
  const existing = await getTemplateById(id, workspaceId);
  if (!existing) return false;

  await executeQuery('DELETE FROM template_versions WHERE template_id = ?', [id]);
  await executeQuery('DELETE FROM templates WHERE id = ?', [id]);
  return true;
}

export async function listVersions(templateId) {
  const res = await executeQuery(
    'SELECT id, template_id, version_number, subject, preview_text, change_summary, created_by, created_at, blocks FROM template_versions WHERE template_id = ? ORDER BY version_number DESC',
    [templateId]
  );

  return (res.rows || []).map((v) => {
    let blockCount = 0;
    if (v.blocks) {
      const b = typeof v.blocks === 'string' ? JSON.parse(v.blocks) : v.blocks;
      blockCount = Array.isArray(b) ? b.length : 0;
    }
    return {
      id: v.id,
      template_id: v.template_id,
      version_number: v.version_number,
      subject: v.subject,
      preview_text: v.preview_text,
      change_summary: v.change_summary || `Versión ${v.version_number}`,
      created_by: v.created_by,
      created_at: v.created_at,
      block_count: blockCount,
    };
  });
}

export async function getVersionById(templateId, versionId) {
  const res = await executeQuery(
    'SELECT * FROM template_versions WHERE template_id = ? AND id = ?',
    [templateId, versionId]
  );
  if (res.rows.length === 0) return null;

  const ver = res.rows[0];
  return {
    ...ver,
    global_settings:
      typeof ver.global_settings === 'string'
        ? JSON.parse(ver.global_settings)
        : ver.global_settings || {},
    blocks:
      typeof ver.blocks === 'string'
        ? JSON.parse(ver.blocks)
        : ver.blocks || [],
  };
}

export async function restoreVersion(templateId, versionId, createdBy = 'user') {
  const targetVer = await getVersionById(templateId, versionId);
  if (!targetVer) return null;

  const template = await getTemplateById(templateId);
  if (!template) return null;

  // Next version
  const vRes = await executeQuery(
    'SELECT version_number FROM template_versions WHERE template_id = ? ORDER BY version_number DESC LIMIT 1',
    [templateId]
  );
  const nextVer = (vRes.rows[0]?.version_number || 0) + 1;
  const newVerId = `ver-${templateId}-${nextVer}`;
  const changeSummary = `Restaurado desde versión #${targetVer.version_number}`;

  await executeQuery(
    'INSERT INTO template_versions (id, template_id, version_number, subject, preview_text, global_settings, blocks, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newVerId,
      templateId,
      nextVer,
      targetVer.subject,
      targetVer.preview_text || '',
      JSON.stringify(targetVer.global_settings),
      JSON.stringify(targetVer.blocks),
      changeSummary,
      createdBy,
    ]
  );

  await executeQuery(
    'UPDATE templates SET subject = ?, preview_text = ? WHERE id = ?',
    [targetVer.subject, targetVer.preview_text || '', templateId]
  );

  return {
    ...template,
    subject: targetVer.subject,
    preview_text: targetVer.preview_text || '',
    version_number: nextVer,
    global_settings: targetVer.global_settings,
    blocks: targetVer.blocks,
    change_summary: changeSummary,
  };
}

export async function duplicateTemplate(templateId, workspaceId, newName, createdBy = 'user') {
  const original = await getTemplateById(templateId, workspaceId);
  if (!original) return null;

  return createTemplate({
    workspaceId,
    name: newName || `${original.name} (Copia)`,
    description: original.description,
    subject: original.subject,
    previewText: original.preview_text,
    globalSettings: original.global_settings,
    blocks: original.blocks,
    changeSummary: `Duplicado desde "${original.name}"`,
    createdBy,
    isFavorite: false,
  });
}

export default {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listVersions,
  getVersionById,
  restoreVersion,
  duplicateTemplate,
};
