import { executeQuery } from './connection.js';

export const DEFAULT_WORKSPACE_ID = 'ws-default';
export const DEFAULT_USER_ID = 'usr-admin';

export const SEED_TEMPLATES = [
  {
    id: 'tmpl-corporate-onboarding',
    name: 'Bienvenida al Equipo (Grid Logo + Tabla)',
    description: 'Cabecera con logo a la izquierda y texto a la derecha, junto con una tabla estilizada de credenciales y accesos para nuevos miembros.',
    subject: '🎉 ¡Bienvenido(a) a NovaTech! Credenciales de acceso y bienvenida oficial',
    preview_text: 'Tus credenciales y accesos para el primer día de trabajo.',
    is_favorite: true,
    global_settings: {
      backgroundColor: '#f1f5f9',
      contentBackgroundColor: '#ffffff',
      contentWidth: '600px',
      borderRadius: '16px',
      textColor: '#1e293b',
      padding: '36px',
    },
    blocks: [
      {
        id: 'tmpl-grid-1',
        type: 'grid',
        data: {
          layout: '30-70',
          verticalAlign: 'middle',
          gap: '16px',
          backgroundColor: 'transparent',
          borderRadius: '0px',
          paddingTop: '8px',
          paddingBottom: '16px',
          leftType: 'image',
          leftImage: {
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
            alt: 'Logo NovaTech',
            width: '90px',
            maxWidth: '110px',
            borderRadius: '10px',
            alignment: 'center',
          },
          rightType: 'text',
          rightText: {
            heading: 'NovaTech Solutions',
            headingSize: '22px',
            headingColor: '#0f172a',
            content: 'Plataforma de Innovación Digital y Servicios Cloud.',
            textColor: '#475569',
            fontSize: '14px',
            lineHeight: '1.5',
            alignment: 'left',
          },
        },
      },
      {
        id: 'tmpl-div-1',
        type: 'divider',
        data: {
          color: '#e2e8f0',
          thickness: '1px',
          style: 'solid',
          paddingTop: '10px',
          paddingBottom: '16px',
        },
      },
      {
        id: 'tmpl-head-1',
        type: 'heading',
        data: {
          content: '¡Bienvenido(a) a bordo del equipo!',
          fontSize: '24px',
          fontWeight: '800',
          color: '#0f172a',
          textAlign: 'left',
          paddingTop: '6px',
          paddingBottom: '8px',
        },
      },
      {
        id: 'tmpl-text-1',
        type: 'text',
        data: {
          content: 'Estamos muy entusiasmados de que comiences tu camino con nosotros. Hemos configurado tus accesos corporativos iniciales.',
          fontSize: '14px',
          fontWeight: '400',
          color: '#334155',
          textAlign: 'left',
          lineHeight: '1.6',
          paddingTop: '4px',
          paddingBottom: '14px',
        },
      },
      {
        id: 'tmpl-table-1',
        type: 'table',
        data: {
          headers: ['Servicio / Recurso', 'Usuario / Identificador', 'Clave / Contraseña'],
          rows: [
            ['Red Wi-Fi Oficinas', 'NovaTech_Team', 'Segura2026*'],
            ['Correo Corporativo', 'usuario@novatech.io', 'Temporal#2026'],
            ['Portal de Empleados', 'novatech.io/portal', 'password'],
          ],
          headerBgColor: '#0f172a',
          headerTextColor: '#ffffff',
          rowBgColor: '#ffffff',
          altRowBgColor: '#f8fafc',
          textColor: '#334155',
          borderColor: '#e2e8f0',
          striped: true,
        },
      },
    ],
  },
  {
    id: 'tmpl-youtube-showcase',
    name: 'Video Tutorial & Lanzamiento (YouTube)',
    description: 'Plantilla de alto impacto con reproductor de YouTube, resumen estructurado y botón CTA.',
    subject: '🎬 Nuevo Video: Cómo crear correos hermosos y responsivos con PrettierMails',
    preview_text: 'Aprende en 10 minutos a maquetar correos que no se rompen.',
    is_favorite: true,
    global_settings: {
      backgroundColor: '#070a10',
      contentBackgroundColor: '#0f172a',
      contentWidth: '600px',
      borderRadius: '20px',
      textColor: '#f8fafc',
      padding: '36px',
    },
    blocks: [
      {
        id: 'block-yt-1',
        type: 'heading',
        data: {
          content: '🔥 Nuevo Video Disponible en Nuestro Canal',
          fontSize: '26px',
          fontWeight: '800',
          color: '#f8fafc',
          textAlign: 'center',
          paddingTop: '8px',
          paddingBottom: '8px',
        },
      },
      {
        id: 'block-yt-2',
        type: 'youtube',
        data: {
          url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
          title: 'Guía Completa: Creación de Correos Profesionales',
          caption: 'Haz clic en reproducir para ver la clase completa.',
          buttonText: 'Ver en YouTube ▶',
          cardBackground: '#0b1120',
          buttonColor: '#ef4444',
          textColor: '#f8fafc',
          borderRadius: '14px',
        },
      },
    ],
  },
];

export async function runSeeders() {
  // 1. Ensure default workspace
  const existingWs = await executeQuery('SELECT id FROM workspaces WHERE id = ?', [DEFAULT_WORKSPACE_ID]);
  if (existingWs.rows.length === 0) {
    await executeQuery(
      'INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)',
      [DEFAULT_WORKSPACE_ID, 'Workspace Principal', 'default']
    );
  }

  // 2. Ensure default admin user
  const existingUser = await executeQuery('SELECT id FROM users WHERE id = ?', [DEFAULT_USER_ID]);
  if (existingUser.rows.length === 0) {
    await executeQuery(
      'INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)',
      [DEFAULT_USER_ID, 'admin@prettiermails.local', 'Administrador', '']
    );
  }

  // 3. Ensure workspace member
  const existingMember = await executeQuery(
    'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID]
  );
  if (existingMember.rows.length === 0) {
    await executeQuery(
      'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)',
      [`wm-${Date.now()}`, DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, 'owner']
    );
  }

  // 4. Seed initial core templates
  for (const tmpl of SEED_TEMPLATES) {
    const existingTmpl = await executeQuery('SELECT id FROM templates WHERE id = ?', [tmpl.id]);
    if (existingTmpl.rows.length === 0) {
      await executeQuery(
        'INSERT INTO templates (id, workspace_id, name, description, subject, preview_text, is_favorite, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          tmpl.id,
          DEFAULT_WORKSPACE_ID,
          tmpl.name,
          tmpl.description,
          tmpl.subject,
          tmpl.preview_text || '',
          tmpl.is_favorite ? 1 : 0,
          DEFAULT_USER_ID,
        ]
      );

      // Create version 1
      await executeQuery(
        'INSERT INTO template_versions (id, template_id, version_number, subject, preview_text, global_settings, blocks, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          `ver-${tmpl.id}-1`,
          tmpl.id,
          1,
          tmpl.subject,
          tmpl.preview_text || '',
          JSON.stringify(tmpl.global_settings),
          JSON.stringify(tmpl.blocks),
          'Versión inicial del sistema',
          DEFAULT_USER_ID,
        ]
      );
    }
  }

  return { success: true, seededCount: SEED_TEMPLATES.length };
}

export default {
  runSeeders,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_USER_ID,
};
