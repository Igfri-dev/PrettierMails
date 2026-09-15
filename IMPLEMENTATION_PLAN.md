# 📋 Plan de Implementación Maestro: PrettierMails Enterprise Suite

Este documento contiene el diagnóstico integral, análisis técnico, arquitectura ejecutada y el estado de avance de las fases de desarrollo de **PrettierMails Enterprise Suite**.

---

## 1. Arquitectura del Sistema

PrettierMails cuenta con una arquitectura desacoplada y modular con soporte para desarrollo local con **MySQL en XAMPP**, conmutabilidad a **PostgreSQL** y tolerancia a fallos mediante mock relacional en memoria:

- **Frontend (`client/`)**:
  - React 18 + Vite 6 + Tailwind CSS 3.4.
  - Navegación de dos vistas (`Dashboard` y `Studio Editor`) en `App.jsx`.
  - **Block Registry Modular** (`client/src/blocks/`): 11 tipos de bloques modulares (`heading`, `text`, `image`, `button`, `youtube`, `box` con hijos editables, `divider`, `spacer`, `social`, `grid` de 2 columnas y `table` cebra).
  - Almacenes globales con **Zustand** (`documentStore.js` con Undo/Redo de hasta 50 snapshots, `authStore.js` para autenticación y workspaces).
  - Reordenamiento visual mediante **Drag & Drop** (`@dnd-kit`).
  - Compiladores duales: compilador MJML reactivo (`mjmlCompiler.js`) y compilador de tablas anidadas con Juice inlining (`emailCompiler.js`).
  - Motor de interpolación de variables dinámicas (`templateInterpolator.js`).
  - Modales empresariales oscuros: Login/Registro (`AuthModal`), Espacios de trabajo (`WorkspaceModal`), Historial de Versiones (`VersionHistoryModal`), Cuentas SMTP con cifrado (`SmtpAccountsModal`), Contactos y CSV (`ContactsModal`), Campañas y Analítica (`CampaignsModal`), Automatizaciones y Webhooks (`AutomationsModal`), Asistente de IA (`AiGeneratorModal`).

- **Backend (`server/`)**:
  - Express 4.21 con arquitectura modular por rutas y repositorios relacionales.
  - Base de datos relacional híbrida (**MySQL en XAMPP** / PostgreSQL / Memory) con 19 tablas y migraciones DDL automáticas (`migrations.js`).
  - Cifrado autenticado **AES-256-GCM** con vector IV para contraseñas SMTP (`encryption.js`).
  - Autenticación JWT con hashing criptográfico (`crypto.scrypt`).
  - Cola de despacho masivo asíncrono con control de concurrencia y reintentos (`campaignQueue.js`).
  - Motor de seguimiento analítico en tiempo real: píxel invisible de 1x1 (`/api/track/open`) y redirección de clics (`/api/track/click`).
  - Motor de Webhooks con firma criptográfica **HMAC-SHA256** en cabecera `X-PrettierMails-Signature`.
  - Orquestador de IA multimodelo con soporte para **Google Gemini 3.6 Flash / 3.5 Flash**, OpenAI GPT-4o mini y motor sintético estructurado offline como fallback tolerante a fallos (`aiService.js`).
  - Seguridad operacional: protección anti-SSRF (`ssrfProtection.js`), bloqueo concurrente de plantillas (`template_locks`), bitácora inmutable de auditoría (`audit_logs`) y rate limiters dedicados.

---

## 2. Estado de Implementación por Fases

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
- [x] Migraciones DDL universales (`server/src/db/migrations.js`) para 7 tablas iniciales: `workspaces`, `users`, `workspace_members`, `templates`, `template_versions`, `smtp_accounts`, `audit_logs`.
- [x] Seeders idempotentes (`server/src/db/seeders.js`) con workspace por defecto (`ws-default`), usuario admin y plantillas predefinidas v1.
- [x] Repositorio de plantillas y versionado inmutable (`server/src/db/templateRepository.js`): CRUD, incremento secuencial de versiones, resumen de diff, restauración y duplicación.
- [x] API REST completa (`server/src/routes/templates.js`): endpoints `/api/templates`, `/autosave`, `/:id/versions`, `/:id/versions/:versionId/restore`, `/:id/duplicate`.
- [x] Autosave debounced en 1.5s en `App.jsx` con píldora de sincronización en vivo (`Navbar.jsx`).
- [x] Modal de Historial de Versiones (`VersionHistoryModal.jsx`) con inspección de checkpoints y restauración en 1 clic.
- [x] Integración en `Dashboard.jsx` y `TemplatesModal.jsx` con soporte unificado de base de datos (`vX • BD`), borradores locales y plantillas oficiales.
- [x] Scripts CLI: `npm run db:migrate`, `npm run db:seed`, `docker-compose.yml`, `.env.example`.

### Fase 4: Autenticación, Roles (RBAC), Workspaces y Multi-tenancy ✅ COMPLETADA
- [x] Sesiones seguras con JWT / HMAC-SHA256 y hashing criptográfico de contraseñas (`crypto.scrypt` con salt de 16 bytes).
- [x] Roles jerárquicos por workspace: `owner` (4) > `admin` (3) > `editor` (2) > `viewer` (1).
- [x] Aislamiento multi-tenancy estricto por `workspace_id` en todas las operaciones y endpoints.
- [x] Repositorios de usuarios y workspaces (`userRepository.js`, `workspaceRepository.js`).
- [x] Middlewares de autenticación y verificación de roles (`auth.js`).
- [x] Store de autenticación en Zustand (`authStore.js`) con persistencia en `localStorage`.
- [x] Modales oscuros Pro: Login/Registro (`AuthModal.jsx`) y Espacios de Trabajo / Invitación de Miembros (`WorkspaceModal.jsx`).
- [x] Conmutador de workspaces en `Navbar.jsx` y `Dashboard.jsx`.

### Fase 5: Sistema de Envíos, Gestión de Cuentas SMTP Múltiples, Cifrado AES-256-GCM y Auditoría ✅ COMPLETADA
- [x] Cifrado autenticado de contraseñas SMTP con **AES-256-GCM** y clave derivada con SHA-256 (`server/src/utils/encryption.js`).
- [x] Protección avanzada contra SSRF con comprobación de CIDRs privados y resolución DNS (`server/src/utils/ssrfProtection.js`).
- [x] Repositorio de cuentas SMTP (`server/src/db/smtpRepository.js`) con aislamiento por workspace, gestión de cuenta predeterminada y ocultamiento de claves en listados (`••••••••`).
- [x] Repositorio de auditoría (`server/src/db/auditRepository.js`) para trazabilidad de eventos operativos.
- [x] Endpoints REST `/api/smtp-accounts` y `/api/audit-logs` protegidos por roles RBAC.
- [x] Servicio de despacho (`emailService.js`) conectado a cuentas SMTP guardadas y logging de auditoría.
- [x] Modal de gestión de cuentas SMTP (`SmtpAccountsModal.jsx`) con presets (Gmail, Outlook 365, Amazon SES, Brevo, Custom), prueba de conexión en tiempo real y vista de logs de auditoría.
- [x] Selector de remitente en `SendEmailModal.jsx` con soporte para cuentas del workspace.

### Fase 6: Contactos, Listas y Variables de Personalización ✅ COMPLETADA
- [x] Tablas relacionales migradas: `contacts`, `contact_lists`, `contact_list_members`.
- [x] Repositorio de contactos (`contactRepository.js`) con CRUD, filtrado y conteo de miembros.
- [x] Motor de variables de personalización (`templateInterpolator.js`): `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{company}}` y fallback `{{campo|Valor alternativo}}`.
- [x] Importador inteligente de archivos CSV (`csvImporter.js`) con detección de cabeceras, mapeo y deduplicación.
- [x] Endpoints REST `/api/contacts` y `/api/contacts/import-csv` con validación Zod.
- [x] Modal de gestión de audiencias (`ContactsModal.jsx`): administración de listas, subida de archivos CSV con drag-and-drop y creación manual de contactos.

### Fase 7: Campañas Masivas, Cola de Despacho y Tracking de Aperturas/Clics ✅ COMPLETADA
- [x] Tablas relacionales: `campaigns`, `campaign_logs`, `campaign_events`.
- [x] Repositorio de campañas (`campaignRepository.js`) con estadísticas agregadas (enviados, entregados, abiertos, clics).
- [x] Cola de despacho asíncrona (`campaignQueue.js`) con control de estado (`draft`, `queued`, `sending`, `paused`, `completed`).
- [x] Píxel de seguimiento de aperturas transparente 1x1 GIF (`/api/track/open/:dispatchId`).
- [x] Redirección y auditoría de clics en enlaces (`/api/track/click/:dispatchId`) con registro de User-Agent e IP.
- [x] Endpoints REST `/api/campaigns` (CRUD, start, pause, resume, stats).
- [x] Modal de gestión de campañas (`CampaignsModal.jsx`) con analítica visual en tiempo real.

### Fase 8: Automatizaciones Visuales, Webhooks con HMAC y Bloqueo Concurrente ✅ COMPLETADA
- [x] Tablas relacionales: `automations`, `automation_steps`, `automation_logs`, `webhooks`, `webhook_deliveries`, `template_locks`.
- [x] Motor de automatizaciones de marketing (`automationRepository.js`, `/api/automations`) con disparadores por eventos (`contact_added`) y pasos con retardo (delays).
- [x] Motor de webhooks salientes (`webhookEngine.js`, `/api/webhooks`) con firma de seguridad criptográfica **HMAC-SHA256** en cabecera `X-PrettierMails-Signature` y reintentos automáticos.
- [x] Sistema de bloqueo concurrente de plantillas (`lockRepository.js`, `/api/templates/:id/lock`) para evitar sobreescritura accidental entre usuarios del mismo workspace.
- [x] Compilador reactivo dual MJML (`mjmlCompiler.js`) para maquetación de alto nivel.
- [x] Modal integrado de Automatizaciones y Webhooks (`AutomationsModal.jsx`).

### Fase 9: Asistente IA de Última Generación, Soporte XAMPP y Documentación Real ✅ COMPLETADA
- [x] Integración de modelos oficiales de última generación: **Google Gemini 3.6 Flash** (`gemini-3.6-flash`), `gemini-3.5-flash` y `gemini-3.5-flash-lite`.
- [x] Indicador visual dinámico de estado en el modal de IA (`🟢 IA en Vivo Activa` vs `🟡 Motor de Respaldo Local`).
- [x] Endpoint de estado `/api/ai-config-status` para detección no intrusiva de credenciales en el servidor.
- [x] Soporte nativo para MySQL en XAMPP (`localhost:3306`, base de datos `prettier_mails`, 19 tablas relacionales migradas automáticamente).
- [x] Suite de 156 pruebas automatizadas en Vitest pasando al 100% across 33 suites.
- [x] Capturas de pantalla reales en alta resolución y GIF animado de flujo de trabajo generados con navegador headless en la aplicación real.
- [x] Documentación exhaustiva en `README.md` con guía de instalación paso a paso y tabla completa de endpoints REST.

---

## 3. Extensiones y Mejoras Opcionales Futuras

Los siguientes puntos representan características secundarias o ampliaciones futuras que pueden añadirse en versiones posteriores:

1. **Preflight Health Check Widget**:
   - Herramienta de auditoría preventiva previa al envío que calcule un puntaje de salud del correo (0-100), verificando contraste WCAG de colores, presencia de texto alternativo (`alt`) en imágenes y advertencias si el HTML supera los 102 KB (umbral de recorte de Gmail).
2. **Endpoint Público de Desuscripción (`/unsubscribe/:token`)**:
   - Página web pública independiente para que el suscriptor gestione su baja con un clic y cabecera estándar RFC 8058 `List-Unsubscribe: <mailto:...>, <https://...>`.
3. **Bloques Adicionales de Nicho**:
   - Componentes modulares pre-ensamblados para comercio electrónico: `pricing-table`, `product-card`, `testimonial-quote`, `badge-pill`.
4. **Biblioteca de Medios con Almacenamiento en S3 / Disco Local**:
   - Panel de explorador de archivos para subir imágenes al servidor o a un bucket Amazon S3/Cloudflare R2 en lugar de utilizar URLs públicas externas.
5. **Workflow de Integración Continua (CI) en GitHub Actions**:
   - Archivo `.github/workflows/ci.yml` para ejecutar la suite de 156 pruebas en cada pull request contra instancias efímeras de MySQL y PostgreSQL.
6. **Script CLI de Copias de Seguridad**:
   - Comando `npm run db:backup` para generar volcados SQL automáticos (`mysqldump` / `pg_dump`).

---

## 4. Métricas de Calidad y Verificación Actuales

- **Pruebas Automatizadas**: 156 pruebas unitarias y de integración pasando al 100% (33 test files).
- **Linter**: ESLint 9+ pasando sin ningún error (`0 errors`).
- **Base de Datos**: 19 tablas relacionales con migraciones automáticas idempotentes.
- **Seguridad**: Cifrado AES-256-GCM para contraseñas SMTP, HMAC-SHA256 para webhooks, tokens JWT, protección anti-SSRF y validación estricta Zod en todos los endpoints.

---

*PrettierMails Core Team — Suite Empresarial v2.0*
