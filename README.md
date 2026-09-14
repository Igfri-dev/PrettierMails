# ✉️ PrettierMails — Visual Email Builder & Dispatcher

<div align="center">

![PrettierMails Workflow](docs/assets/prettiermails-workflow.gif)

<p align="center">
  <strong>Diseñador visual de correos electrónicos profesionales, modernos y responsivos con superpoderes de Inteligencia Artificial.</strong>
  <br />
  Soporte nativo para videos interactivos de YouTube, bloques en columnas, tablas estilizadas, inlining CSS con Juice y envío multicanal (SMTP / Ethereal).
</p>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## 🌟 ¿Qué es PrettierMails?

**PrettierMails** es una plataforma web completa desarrollada para resolver el clásico problema de diseñar correos electrónicos modernos sin lidiar con el código HTML de tablas complejas de los años 90.

A diferencia de otros maquetadores rígidos o planos, PrettierMails implementa **principios de diseño contemporáneo** (estilo *Linear, Apple y Stripe*):
- 🎨 **Cero diseños planos**: Tarjetas callout con bordes laterales de acento, fondos suaves, sombras de elevación y jerarquía visual nítida.
- 🎬 **Videos de YouTube de alto impacto**: Detección automática de ID, miniaturas en alta resolución, botón de reproducción superpuesto y previsualización interactiva con reproductor embebido.
- 🤖 **Asistente de IA Autónomo**: Genera estructuras completas de correo mediante Google Gemini o OpenAI interpretando prompts, adjuntando enlaces de videos e imágenes.
- 📐 **Diagramación Fluida**: Bloques de dos columnas (**Grid**) y **Tablas Estilizadas** con filas alternadas (cebra) para accesos o datos.
- 📬 **Compatibilidad Garantizada & Envío Real**: Compilación con Juice para inlining de estilos CSS en tablas HTML estándar, modo de prueba instantáneo con **Ethereal Email** y soporte para cualquier servidor **SMTP personalizado**.

---

## 🎬 Plantilla Destacada: "Lanzamiento con Video de YouTube"

PrettierMails destaca por su capacidad única de incorporar videos y contenido multimedia con una estética impecable en modo oscuro o claro.

<div align="center">
  <img src="docs/assets/hero-builder-youtube.jpg" alt="PrettierMails Editor con Plantilla de Video en YouTube" width="920" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
  <p><em>Vista del constructor visual con la plantilla predeterminada de Lanzamiento de Video en YouTube.</em></p>
</div>

### 💎 Elementos clave de este diseño:
1. **Fondo Dark Slate de Alto Contraste**: Exterior en `#0f172a` y contenedor interior en `#1e293b` con bordes redondeados (`20px`).
2. **Tarjeta de YouTube Optimizada**: Embebe la miniatura oficial en calidad HD (`maxresdefault`), superpone una insignia de reproducción y agrega un botón directo a YouTube.
3. **Tarjeta Callout con Acento Cian**: Caja destacada `#334155` con borde de acento `#38bdf8` para resumir los puntos clave del contenido.
4. **Llamada a la Acción Elevada (CTA)**: Botón con gradiente o color índigo (`#6366f1`) con sombra suave y esquinas redondeadas.
5. **Iconos de Redes Sociales**: Barra inferior centrada con enlaces a YouTube, Instagram, X (Twitter) y LinkedIn.

---

## 📖 Modo de Uso: Guía Paso a Paso

PrettierMails está diseñado para ser intuitivo desde el primer segundo:

### 1. Inicia desde un Lienzo en Blanco o Elige una Plantilla
Al abrir la aplicación, comenzarás en un **Lienzo en Blanco**. Puedes:
- Añadir directamente tus propios bloques usando la barra lateral izquierda.
- Hacer clic en **"Plantillas"** en la barra superior para cargar diseños listos para usar (ej. *Lanzamiento con Video de YouTube*, *Bienvenida al Equipo*, *Boletín Minimalista*).

### 2. Edición Visual y Catálogo de Bloques
Haz clic en cualquier bloque en el lienzo para seleccionarlo y abrir el **Inspector de Estilos**:
- **Bloque YouTube**: Pega cualquier enlace de video (`https://www.youtube.com/watch?v=...` o `https://youtu.be/...`). La aplicación extraerá automáticamente la miniatura en alta resolución y el botón de llamada a la acción. En el editor puedes probar el reproductor en vivo alternando entre la vista de diseño y la vista de reproducción.
- **Bloque Grid (2 Columnas)**: Permite colocar un logo a la izquierda y título con texto a la derecha (proporciones `30%/70%`, `50%/50%`, `70%/30%`, `25%/75%`).
- **Bloque Tabla Estilizada**: Organiza credenciales, listas o características con temas instantáneos (*Moderno Slate*, *Azul Pro*, *Esmeralda*), soporte de texto en negrita y filas alternadas.
- **Bloque Caja (Callout Card)**: Personaliza color de fondo, esquinas redondeadas y añade bordes laterales de acento de cualquier color.

### 3. Asistente con Inteligencia Artificial (Google Gemini & OpenAI)
Presiona el botón **"Asistente IA"** con icono de destellos en la barra superior:

<div align="center">
  <img src="docs/assets/ai-generator-modal.jpg" alt="Modal de Generación con IA en PrettierMails" width="820" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
  <p><em>Asistente de IA: ingresa tu prompt y adjunta links de videos o imágenes.</em></p>
</div>

1. **Escribe tu Prompt**: Explica el objetivo del correo (ej. *"Diseña un correo para el estreno de un nuevo video tutorial con llamados a la acción..."*).
2. **Adjunta Enlaces de Video de YouTube**: Agrega los links de YouTube que quieras que aparezcan en el correo.
3. **Adjunta Enlaces de Imágenes**: Pega URLs de logos, banners o ilustraciones.
4. **Selecciona tu Modelo**: Puedes usar **Google Gemini** (totalmente gratis con tu API Key de Google AI Studio) u **OpenAI** (GPT-4o).
5. **Generación con 1 Clic**: La IA ensamblará el correo completo con la jerarquía, colores y componentes de PrettierMails. *(Si no tienes API Key, la webapp incluye un motor inteligente de respaldo)*.

### 4. Previsualización Responsiva en Escritorio y Móvil
Alterna con un solo clic entre la vista de **Escritorio** y la **Vista Móvil**:

<div align="center">
  <img src="docs/assets/mobile-preview-youtube.jpg" alt="Previsualización Móvil en Smartphone" width="460" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Previsualización móvil ultra-fiel simulada dentro del dispositivo de 375px.</em></p>
</div>

El compilador aplica reglas CSS responsivas (`@media only screen and (max-width: 620px)`) para asegurar que columnas, tablas e imágenes se adapten fluidamente a pantallas pequeñas sin romperse en Gmail ni Apple Mail.

### 5. Guardar, Cargar y Exportar Plantillas
- **Guardar en la WebApp**: Guarda tus borradores con nombre y descripción directamente en tu navegador con persistencia en LocalStorage.
- **Exportar / Importar HTML con Metadatos**: Al exportar tu correo como archivo `.html`, PrettierMails incrusta de forma no visible la estructura completa del diseño en un bloque JSON interno. Puedes subir ese mismo archivo `.html` en cualquier momento y la webapp reconstruirá todos los bloques para que continúes editándolo.

### 6. Envío Multi-Destinatario y Pruebas
Haz clic en **"Enviar Correo"**:
- **Chips de Correo Inteligentes**: Escribe o pega listas de correos separadas por comas o espacios.
- **Modo de Prueba (Ethereal Email)**: No requiere contraseñas. Envía el correo a una bandeja virtual real y te entrega un enlace directo para inspeccionar el resultado en tu navegador.
- **Modo SMTP Personalizado**: Configura tu servidor SMTP (Gmail, Outlook, Amazon SES, SendGrid, etc.) con validación de conexión en tiempo real.

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18.0.0 o superior
- Administrador de paquetes `npm` (incluido con Node.js)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/PrettierMails.git
cd PrettierMails
```

### 2. Instalar Dependencias
Instala todas las dependencias del proyecto (raíz, frontend y backend) con un solo comando:
```bash
npm run install:all
```

### 3. Iniciar en Modo Desarrollo
Para ejecutar simultáneamente el servidor Express backend y la interfaz React de Vite:
```bash
npm run dev
```

La aplicación estará lista en tu navegador:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🏗️ Estructura del Código

```text
PrettierMails/
├── docs/
│   └── assets/                    # Imágenes, GIF de demo y recursos visuales
├── server/                        # Backend Node.js / Express
│   ├── src/
│   │   ├── index.js               # Rutas de API y servidor Express
│   │   ├── aiService.js           # Integración con Google Gemini, OpenAI y fallback
│   │   ├── emailService.js        # Despacho Nodemailer, Ethereal y SMTP
│   │   └── htmlRenderer.js        # Compilador con Juice para inlining de estilos
│   └── package.json
├── client/                        # Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx                # Estado maestro del lienzo y navegación
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Barra superior con acciones y modo de vista
│   │   │   ├── Canvas/            # Lienzo interactivo y renderizador de bloques
│   │   │   ├── Sidebar/           # Selector de bloques, inspector de estilos y ajustes
│   │   │   └── Modals/            # Asistente IA, exportación HTML, plantillas y envío
│   │   └── utils/
│   │       ├── emailCompiler.js   # Generador de tablas HTML compatibles con emails
│   │       ├── templateStorage.js # Guardado local y parseo round-trip de HTML
│   │       ├── defaultTemplates.js# Galería de plantillas predefinidas
│   │       └── youtubeHelper.js   # Extractor de miniaturas y URLs de YouTube
│   └── package.json
├── .gitignore                     # Exclusión de dependencias y variables de entorno
├── package.json                   # Scripts concurrentes para root
└── README.md                      # Documentación del proyecto
```

---

## 📡 Endpoints de la API Backend

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verifica el estado del servidor y tiempo de actividad. |
| `POST` | `/api/generate-email` | Genera un diseño completo con Google Gemini o OpenAI. |
| `POST` | `/api/send-email` | Despacha el correo a uno o múltiples destinatarios (Ethereal / SMTP). |
| `POST` | `/api/verify-smtp` | Realiza una prueba de conexión handshake contra credenciales SMTP. |
| `POST` | `/api/render-html` | Procesa HTML inlining con Juice garantizando compatibilidad. |

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas mejorar PrettierMails:
1. Haz un Fork del repositorio.
2. Crea tu rama de características (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'feat: agrega nuevo bloque multimedia'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  Hecho con ❤️ para que diseñar y enviar correos electrónicos vuelva a ser una experiencia hermosa.
</div>
