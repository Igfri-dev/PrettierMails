# 📋 Plan de Implementación Maestro: PrettierMails Enterprise Suite

Este documento contiene el diagnóstico integral, análisis técnico, arquitectura objetivo y la hoja de ruta en 9 fases para transformar **PrettierMails** en una plataforma profesional, segura, multi-usuario y multi-motor (**MySQL** por defecto / **PostgreSQL** conmutable).

---

## 1. Arquitectura Actual

El proyecto actual es un MVP funcional con una base sólida pero con componentes monolíticos y almacenamiento cliente:

- **Frontend (`client/`)**:
  - React 18 + Vite 6 + Tailwind CSS 3.4.
  - Navegación de dos vistas (`Dashboard` y `Studio Editor`) en `App.jsx`.
  - 11 tipos de bloques modulares (`heading`, `text`, `image`, `button`, `youtube`, `box`, `divider`, `spacer`, `social`, `grid`, `table`).
  - Monolitos: `StyleInspector.jsx` (1611 líneas), `BlockRenderer.jsx` (704 líneas) y `BlockPicker.jsx` (326 líneas).
  - Compilación HTML para correo en `emailCompiler.js` (716 líneas).
  - Almacenamiento exclusivamente local en `localStorage` (`templateStorage.js`) y descarga de archivos `.html` con metadatos JSON.
- **Backend (`server/`)**:
  - Express 4.21 en un único archivo `index.js` (216 líneas) con CORS y `express-rate-limit`.
  - Despacho Nodemailer en `emailService.js` (Ethereal Email y SMTP personalizado con validación regex básica).
  - Inlining CSS con Juice en `htmlRenderer.js`.
  - Orquestador de IA en `aiService.js` (Google Gemini, OpenAI y fallback inteligente).
  - Sin persistencia en base de datos, sin sesiones/usuarios, sin colas de envío en segundo plano.

---

## 2. Problemas Críticos Encontrados

1. **Violación de Rules of Hooks en Modales**:
   - `AiGeneratorModal.jsx` (línea 44) y `SendEmailModal.jsx` (línea 25) ejecutan `if (!isOpen) return null;` **antes** de inicializar `useState` y otros hooks. Cuando el modal se abre o cierra, cambia el número y orden de hooks invocados, provocando advertencias o comportamientos indefinidos en React.
2. **Monolito de Bloques sin Registro Modular**:
   - Para añadir, modificar o validar un bloque se requiere editar manualmente 4 archivos gigantescos (`BlockPicker`, `BlockRenderer`, `StyleInspector`, `emailCompiler`), dificultando enormemente la mantenibilidad y la adición de nuevos bloques.
3. **Inyección en Serialización de Metadata HTML**:
   - En `emailCompiler.js`, el bloque `<script type="application/json" id="prettier-mails-template-data">` se construye interpolando `JSON.stringify` sin escapar secuencias peligrosas como `</script>` o `-->`, exponiendo al usuario a posibles fugas o inyecciones al abrir el archivo en navegadores o webmails.
4. **HTML Renderer Inseguro en Backend**:
   - En `server/src/htmlRenderer.js`, variables como `${title}` y `${previewText}` se interpolan directamente sin escapar caracteres especiales mediante `escapeHtml`, y `${backgroundColor}` se inserta en atributos HTML y CSS sin validación estricta de color.
5. **SSRF con Riesgo de DNS Rebinding en SMTP**:
   - En `server/src/emailService.js`, la validación de hosts SMTP se limita a una lista negra de patrones de texto (ej. `localhost`, `127.`), pero no resuelve la IP del dominio en DNS antes de conectar, permitiendo que dominios que resuelvan a `127.0.0.1` o IPs internas de metadatos de nube evadan la protección.
6. **Manejo de Errores y Datos Falsos en IA**:
   - En `server/src/aiService.js`, `throw lastError;` puede fallar si `lastError` es nulo. Además, el fallback local inserta credenciales y contraseñas simuladas (`usuario@novatech.io`, contraseñas y enlaces a Rick Astley) en lugar de etiquetas y placeholders evidentes (`{{corporate_email}}`, `{{temporary_password}}`).
7. **Ausencia de Schemas Formales de Validación**:
   - No se utiliza Zod. Las estructuras de documentos de correo, datos de bloques y configuraciones se reciben y procesan sin validación de tipos, tamaños o valores permitidos.
8. **Endpoints de Envío e IA Expuestos sin Autenticación**:
   - `/api/send-email` y `/api/generate-ai-email` carecen de autenticación, control de usuarios, cuotas y roles.
9. **Volatilidad de Datos en LocalStorage**:
   - Si el usuario borra la caché del navegador o ingresa desde otro dispositivo, pierde todas sus plantillas guardadas.

---

## 3. Arquitectura Objetivo

```text
PrettierMails Architecture
│
├── Frontend (React 18 + Vite + Tailwind + Zod + dnd-kit)
│   ├── Block Registry (client/src/blocks/<type>/...)
│   │   ├── schema.js (Validación Zod por bloque)
│   │   ├── defaults.js (Datos por defecto)
│   │   ├── Inspector.jsx (Editor visual del bloque)
│   │   ├── Preview.jsx (Renderizado en canvas)
│   │   ├── compile.js (Compilación a tablas de correo)
│   │   └── index.js (Definición tipada)
│   ├── State Engine (useReducer con Undo/Redo, Autosave debounced)
│   ├── Personalization (Variables {{first_name}}, {{custom.field}} con fallbacks)
│   └── Views (Dashboard, Studio, Campañas, Contactos, Ajustes SMTP, Workspaces)
│
├── Backend Modular (Express / Node.js)
│   ├── Security Middleware (Helmet, CORS seguro, Rate Limiting distribuido)
│   ├── Auth & RBAC (Argon2id/bcrypt, cookies HttpOnly, Roles: owner, admin, editor, viewer)
│   ├── Workspace Isolation (workspace_id forzado en cada consulta)
│   ├── Compiler & Preflight (Juice inlining, CSS strict validator, Safe metadata serializer)
│   └── AI Providers (Gemini Free Tier & OpenAI GPT-4o con interfaces unificadas y Zod parser)
│
├── Dual Database Engine (MySQL predeterminado / PostgreSQL)
│   ├── DB_ENGINE=mysql | postgresql
│   ├── Capa unificada con Drizzle ORM (o Prisma multi-driver)
│   ├── Migraciones y semillas (npm run db:migrate, npm run db:seed)
│   └── Modelos: users, workspaces, members, templates, versions, contacts, campaigns, logs
│
└── Workers y Colas Asíncronas (BullMQ + Redis)
    ├── Campaign Dispatcher (1 recipient = 1 distinct job)
    ├── Throttling y rate limits por cuenta SMTP (ej. 100 emails/min)
    ├── Deliverability & Suppression (Unsubscribe tokens, bounce handling, preflight check)
    └── Generador de miniaturas en background
```

---

## 4. Fases de Implementación

### Fase 1: Estabilización, Corrección de Hooks, Schemas Zod y Seguridad Base ✅ COMPLETADA
- [x] Corregir violaciones de Rules of Hooks en `AiGeneratorModal.jsx` y `SendEmailModal.jsx`.
- [x] Configurar ESLint 9+ flat config con `eslint-plugin-react-hooks` y Prettier.
- [x] Integrar **Zod** para validar el documento global `PrettierMailsDocumentSchema` y datos de bloques en cliente y servidor.
- [x] Sanitizar y validar valores CSS en `emailCompiler.js` y `sanitizer.js` para evitar inyección CSS/HTML.
- [x] Escapar caracteres peligrosos en serialización de metadatos embebidos (`escapeJsonForHtml`).
- [x] Escapar `title` y `previewText` con `escapeHtml` en `server/src/htmlRenderer.js` y validar `backgroundColor`.
- [x] Corregir `throw lastError` en `server/src/aiService.js` y sanitizar el fallback local con placeholders limpios.
- [x] Configurar Vitest con pruebas unitarias para compilador, sanitización y schemas.

### Fase 2: Sistema Modular de Bloques (Block Registry), Undo/Redo y Drag & Drop ✅ COMPLETADA
- [x] Crear `client/src/blocks/` con módulos individuales para los 11 bloques (`heading`, `text`, `box`, `image`, `button`, `youtube`, `divider`, `spacer`, `social`, `grid`, `table`).
- [x] Crear `client/src/blocks/registry.js` como único punto de registro modular y extensible.
- [x] Refactorizar `BlockRenderer.jsx`, `StyleInspector.jsx`, `BlockPicker.jsx` y `emailCompiler.js` para delegar al registro.
- [x] Implementar store global con **Zustand** (`client/src/store/documentStore.js`) con motor de Undo / Redo (hasta 50 snapshots).
- [x] Botones de Deshacer y Rehacer en la barra superior (`Navbar.jsx`) con estados deshabilitados.
- [x] Integrar `@dnd-kit` para reordenar bloques visualmente mediante Drag & Drop (con handles dedicados y manteniendo botones accesibles).
- [x] Atajos de teclado globales: `Ctrl+Z` (Deshacer), `Ctrl+Shift+Z` / `Ctrl+Y` (Rehacer), `Ctrl+C` (Copiar bloque), `Ctrl+V` (Pegar), `Ctrl+D` (Duplicar) y `Delete`/`Backspace` (Eliminar bloque).
- [x] 59 pruebas unitarias automatizadas pasando al 100% en Vitest sin ninguna regresión.

### Fase 3: Capa de Base de Datos Dual (MySQL por Defecto / PostgreSQL), Persistencia y Versionado ✅ COMPLETADA
- [x] Capa de conexión agnóstica (`server/src/db/connection.js`) conmutable vía `DB_ENGINE` (`mysql` por defecto, `postgresql` conmutable) y mock relacional en memoria para desarrollo ágil y CI.
- [x] Migraciones DDL universales (`server/src/db/migrations.js`) para 7 tablas: `workspaces`, `users`, `workspace_members`, `templates`, `template_versions`, `smtp_accounts`, `audit_logs`.
- [x] Seeders idempotentes (`server/src/db/seeders.js`) con workspace por defecto (`ws-default`), usuario admin y plantillas predefinidas v1.
- [x] Repositorio de plantillas y versionado inmutable (`server/src/db/templateRepository.js`): CRUD, incremento secuencial de versiones, resumen de diff, restauración y duplicación.
- [x] API REST completa (`server/src/routes/templates.js`): endpoints `/api/templates`, `/autosave`, `/:id/versions`, `/:id/versions/:versionId/restore`, `/:id/duplicate`.
- [x] Autosave debounced en 1.5s en `App.jsx` con píldora de sincronización en vivo (`Navbar.jsx`).
- [x] Modal de Historial de Versiones (`VersionHistoryModal.jsx`) con inspección de checkpoints y restauración en 1 clic.
- [x] Integración en `Dashboard.jsx` y `TemplatesModal.jsx` con soporte unificado de base de datos (`vX • BD`), borradores locales y plantillas oficiales.
- [x] Scripts CLI: `npm run db:migrate`, `npm run db:seed`, `docker-compose.yml`, `.env.example`.
- [x] 68 pruebas automatizadas pasando al 100% en Vitest across 10 test suites, ESLint limpio con 0 errores y build de Vite exitoso.

### Fase 4: Autenticación, Roles (RBAC), Workspaces y Multi-tenancy ✅ COMPLETADA
- [x] Sesiones seguras con JWT / HMAC-SHA256 y hashing criptográfico de contraseñas (`crypto.scrypt` con salt de 16 bytes).
- [x] Roles jerárquicos por workspace: `owner` (4) > `admin` (3) > `editor` (2) > `viewer` (1).
- [x] Aislamiento multi-tenancy estricto por `workspace_id` en todas las operaciones y endpoints.
- [x] Repositorios de usuarios y workspaces (`userRepository.js`, `workspaceRepository.js`).
- [x] Middlewares de autenticación y verificación de roles (`auth.js`).
- [x] Store de autenticación en Zustand (`authStore.js`) con persistencia en `localStorage`.
- [x] Modales oscuros Pro: Login/Registro (`AuthModal.jsx`) y Espacios de Trabajo / Invitación de Miembros (`WorkspaceModal.jsx`).
- [x] Conmutador de workspaces en `Navbar.jsx` y `Dashboard.jsx`.
- [x] 78 pruebas automatizadas pasando al 100% across 13 suites, ESLint limpio con 0 errores y build de Vite exitoso en 4.84s.

### Fase 5: Sistema de Envíos, Gestión de Cuentas SMTP Múltiples, Cifrado AES-256-GCM y Auditoría ✅ COMPLETADA
- [x] Cifrado autenticado de contraseñas SMTP con **AES-256-GCM** y clave derivada con SHA-256 (`server/src/utils/encryption.js`).
- [x] Protección avanzada contra SSRF con comprobación de CIDRs privados y resolución DNS (`server/src/utils/ssrfProtection.js`).
- [x] Repositorio de cuentas SMTP (`server/src/db/smtpRepository.js`) con aislamiento por workspace, gestión de cuenta predeterminada y ocultamiento de claves en listados.
- [x] Repositorio de auditoría (`server/src/db/auditRepository.js`) para trazabilidad de eventos operativos.
- [x] Endpoints REST `/api/smtp-accounts` y `/api/audit-logs` protegidos por roles RBAC.
- [x] Servicio de despacho (`emailService.js`) conectado a cuentas SMTP guardadas y logging de auditoría.
- [x] Modal de gestión de cuentas SMTP (`SmtpAccountsModal.jsx`) con presets (Gmail, Outlook 365, Amazon SES, Brevo, Custom), prueba de conexión en tiempo real y vista de logs de auditoría.
- [x] Selector de remitente en `SendEmailModal.jsx` con soporte para cuentas del workspace.
- [x] 103 pruebas automatizadas pasando al 100% across 18 suites, ESLint limpio con 0 errores y build de Vite exitoso en 5.32s.

### Fase 6: Contactos, Listas y Variables de Personalización (SIGUIENTE PASO)
- [ ] Tablas relacionales: `contacts`, `contact_lists`, `contact_list_members`.
- [ ] Motor de variables de personalización: `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{custom.field}}` con soporte de fallback `{{first_name|Estimado usuario}}`.
- [ ] Importador inteligente de archivos CSV / XLSX con detección de cabeceras, mapeo y deduplicación.
- [ ] Selector de vista previa "Previsualizar como [Contacto]" en el editor.
- [ ] Modal de gestión de contactos y audiencias.

### Fase 7: Entregabilidad, Salud de Correo (Preflight) y Cumplimiento
- Generación automática de versión en texto plano (`text/plain` multipart/alternative).
- Enlace y tokens seguros de desuscripción (`/unsubscribe/:token`), cabeceras `List-Unsubscribe`.
- Lista de supresión (`suppression_list`) verificada antes de cualquier despacho.
- Protección SSRF avanzada con resolución DNS previa al socket SMTP.
- Herramienta Email Preflight Health Check (puntuación 0-100, alertas de contraste, peso HTML > 100 KB, etc.).

### Fase 8: Bloques Avanzados, Biblioteca de Medios y Preview Profesional
- Nuevos bloques: `quote`, `pricing`, `product`, `feature-list`, `badge`, `footer`, `legal-text`, `unsubscribe`.
- Biblioteca de medios (assets) para subir, reusar y clasificar imágenes con abstracción para almacenamiento local y S3.
- Perfiles de previsualización avanzados (Gmail, Outlook Desktop, Dark Mode, simulación de bloqueo de imágenes).
- Carpetas, etiquetas y favoritos en el Dashboard.

### Fase 9: Producción, CI/CD Dual (MySQL + PostgreSQL) y Documentación
- Matriz de GitHub Actions ejecutando tests simultáneamente contra MySQL y PostgreSQL.
- Seguridad en producción con Helmet, CSP y rate limiting distribuido.
- Logging estructurado con Pino (ofuscación de contraseñas y API keys).
- Health checks `/api/health`, `/api/health/live`, `/api/health/ready`.
- Scripts de backup (`npm run db:backup`) con soporte para `mysqldump` y `pg_dump`.
- Actualización final de `README.md` (MySQL como opción por defecto), `docs/MIGRATION.md` y `.env.example`.

---

## 5. Estrategia de Backward Compatibility (Compatibilidad Hacia Atrás)

- **Versionado de Documentos**: Las plantillas exportadas o guardadas llevarán `prettierMailsVersion: "2.0"`.
- **Migrador en Vuelo**: El parser de plantillas detectará documentos legacy v1.0 y los migrará automáticamente a la estructura actual sin pérdida de datos.
- **Roundtrip HTML**: Se mantendrán intactas las reglas de parseo de archivos `.html` descargados previamente.
- **Plantillas Predefinidas**: Ninguna plantilla predeterminada existente será eliminada o alterada en su diseño visual.

---

## 6. Riesgos Identificados y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Diferencias de sintaxis entre MySQL y PostgreSQL | Uso de una capa ORM unificada (Drizzle / Prisma) que abstrae los tipos de datos y dialectos SQL; validación continua en CI con ambos motores. |
| Bloqueo o desbordamiento en clientes SMTP masivos | Procesamiento asíncrono en workers individuales con límites de tasa (rate limits) y reintentos exponenciales. |
| Inyecciones en clientes de correo mediante HTML dinámico | Validación con Zod, sanitización de valores CSS, escape estricto de HTML y serialización segura de scripts. |
| Pérdida de plantillas locales al introducir base de datos | Detección automática de `localStorage` al iniciar sesión con asistente interactivo para importar borradores al workspace. |

---

*PrettierMails Team — Transformación Arquitectónica v2.0*
