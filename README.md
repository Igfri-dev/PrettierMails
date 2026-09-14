# ✉️ PrettierMails — Visual Email Studio & Dispatcher

<div align="center">

![PrettierMails Real Workflow](docs/assets/prettiermails-workflow.gif)

<p align="center">
  <strong>Diseñador visual de correos electrónicos profesionales, modernos y responsivos con superpoderes de Inteligencia Artificial.</strong>
  <br />
  Arquitectura de dos vistas (Dashboard y Studio), soporte nativo para videos interactivos de YouTube, contenedores callout con contenido editable, tablas con estilos cebra, inlining CSS con Juice y despacho multicanal (SMTP / Ethereal).
</p>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 🌟 ¿Qué es PrettierMails?

**PrettierMails** es una suite web integral desarrollada para resolver el clásico dolor de diseñar correos electrónicos modernos sin escribir tablas arcaicas ni lidiar con las limitaciones de los clientes de correo de los años 90.

Inspirado en la estética contemporánea de herramientas como *Linear, Apple y Stripe*, PrettierMails cuenta con una arquitectura de dos pantallas interconectadas:

1. **Dashboard Central de Control**: Administra borradores, gestiona plantillas oficiales, filtra por asunto y accede con un clic a asistentes de creación rápida.
2. **Studio Editor Visual**: Entorno de maquetación en tiempo real con barra de componentes modulares de dos columnas, selector de dispositivo Desktop/Móvil, e inspector detallado de estilos y contenidos.

---

## 📸 Galería Visual de la WebApp

> *Todas las imágenes y animaciones a continuación fueron capturadas directamente desde la aplicación en funcionamiento.*

### 1. Dashboard de Correos y Borradores (Menú Inicial)
<div align="center">
  <img src="docs/assets/dashboard-v2.jpg" alt="Dashboard de PrettierMails" width="940" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Menú inicial con tarjetas de acceso rápido, buscador en vivo y tabla de plantillas y borradores.</em></p>
</div>

### 2. Studio Editor con Plantilla "Lanzamiento con Video de YouTube"
<div align="center">
  <img src="docs/assets/hero-builder-youtube.jpg" alt="Studio Editor de PrettierMails" width="940" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Entorno de edición en vivo: catálogo modular a la izquierda, lienzo central y panel de estilos a la derecha.</em></p>
</div>

### 3. Editor de Contenido Interior de Caja / Callout
<div align="center">
  <img src="docs/assets/box-editor.jpg" alt="Editor de Contenido Interior de Caja" width="940" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Control total sobre el contenido interior de las cajas: añade títulos, párrafos y botones CTA, reordénalos o elimínalos.</em></p>
</div>

### 4. Simulador Responsivo en Modo Móvil (375px)
<div align="center">
  <img src="docs/assets/mobile-preview-youtube.jpg" alt="Simulador Móvil en PrettierMails" width="940" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Conmuta instantáneamente a la vista de smartphone para verificar la legibilidad y proporciones en pantallas pequeñas.</em></p>
</div>

### 5. Asistente con Inteligencia Artificial (Gemini & OpenAI)
<div align="center">
  <img src="docs/assets/ai-generator-modal.jpg" alt="Generador Autónomo con IA" width="940" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);" />
  <p><em>Generación autónoma a partir de prompts, con adjunción de enlaces de YouTube, imágenes y selección de modelo.</em></p>
</div>

---

## 🎬 Modo de Uso: Guía Paso a Paso

Aprende a crear un correo de alto impacto utilizando como ejemplo la plantilla estelar **"Lanzamiento con Video de YouTube"**:

### Paso 1: Selecciona la Plantilla desde el Dashboard
1. Abre la aplicación en tu navegador ([http://localhost:5173](http://localhost:5173)).
2. En la sección **Acceso Rápido**, haz clic en la tarjeta **"Lanzamiento con Video"** (con insignia ★ ESTRELLA).
3. Entrarás directamente al **Studio Editor** con el diseño precargado en modo oscuro slate (`#0f172a`).

### Paso 2: Personaliza el Bloque de Video de YouTube
1. Haz clic sobre la tarjeta del video en el lienzo central.
2. Verás el anillo de selección azul y la barra flotante con acciones rápidas (Mover arriba/abajo, Duplicar, Eliminar).
3. En el panel derecho (**Style Settings**):
   - **URL del Video**: Pega cualquier enlace de YouTube (`https://www.youtube.com/watch?v=...` o `https://youtu.be/...`). La webapp extrae el ID de video y carga la miniatura oficial en alta definición.
   - **Título y Descripción**: Ajusta el texto del encabezado y la sinopsis del video.
   - **Botón CTA de YouTube**: Modifica el texto de llamada a la acción (ej. *"Ver Video en YouTube ▶"*).
   - **Probar Reproductor**: Haz clic en el botón superior de la tarjeta de video para alternar entre la vista de maquetación y el reproductor embebido interactivo.

### Paso 3: Edita el Contenido de la Caja Contenedora (Puntos Clave)
1. Haz clic en la caja contenedora ubicada debajo del video (*"💡 Puntos clave incluidos en el video"*).
2. En el panel derecho encontrarás:
   - **Ajustes de Contenedor**: Color de fondo (`#334155`), bordes laterales de acento tipo callout (`#38bdf8`), esquinas redondeadas y padding.
   - **Contenido Interior de la Caja**:
     - `+ Título`: Agrega subtítulos internos con tamaño y color personalizables.
     - `+ Párrafo`: Agrega textos descriptivos con formato `**negrita**` y saltos de línea.
     - `+ Botón`: Agrega un botón CTA dentro de la caja con enlace y colores propios.
     - **Reordenar / Eliminar**: Usa las flechas (↑ / ↓) para cambiar el orden de los elementos o el icono de papelera para descartarlos.

### Paso 4: Comprueba la Adaptabilidad Móvil
1. En la barra superior del Studio, presiona el botón de **Vista Móvil** (icono de smartphone 📱).
2. El lienzo adaptará su ancho a un marco simulado de 375px.
3. Observa cómo el video de YouTube, la caja callout y los botones de acción se adaptan fluidamente manteniendo proporciones legibles.

### Paso 5: Potencia tu Diseño con Inteligencia Artificial
1. Haz clic en el botón **"Crear con IA"** en la barra lateral de iconos (o en el Dashboard).
2. Puedes seleccionar ideas rápidas (*"Lanzamiento de Producto"*, *"Oferta Flash"*, *"Newsletter"*) o escribir tus instrucciones personalizadas.
3. Adjunta enlaces de YouTube o imágenes de referencia.
4. Elige tu proveedor preferido:
   - **Google Gemini** (gratuito con Free Tier API Key).
   - **OpenAI GPT-4o** (con tu OpenAI API Key).
   - *Motor Inteligente Local*: Si no dispones de API Key en ese momento, PrettierMails ensambla un correo estructurado de respaldo automáticamente.

### Paso 6: Exporta o Envía tu Correo
- **Guardar en el Navegador**: Haz clic en **"Save & Next"** para guardar tu plantilla en el Dashboard y LocalStorage.
- **Exportar HTML Portable**: Haz clic en el botón de código (`< >`) para descargar un archivo `.html` autónomo que incluye metadatos JSON no visibles. Puedes subir ese mismo archivo `.html` a PrettierMails en el futuro para continuar editándolo.
- **Prueba de Envío (Ethereal Email)**: Envía una prueba sin contraseña a una bandeja virtual para inspeccionar el resultado en tu cliente de correo.
- **Envío en Producción (SMTP)**: Conecta tu servidor SMTP (Gmail, Outlook, SendGrid, Amazon SES) y realiza envíos a listas de destinatarios mediante chips inteligentes.

---

## 🧩 Catálogo de Componentes Modulares

PrettierMails incluye una biblioteca completa de bloques especializados para email:

| Componente | Descripción | Opciones Principales |
|---|---|---|
| **Video de YouTube** | Tarjeta optimizada para videos con botón de reproducción | Extracción de ID, miniatura HD, texto de botón, preview en vivo |
| **Caja / Contenedor** | Callout elevado con contenido anidado editable | Borde de acento lateral, hijos dinámicos (título, párrafo, botón) |
| **Grid / 2 Columnas** | Diagramación de 2 columnas para logos y textos | Proporciones (30/70, 50/50, 70/30, 25/75), alineación vertical |
| **Tabla Estilizada** | Tablas de datos, credenciales o listas de precios | Filas cebra, temas (Slate, Azul Pro, Esmeralda), columnas dinámicas |
| **Encabezado (H1/H2)** | Títulos principales de sección | Tamaños (`18px` - `36px`), alineación, colores e interlineado |
| **Párrafo de Texto** | Textos y bloques narrativos | Soporte de formato `**negrita**`, colores y tamaños |
| **Imagen** | Banners, ilustraciones y fotografías | Ancho ajustable, enlaces al hacer clic, bordes redondeados |
| **Botón CTA** | Botón de llamada a la acción de alto contraste | Radio de borde (recto, curvo, píldora), padding, enlaces URL |
| **Redes Sociales** | Barra de iconos sociales | YouTube, Instagram, X/Twitter, GitHub, LinkedIn, Facebook |
| **Línea Divisoria** | Separadores visuales | Estilos continuo, discontinuo o punteado, grosor y color |
| **Espaciador** | Control de ritmo y espaciado vertical | Alturas predefinidas (`12px`, `24px`, `36px`, `48px`) |

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18.0.0 o superior
- Administrador de paquetes `npm` (incluido con Node.js)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Igfri-dev/PrettierMails.git
cd PrettierMails
```

### 2. Instalar Dependencias
Instala todas las dependencias del proyecto (raíz, frontend y backend) con un solo comando:
```bash
npm run install:all
```

### 3. Configurar Variables de Entorno (Opcional)
Crea un archivo `.env` en la carpeta `server/` tomando como base `server/.env.example`:
```env
PORT=3001
GEMINI_API_KEY=tu_clave_de_gemini_aqui
OPENAI_API_KEY=tu_clave_de_openai_aqui
```
*(Nota: Las API Keys también se pueden ingresar o cambiar directamente desde la interfaz gráfica de la webapp).*

### 4. Iniciar en Modo Desarrollo
Ejecuta concurrentemente el servidor backend y la aplicación frontend de Vite:
```bash
npm run dev
```

La aplicación estará lista en tu navegador:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### 5. Compilación para Producción
Para compilar los recursos estáticos optimizados del cliente:
```bash
npm run build:client
```

---

## 🏗️ Estructura del Código

```text
PrettierMails/
├── docs/
│   └── assets/                    # Screenshots reales de la webapp y GIF animado
│       ├── prettiermails-workflow.gif
│       ├── dashboard-v2.jpg
│       ├── hero-builder-youtube.jpg
│       ├── youtube-block-editor.jpg
│       ├── box-editor.jpg
│       ├── mobile-preview-youtube.jpg
│       └── ai-generator-modal.jpg
├── server/                        # Backend Node.js / Express
│   ├── src/
│   │   ├── index.js               # Servidor Express, seguridad CORS y endpoints
│   │   ├── aiService.js           # Orquestador con Google Gemini, OpenAI y fallback
│   │   ├── emailService.js        # Despacho Nodemailer, Ethereal y SMTP
│   │   └── htmlRenderer.js        # Compilador con Juice para inlining de estilos
│   └── package.json
├── client/                        # Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx                # Estado maestro, control de vistas (Dashboard / Studio)
│   │   ├── components/
│   │   │   ├── Dashboard/         # Menú inicial, tarjetas hero, buscador y borradores
│   │   │   ├── Navbar.jsx         # Barra superior del Studio con selector de dispositivo
│   │   │   ├── Canvas/            # Lienzo visual interactivo y renderizador de bloques
│   │   │   ├── Sidebar/           # Selector de bloques modular y panel de estilos
│   │   │   └── Modals/            # Modales de IA, previsualización, plantillas y envío
│   │   └── utils/
│   │       ├── emailCompiler.js   # Compilador de HTML en tablas anidadas y Juice
│   │       ├── templateStorage.js # Persistencia LocalStorage y parseo round-trip
│   │       ├── defaultTemplates.js# Plantillas predefinidas de alta fidelidad
│   │       └── youtubeHelper.js   # Extracción de IDs y miniaturas de YouTube
│   └── package.json
├── package.json                   # Scripts concurrentes para root
└── README.md                      # Documentación del proyecto
```

---

## 📡 Endpoints de la API Backend

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verifica el estado del servidor y tiempo de actividad. |
| `POST` | `/api/generate-email` | Genera una estructura completa de correo con Gemini u OpenAI. |
| `POST` | `/api/send-email` | Despacha el correo a uno o múltiples destinatarios (Ethereal / SMTP). |
| `POST` | `/api/verify-smtp` | Realiza una prueba de conexión handshake contra credenciales SMTP. |
| `POST` | `/api/render-html` | Procesa HTML inlining con Juice garantizando compatibilidad estándar. |

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas colaborar:
1. Haz un Fork del repositorio.
2. Crea tu rama de características (`git checkout -b feature/nueva-mejora`).
3. Realiza tus cambios y haz commit (`git commit -m 'feat: añade soporte para video Vimeo'`).
4. Haz push a tu rama (`git push origin feature/nueva-mejora`).
5. Abre un **Pull Request**.

---

## 📄 Licencia
Este proyecto se distribuye bajo la licencia **GNU General Public License v3.0 (GPLv3)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  Hecho con ❤️ para que diseñar y enviar correos electrónicos vuelva a ser una experiencia hermosa.
</div>
