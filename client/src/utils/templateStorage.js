import { compileFullEmailHtml } from './emailCompiler.js';

const STORAGE_KEY = 'prettier_mails_custom_templates';

/**
 * Retrieves all custom templates stored in localStorage
 * @returns {Array} List of custom template objects
 */
export function getSavedTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading custom templates from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new custom template to localStorage
 * @param {Object} params
 * @param {string} params.name
 * @param {string} [params.description]
 * @param {string} [params.subject]
 * @param {Object} params.globalSettings
 * @param {Array} params.blocks
 * @returns {Object} The saved template
 */
export function saveCustomTemplate({
  name,
  description = '',
  subject = '',
  globalSettings,
  blocks,
}) {
  const existing = getSavedTemplates();
  const newTemplate = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name?.trim() || 'Mi Plantilla Personalizada',
    description: description?.trim() || '',
    subject: subject?.trim() || '',
    createdAt: new Date().toISOString(),
    globalSettings: globalSettings ? JSON.parse(JSON.stringify(globalSettings)) : {},
    blocks: blocks ? JSON.parse(JSON.stringify(blocks)) : [],
  };

  const updated = [newTemplate, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save template to localStorage:', err);
    throw new Error('No se pudo guardar la plantilla. Puede que el almacenamiento local esté lleno.');
  }

  return newTemplate;
}

/**
 * Deletes a custom template by its ID
 * @param {string} templateId
 * @returns {Array} The updated list of templates
 */
export function deleteCustomTemplate(templateId) {
  const existing = getSavedTemplates();
  const updated = existing.filter((t) => t.id !== templateId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete template from localStorage:', err);
  }
  return updated;
}

/**
 * Triggers a browser download of an email template as a standalone HTML file
 * with embedded metadata for seamless re-import.
 * @param {Object} params
 */
export function downloadTemplateAsHtml({
  name = 'email-template',
  subject = 'PrettierMails Email',
  globalSettings = {},
  blocks = [],
}) {
  const fullHtml = compileFullEmailHtml({
    blocks,
    globalSettings,
    subject,
    includeMetadata: true,
  });

  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'email-template';

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses an HTML or JSON string, extracting PrettierMails blocks, settings and subject.
 * Supports:
 * 1. Embedded <script id="prettier-mails-template-data">
 * 2. Embedded <!-- PRETTIER_MAILS_METADATA_START ... -->
 * 3. Raw JSON export
 * 4. Fallback DOM extraction for standard HTML emails
 *
 * @param {string} fileContent
 * @returns {{ success: boolean, template?: Object, error?: string, source?: string }}
 */
export function parseTemplateFromHtml(fileContent) {
  if (!fileContent || typeof fileContent !== 'string') {
    return { success: false, error: 'El archivo está vacío o el formato no es válido.' };
  }

  const trimmed = fileContent.trim();

  // 1. Try parsing as raw JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const data = parsed.template || parsed;
      if (Array.isArray(data.blocks)) {
        return {
          success: true,
          source: 'json',
          template: {
            name: data.name || data.subject || 'Plantilla Importada',
            subject: data.subject || '',
            globalSettings: data.globalSettings || {},
            blocks: data.blocks,
          },
        };
      }
    } catch (_) {
      // Continue to HTML extraction
    }
  }

  // 2. Try extracting from <script type="application/json" id="prettier-mails-template-data">
  try {
    const scriptMatch = fileContent.match(/<script[^>]*id=["']prettier-mails-template-data["'][^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch && scriptMatch[1]) {
      const metadata = JSON.parse(scriptMatch[1].trim());
      if (Array.isArray(metadata.blocks)) {
        return {
          success: true,
          source: 'metadata-script',
          template: {
            name: metadata.name || metadata.subject || 'Plantilla Restaurada',
            subject: metadata.subject || '',
            globalSettings: metadata.globalSettings || {},
            blocks: metadata.blocks,
          },
        };
      }
    }
  } catch (err) {
    console.warn('Could not parse metadata script tag:', err);
  }

  // 3. Try extracting from comment <!-- PRETTIER_MAILS_METADATA_START ... -->
  try {
    const commentMatch = fileContent.match(/<!--\s*PRETTIER_MAILS_METADATA_START([\s\S]*?)PRETTIER_MAILS_METADATA_END\s*-->/i);
    if (commentMatch && commentMatch[1]) {
      const metadata = JSON.parse(commentMatch[1].trim());
      if (Array.isArray(metadata.blocks)) {
        return {
          success: true,
          source: 'metadata-comment',
          template: {
            name: metadata.name || metadata.subject || 'Plantilla Restaurada',
            subject: metadata.subject || '',
            globalSettings: metadata.globalSettings || {},
            blocks: metadata.blocks,
          },
        };
      }
    }
  } catch (err) {
    console.warn('Could not parse metadata comment:', err);
  }

  // 4. Fallback: Parse generic HTML structure into PrettierMails blocks
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, 'text/html');

    const titleEl = doc.querySelector('title');
    const detectedSubject = titleEl ? titleEl.textContent.trim() : 'Correo Importado';

    const recoveredBlocks = [];
    const elements = doc.querySelectorAll('h1, h2, h3, p, img, a, hr, iframe');

    elements.forEach((el, idx) => {
      const tagName = el.tagName.toLowerCase();
      const uniqueId = `imported-${Date.now()}-${idx}`;

      if (['h1', 'h2', 'h3'].includes(tagName)) {
        const text = el.textContent.trim();
        if (text) {
          recoveredBlocks.push({
            id: uniqueId,
            type: 'heading',
            data: {
              content: text,
              fontSize: tagName === 'h1' ? '28px' : tagName === 'h2' ? '24px' : '20px',
              fontWeight: '700',
              color: '#0f172a',
              textAlign: 'left',
              paddingTop: '10px',
              paddingBottom: '8px',
            },
          });
        }
      } else if (tagName === 'p') {
        const text = el.textContent.trim();
        if (text) {
          recoveredBlocks.push({
            id: uniqueId,
            type: 'text',
            data: {
              content: text,
              fontSize: '15px',
              fontWeight: '400',
              color: '#334155',
              textAlign: 'left',
              lineHeight: '1.6',
              paddingTop: '6px',
              paddingBottom: '6px',
            },
          });
        }
      } else if (tagName === 'img') {
        const src = el.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          recoveredBlocks.push({
            id: uniqueId,
            type: 'image',
            data: {
              url: src,
              alt: el.getAttribute('alt') || 'Imagen importada',
              width: '100%',
              borderRadius: '12px',
              alignment: 'center',
              paddingTop: '10px',
              paddingBottom: '10px',
            },
          });
        }
      } else if (tagName === 'a') {
        const href = el.getAttribute('href');
        const text = el.textContent.trim();
        if (text && href && (el.className.includes('button') || el.className.includes('btn') || el.style.backgroundColor)) {
          recoveredBlocks.push({
            id: uniqueId,
            type: 'button',
            data: {
              text: text,
              url: href,
              backgroundColor: '#4f46e5',
              textColor: '#ffffff',
              borderRadius: '9999px',
              alignment: 'center',
              paddingX: '24px',
              paddingY: '12px',
              paddingTop: '12px',
              paddingBottom: '12px',
            },
          });
        }
      } else if (tagName === 'hr') {
        recoveredBlocks.push({
          id: uniqueId,
          type: 'divider',
          data: {
            color: '#e2e8f0',
            thickness: '1px',
            style: 'solid',
            paddingTop: '14px',
            paddingBottom: '14px',
          },
        });
      }
    });

    if (recoveredBlocks.length > 0) {
      return {
        success: true,
        source: 'html-fallback',
        template: {
          name: detectedSubject,
          subject: detectedSubject,
          globalSettings: {
            backgroundColor: '#f1f5f9',
            contentBackgroundColor: '#ffffff',
            contentWidth: '600px',
            borderRadius: '16px',
            textColor: '#1e293b',
            padding: '32px',
          },
          blocks: recoveredBlocks,
        },
      };
    }
  } catch (fallbackErr) {
    console.warn('Fallback HTML parser failed:', fallbackErr);
  }

  return {
    success: false,
    error: 'No se detectó una plantilla válida de PrettierMails en el archivo seleccionado.',
  };
}
