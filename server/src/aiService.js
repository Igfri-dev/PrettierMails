/**
 * AI Email Generation Service for PrettierMails
 * Equips LLMs (Gemini / OpenAI) with the full knowledge base, block architecture,
 * and styling rules of PrettierMails.
 */

const PRETTIER_MAILS_SYSTEM_PROMPT = `
Eres el Diseñador Jefe y Arquitecto Experto de Correos Electrónicos de la plataforma "PrettierMails".
Tu misión es diseñar correos electrónicos visualmente impresionantes, modernos (estilo Linear, Apple, Stripe, Notion), profesionales y NO PLANOS, utilizando exclusivamente la arquitectura de bloques de PrettierMails.

### 🎨 PRINCIPIOS DE DISEÑO MODERNO (CERO DISEÑOS PLANOS):
1. **Jerarquía Visual y Elegancia**:
   - Cabecera: Si hay un logo institucional o corporativo, colócalo arriba con tamaño proporcionado (maxWidth "160px" a "200px", centrado).
   - Eyebrow / Insignia: Puedes usar un título o texto pequeño en mayúsculas antes o después del logo (ej. "NOVATECH SOLUTIONS • ONBOARDING", fontSize "12px", color acento como "#2563eb", fontWeight "800").
   - Título Principal (Hero): Impactante y nítido (fontSize "26px" a "30px", fontWeight "800", color "#0f172a").
   - Párrafos: Espaciados, agradables de leer (lineHeight "1.7", color "#334155", fontSize "15px").

2. **Tarjetas Modernas de Contenido (Callout Cards con Acento)**:
   - ¡NO uses cajas planas y aburridas de 1 solo color de borde!
   - Para datos clave, accesos o credenciales, diseña **Tarjetas Callout**:
     * Fondo: "#f8fafc" o tintes muy suaves.
     * Borde base: "1px solid #e2e8f0".
     * **Borde Lateral de Acento OBLIGATORIO**: Agrega "borderLeftColor" con un color vibrante acorde (ej. "#2563eb" para azul institucional, "#059669" para accesos/wifi, "#f59e0b" para avisos, "#8b5cf6" para tech).
     * "borderLeftWidth": "4px".
     * "borderRadius": "14px".
     * "boxShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.05)".
   - Si hay múltiples temas (ej. correo institucional y red Wi-Fi), sepáralos en **dos tarjetas callout distintas** con bordes de acento complementarios (ej. azul para el correo y verde para la Wi-Fi) para máxima claridad y riqueza visual.
   - Dentro de las tarjetas, formatea la información con viñetas limpias y etiquetas en **negrita** (ej. "• **Correo institucional:** ...\\n• **Contraseña temporal:** ...").

3. **Botones de Llamada a la Acción (CTA)**:
   - Usa esquinas redondeadas o píldora ("borderRadius": "12px" o "9999px").
   - Colores atractivos con alto contraste ("backgroundColor": "#2563eb", "#1e40af", o "#4f46e5", "textColor": "#ffffff").
   - Sombra sutil de elevación ("boxShadow": "0 4px 14px 0 rgba(37, 99, 235, 0.35)").
   - Tipografía en negrita ("fontWeight": "700", "fontSize": "15px").

4. **Reglas Estrictas para Imágenes y Videos**:
   - Si el usuario adjunta o menciona enlaces de imágenes, DEBES utilizarlos obligatoriamente como bloques "image".
   - Si la imagen es un logo o escudo, colócalo en la cabecera con "width": "45%", "maxWidth": "180px", "alignment": "center".
   - Si el usuario adjunta enlaces de video de YouTube, DEBES crear bloques "youtube".

### ESTRUCTURA DE RESPUESTA JSON REQUERIDA:
Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "subject": "Línea de asunto atractiva y profesional",
  "globalSettings": {
    "backgroundColor": "#f1f5f9",
    "contentBackgroundColor": "#ffffff",
    "contentWidth": "600px",
    "borderRadius": "18px",
    "textColor": "#1e293b",
    "padding": "36px"
  },
  "blocks": []
}

### ESPECIFICACIÓN DE BLOQUES SOPORTADOS:

1. Bloque "heading":
{
  "type": "heading",
  "data": {
    "content": "Texto del título o insignia",
    "fontSize": "28px", // "12px" para eyebrow, "20px", "24px", "28px", "32px"
    "fontWeight": "800",
    "color": "#0f172a",
    "textAlign": "center", // "left", "center", "right"
    "paddingTop": "8px",
    "paddingBottom": "8px"
  }
}

2. Bloque "text":
{
  "type": "text",
  "data": {
    "content": "Párrafo. Usa **negritas** para resaltar valores clave y \\n para saltos de línea.",
    "fontSize": "15px",
    "fontWeight": "400",
    "color": "#334155",
    "textAlign": "center",
    "lineHeight": "1.7",
    "paddingTop": "4px",
    "paddingBottom": "12px"
  }
}

3. Bloque "box" (Tarjeta Callout Moderna):
{
  "type": "box",
  "data": {
    "backgroundColor": "#f8fafc",
    "borderRadius": "14px",
    "borderWidth": "1px",
    "borderColor": "#e2e8f0",
    "borderStyle": "solid",
    "borderLeftColor": "#2563eb", // ¡ACENTO LATERAL VIBRANTE!
    "borderLeftWidth": "4px",
    "boxShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    "paddingTop": "18px",
    "paddingBottom": "18px",
    "paddingLeft": "22px",
    "paddingRight": "22px",
    "children": [
      // Bloques hijos ("heading", "text")
    ]
  }
}

4. Bloque "image":
{
  "type": "image",
  "data": {
    "url": "https://...",
    "alt": "Descripción",
    "width": "45%", // "45%" o "50%" para logos, "100%" para banners
    "maxWidth": "180px", // "180px" para logos, "100%" para banners
    "alignment": "center",
    "borderRadius": "8px",
    "linkUrl": "",
    "paddingTop": "0px",
    "paddingBottom": "12px"
  }
}

5. Bloque "button":
{
  "type": "button",
  "data": {
    "text": "Acceder al Portal Institucional",
    "url": "https://ejemplo.com",
    "backgroundColor": "#1e40af",
    "textColor": "#ffffff",
    "borderRadius": "12px",
    "fontSize": "15px",
    "fontWeight": "700",
    "paddingX": "34px",
    "paddingY": "14px",
    "alignment": "center",
    "fullWidth": false,
    "boxShadow": "0 4px 14px 0 rgba(30, 64, 175, 0.35)"
  }
}

6. Bloque "youtube":
{
  "type": "youtube",
  "data": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "Título del video",
    "caption": "Descripción breve del video.",
    "buttonText": "Ver Video en YouTube ▶",
    "cardBackground": "#0f172a",
    "textColor": "#f8fafc",
    "borderRadius": "14px",
    "paddingTop": "12px",
    "paddingBottom": "20px"
  }
}

7. Bloque "divider":
{
  "type": "divider",
  "data": {
    "color": "#e2e8f0",
    "thickness": "1px",
    "style": "solid",
    "paddingTop": "20px",
    "paddingBottom": "16px",
    "width": "100%"
  }
}

8. Bloque "social":
{
  "type": "social",
  "data": {
    "alignment": "center",
    "instagram": "https://instagram.com",
    "youtube": "https://youtube.com",
    "twitter": "https://twitter.com",
    "paddingTop": "10px",
    "paddingBottom": "14px"
  }
}

9. Bloque "grid" (Columnas Responsivas, ej. Logo a la izquierda y Texto a la derecha):
{
  "type": "grid",
  "data": {
    "layout": "30-70", // "30-70" para logo+texto, "50-50", "70-30", "25-75"
    "verticalAlign": "middle", // "top", "middle", "bottom"
    "gap": "16px",
    "backgroundColor": "transparent",
    "leftType": "image", // "image" o "text"
    "leftImage": {
      "url": "https://...",
      "alt": "Logo",
      "width": "100px",
      "maxWidth": "120px",
      "borderRadius": "8px",
      "alignment": "center"
    },
    "rightType": "text", // "text" o "image"
    "rightText": {
      "heading": "Título Principal",
      "headingSize": "20px",
      "headingColor": "#0f172a",
      "content": "Párrafo explicativo o información institucional.",
      "textColor": "#475569",
      "fontSize": "14px",
      "alignment": "left"
    }
  }
}

10. Bloque "table" (Tabla Estilizada para credenciales, accesos, precios o datos estructurados):
{
  "type": "table",
  "data": {
    "theme": "modern",
    "headers": ["Servicio / Recurso", "Usuario / Identificador", "Clave / Contraseña"],
    "rows": [
      ["Red Wi-Fi", "NovaTech_Team", "**Segura2026***"],
      ["Correo Corporativo", "usuario@novatech.io", "**Temporal#2026**"]
    ],
    "headerBgColor": "#0f172a",
    "headerTextColor": "#ffffff",
    "rowBgColor": "#ffffff",
    "altRowBgColor": "#f8fafc",
    "textColor": "#334155",
    "borderColor": "#e2e8f0",
    "borderRadius": "12px",
    "striped": true
  }
}

Responde ÚNICAMENTE con el objeto JSON válido.
`;

/**
 * Dynamically queries Google Gemini API to discover active models for this key
 */
async function getAvailableGeminiModel(geminiKey) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const contentModels = models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      console.log('📋 Modelos de Gemini disponibles en la cuenta:', contentModels);

      // Preferred priority for modern Google AI Studio keys (Google recommends gemini-3.6-flash)
      const priorities = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ];

      for (const p of priorities) {
        if (contentModels.includes(p)) {
          return p;
        }
      }

      // Pick any flash model
      const anyFlash = contentModels.find(m => m.includes('flash'));
      if (anyFlash) return anyFlash;

      if (contentModels.length > 0) return contentModels[0];
    }
  } catch (e) {
    console.warn('⚠️ No se pudo consultar la lista de modelos de Gemini:', e.message);
  }

  // Fallback default
  return 'gemini-3.6-flash';
}

/**
 * Scans text to auto-discover image or YouTube URLs
 */
function extractMediaUrls(text, existingImages = [], existingVideos = []) {
  const images = [...existingImages];
  const videos = [...existingVideos];

  if (!text) return { images, videos };

  // Image extension matcher
  const imgRegex = /(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp|svg|ico)(?:\?[^\s"'<>]*)?)/gi;
  let match;
  while ((match = imgRegex.exec(text)) !== null) {
    if (!images.includes(match[1])) {
      images.push(match[1]);
    }
  }

  // YouTube matcher
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)(?:[^\s"'<>]*)?)/gi;
  while ((match = ytRegex.exec(text)) !== null) {
    if (!videos.includes(match[1])) {
      videos.push(match[1]);
    }
  }

  return { images, videos };
}

/**
 * Generate email using Google Gemini API with multi-model fallback and x-goog-api-key header
 */
async function generateWithGemini({ prompt, videoLinks, imageLinks, additionalText, apiKey, model = 'auto' }) {
  const geminiKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!geminiKey) {
    throw new Error('No se encontró una API Key para Google Gemini.');
  }

  // Build candidate model list
  let candidateModels = [];
  if (model && model !== 'auto') {
    candidateModels = Array.from(new Set([
      model,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ]));
  } else {
    const discovered = await getAvailableGeminiModel(geminiKey);
    candidateModels = Array.from(new Set([
      discovered,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ]));
  }

  const userMessageContent = `
Solicitud del usuario:
"${prompt}"

${imageLinks && imageLinks.length > 0 ? `
🚨 REGLA CRÍTICA DE IMÁGENES PROPORCIONADAS:
El usuario ha adjuntado las siguientes imágenes que DEBES OBLIGATORIAMENTE renderizar como bloques "image" con sus URLs exactas:
${imageLinks.map((url, i) => `- [IMAGEN ${i + 1}]: ${url}`).join('\n')}

DIRECTRICES PARA LAS IMÁGENES:
- Si la imagen es un logo institucional o de marca (ej. .png, logo de empresa, startup o marca): DEBES colocarlo como el primer bloque en la cabecera, centrado ("alignment": "center"), con tamaño proporcionado ("width": "45%", "maxWidth": "180px", "borderRadius": "8px").
- Si la imagen es un banner: colócala con "width": "100%", "maxWidth": "100%", "borderRadius": "14px".
- NUNCA omitas una imagen provista por el usuario ni inventes URLs falsas.
` : ''}

${videoLinks && videoLinks.length > 0 ? `
🎥 VIDEOS DE YOUTUBE PROPORCIONADOS (OBLIGATORIO RENDERIZAR COMO BLOQUES "youtube"):
${videoLinks.join('\n')}
` : ''}

${additionalText ? `
📝 DATOS, CREDENCIALES Y CONTENIDO ADICIONAL (OBLIGATORIO INCLUIR EN TARJETAS CALLOUT):
"""${additionalText}"""
` : ''}

🎨 DIRECTRICES DE DISEÑO NO PLANO:
- Diseña un correo NO PLANO, con jerarquía visual de alto impacto (estilo Linear/Stripe/Apple).
- Para credenciales o información clave, usa tarjetas callout con borde de acento ("borderLeftColor": "#2563eb", "boxShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.05)"). Si hay datos de distinta índole (ej. correo vs. red Wi-Fi), sepáralos en tarjetas independientes con colores de acento complementarios.
- Incluye un botón CTA llamativo con esquinas curvas ("borderRadius": "12px") y sombra suave ("boxShadow": "0 4px 14px 0 rgba(37, 99, 235, 0.35)").
- Genera el correo electrónico completo en formato JSON para PrettierMails.
`;

  let lastError = null;

  for (const candidate of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: PRETTIER_MAILS_SYSTEM_PROMPT + '\n\n' + userMessageContent }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    };

    try {
      console.log(`🚀 Conectando con Google Gemini usando modelo: "${candidate}"...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${response.status}`;
        lastError = new Error(msg);
        // If 404, 429 (rate limit) or 503 (high demand), try next model in candidate list
        if ([404, 429, 500, 502, 503, 504].includes(response.status)) {
          continue;
        }

        throw lastError;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('La respuesta de Gemini vino vacía.');
      }

      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleaned);
      parsed.isFallback = false;
      parsed.generatedBy = `Google Gemini (${candidate})`;
      console.log(`✅ ¡Generación exitosa con Gemini (${candidate})!`);
      return parsed;
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('404') || err.message.includes('503') || err.message.includes('429') || err.message.includes('demand'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('No se pudo conectar con los modelos de Gemini disponibles en la cuenta.');
}

/**
 * Generate email using OpenAI API
 */
async function generateWithOpenAi({ prompt, videoLinks, imageLinks, additionalText, apiKey }) {
  const openAiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (!openAiKey) {
    throw new Error('No se encontró una API Key para OpenAI.');
  }

  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const userMessageContent = `
Solicitud del usuario:
"${prompt}"

${videoLinks && videoLinks.length > 0 ? `Enlaces de Videos adjuntados por el usuario:\n${videoLinks.join('\n')}` : ''}

${imageLinks && imageLinks.length > 0 ? `Enlaces de Imágenes adjuntadas por el usuario:\n${imageLinks.join('\n')}` : ''}

${additionalText ? `Textos, notas y contenido adicional:\n"""${additionalText}"""` : ''}
`;

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PRETTIER_MAILS_SYSTEM_PROMPT },
      { role: 'user', content: userMessageContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error en la API de OpenAI (${response.status})`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(rawText);
  parsed.isFallback = false;
  parsed.generatedBy = 'OpenAI (GPT-4o mini)';
  return parsed;
}

/**
 * Smart Fallback Generator: Creates modern, non-flat email designs if the user has NOT provided an API Key
 */
function generateSmartFallback({ prompt, videoLinks = [], imageLinks = [], additionalText = '' }) {
  const pLower = (prompt || '').toLowerCase();
  const primaryVideo = videoLinks.find(v => v.includes('youtube.com') || v.includes('youtu.be')) || (pLower.includes('video') ? 'https://www.youtube.com/watch?v=M7lc1UVf-VE' : null);
  const primaryImage = imageLinks[0] || (pLower.includes('logo') || pLower.includes('empresa') || pLower.includes('institucional') ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' : null);

  let subject = '✨ Bienvenida a nuestra institución';
  let eyebrow = 'COMUNICADO OFICIAL';
  let title = '¡Te damos una cálida bienvenida!';
  let intro = 'Nos llena de orgullo y satisfacción darte la bienvenida a nuestro equipo. A continuación encontrarás toda la información y accesos necesarios para iniciar tus actividades.';

  if (pLower.includes('onboarding') || pLower.includes('bienvenida') || pLower.includes('equipo') || pLower.includes('credenciales')) {
    subject = '🎉 ¡Bienvenido(a) al Equipo! Credenciales y accesos oficiales';
    eyebrow = 'NOVATECH SOLUTIONS • ONBOARDING';
    title = '¡Te damos la bienvenida al equipo!';
    intro = 'Nos alegra mucho tenerte con nosotros. A continuación te compartimos tus credenciales corporativas y accesos iniciales para comenzar.';
  } else if (pLower.includes('lanzamiento') || pLower.includes('nuevo')) {
    subject = '🚀 ¡Gran Lanzamiento Oficial! No te lo pierdas';
    eyebrow = 'NOVEDAD EXCLUSIVA';
    title = 'Presentamos nuestro lanzamiento más esperado 🎉';
    intro = 'Hoy es un día histórico. Te presentamos todas las características, novedades y beneficios que estabas esperando.';
  } else if (pLower.includes('webinar') || pLower.includes('masterclass') || pLower.includes('curso')) {
    subject = '🎓 Invitación Exclusiva: Masterclass en Vivo';
    eyebrow = 'FORMACIÓN EN VIVO';
    title = 'Aprende y multiplica tus resultados en vivo';
    intro = 'Acompáñanos en esta sesión donde compartiremos estrategias prácticas y sesión de preguntas.';
  }

  const generatedBlocks = [];

  // Top Image / Logo if provided
  if (primaryImage) {
    generatedBlocks.push({
      id: `ai-img-${Date.now()}-1`,
      type: 'image',
      data: {
        url: primaryImage,
        alt: 'Logo Institucional',
        width: '45%',
        maxWidth: '180px',
        alignment: 'center',
        borderRadius: '8px',
        paddingTop: '0px',
        paddingBottom: '12px',
      },
    });
  }

  // Eyebrow tag
  generatedBlocks.push({
    id: `ai-eye-${Date.now()}-2`,
    type: 'heading',
    data: {
      content: eyebrow,
      fontSize: '12px',
      fontWeight: '800',
      color: '#2563eb',
      textAlign: 'center',
      paddingTop: '4px',
      paddingBottom: '2px',
    },
  });

  // Main Hero Heading
  generatedBlocks.push({
    id: `ai-head-${Date.now()}-3`,
    type: 'heading',
    data: {
      content: title,
      fontSize: '28px',
      fontWeight: '800',
      color: '#0f172a',
      textAlign: 'center',
      paddingTop: '6px',
      paddingBottom: '8px',
    },
  });

  // Intro text
  generatedBlocks.push({
    id: `ai-txt-${Date.now()}-4`,
    type: 'text',
    data: {
      content: intro,
      fontSize: '15px',
      fontWeight: '400',
      color: '#475569',
      textAlign: 'center',
      lineHeight: '1.7',
      paddingTop: '4px',
      paddingBottom: '16px',
    },
  });

  // YouTube Video block if provided
  if (primaryVideo) {
    generatedBlocks.push({
      id: `ai-yt-${Date.now()}-5`,
      type: 'youtube',
      data: {
        url: primaryVideo,
        title: 'Video de Inducción Corporativa',
        caption: 'Haz clic para reproducir el video de bienvenida y conocer nuestro equipo.',
        buttonText: 'Ver Video en YouTube ▶',
        cardBackground: '#0f172a',
        textColor: '#f8fafc',
        borderRadius: '14px',
        paddingTop: '10px',
        paddingBottom: '20px',
      },
    });
  }

  // Callout Card 1: Corporate Email Credentials
  generatedBlocks.push({
    id: `ai-box-${Date.now()}-6`,
    type: 'box',
    data: {
      backgroundColor: '#f8fafc',
      borderRadius: '14px',
      borderWidth: '1px',
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      borderLeftColor: '#2563eb',
      borderLeftWidth: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      paddingTop: '18px',
      paddingBottom: '18px',
      paddingLeft: '22px',
      paddingRight: '22px',
      children: [
        {
          id: `ai-nested-head-${Date.now()}-1`,
          type: 'heading',
          data: {
            content: '📬 Tu Correo Corporativo',
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e3a8a',
            textAlign: 'left',
            paddingTop: '0px',
            paddingBottom: '6px',
          },
        },
        {
          id: `ai-nested-txt-${Date.now()}-1`,
          type: 'text',
          data: {
            content: 'Se ha creado tu casilla de correo oficial para comunicaciones internas del equipo:\n\n• **Correo electrónico:** {{corporate_email}}\n• **Estado:** Cuenta Activa',
            fontSize: '14px',
            fontWeight: '400',
            color: '#334155',
            textAlign: 'left',
            lineHeight: '1.7',
            paddingTop: '0px',
            paddingBottom: '0px',
          },
        },
      ],
    },
  });

  // Callout Card 2: Wi-Fi Access
  generatedBlocks.push({
    id: `ai-box-${Date.now()}-7`,
    type: 'box',
    data: {
      backgroundColor: '#f8fafc',
      borderRadius: '14px',
      borderWidth: '1px',
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      borderLeftColor: '#059669',
      borderLeftWidth: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      paddingTop: '18px',
      paddingBottom: '18px',
      paddingLeft: '22px',
      paddingRight: '22px',
      children: [
        {
          id: `ai-nested-head-${Date.now()}-2`,
          type: 'heading',
          data: {
            content: '📶 Acceso a la Red Wi-Fi Corporativa',
            fontSize: '16px',
            fontWeight: '700',
            color: '#065f46',
            textAlign: 'left',
            paddingTop: '0px',
            paddingBottom: '6px',
          },
        },
        {
          id: `ai-nested-txt-${Date.now()}-2`,
          type: 'text',
          data: {
            content: 'Para conectarte a la red inalámbrica dentro de nuestras oficinas:\n\n• **Nombre de Red (SSID):** NovaTech_Office\n• **Usuario:** {{network_user}}\n• **Contraseña:** {{wifi_password}}',
            fontSize: '14px',
            fontWeight: '400',
            color: '#334155',
            textAlign: 'left',
            lineHeight: '1.7',
            paddingTop: '0px',
            paddingBottom: '0px',
          },
        },
      ],
    },
  });

  // Call to action button
  generatedBlocks.push({
    id: `ai-btn-${Date.now()}-8`,
    type: 'button',
    data: {
      text: pLower.includes('onboarding') || pLower.includes('bienvenida') || pLower.includes('equipo') ? 'Acceder al Portal del Colaborador' : 'Comenzar Ahora &rarr;',
      url: 'https://novatech.io',
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '700',
      paddingX: '34px',
      paddingY: '14px',
      alignment: 'center',
      fullWidth: false,
      boxShadow: '0 4px 14px 0 rgba(30, 64, 175, 0.35)',
    },
  });

  // Divider and footer
  generatedBlocks.push({
    id: `ai-div-${Date.now()}-9`,
    type: 'divider',
    data: {
      color: '#e2e8f0',
      thickness: '1px',
      style: 'solid',
      paddingTop: '20px',
      paddingBottom: '16px',
      width: '100%',
    },
  });

  // Footer help text
  generatedBlocks.push({
    id: `ai-help-${Date.now()}-10`,
    type: 'text',
    data: {
      content: 'Si presentas algún inconveniente con el acceso a tus credenciales, por favor contacta al equipo de TI.\n¡Te deseamos el mayor de los éxitos en este nuevo comienzo!',
      fontSize: '13px',
      fontWeight: '400',
      color: '#64748b',
      textAlign: 'center',
      lineHeight: '1.6',
      paddingTop: '4px',
      paddingBottom: '10px',
    },
  });

  generatedBlocks.push({
    id: `ai-soc-${Date.now()}-11`,
    type: 'social',
    data: {
      alignment: 'center',
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
      twitter: 'https://twitter.com',
      paddingTop: '4px',
      paddingBottom: '12px',
    },
  });

  return {
    subject,
    globalSettings: {
      backgroundColor: '#f1f5f9',
      contentBackgroundColor: '#ffffff',
      contentWidth: '600px',
      borderRadius: '18px',
      textColor: '#1e293b',
      padding: '36px',
    },
    blocks: generatedBlocks,
    isFallback: true,
    generatedBy: 'local-fallback',
  };
}

/**
 * Normalizes and guarantees unique IDs for all blocks and children
 */
function sanitizeGeneratedEmail(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('Formato inválido devuelto por el generador de IA.');
  }

  const subject = result.subject || 'Correo creado con PrettierMails AI';
  const globalSettings = {
    backgroundColor: result.globalSettings?.backgroundColor || '#f1f5f9',
    contentBackgroundColor: result.globalSettings?.contentBackgroundColor || '#ffffff',
    contentWidth: result.globalSettings?.contentWidth || '600px',
    borderRadius: result.globalSettings?.borderRadius || '18px',
    textColor: result.globalSettings?.textColor || '#1e293b',
    padding: result.globalSettings?.padding || '36px',
  };

  const rawBlocks = Array.isArray(result.blocks) ? result.blocks : [];
  const blocks = rawBlocks.map((block, idx) => {
    const id = block.id || `ai-block-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Ensure nested children have IDs
    let data = { ...(block.data || {}) };
    if (block.type === 'box' && Array.isArray(data.children)) {
      data.children = data.children.map((child, cIdx) => ({
        ...child,
        id: child.id || `ai-child-${Date.now()}-${cIdx}-${Math.random().toString(36).substr(2, 4)}`,
      }));
    }

    return {
      id,
      type: block.type || 'text',
      data,
    };
  });

  return {
    success: true,
    subject,
    globalSettings,
    blocks,
    isFallback: Boolean(result.isFallback),
    generatedBy: result.generatedBy || 'ai',
  };
}

/**
 * Main AI Generation Dispatcher
 */
export async function generateEmailWithAi({
  prompt,
  videoLinks = [],
  imageLinks = [],
  additionalText = '',
  apiKey = null,
  provider = 'gemini',
  model = 'auto',
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Por favor, ingresa una instrucción o descripción para el correo.');
  }

  // Auto-discover media URLs from prompt and additionalText so no link is ever missed
  const combinedContext = `${prompt}\n${additionalText}`;
  const extracted = extractMediaUrls(combinedContext, imageLinks, videoLinks);
  const finalImageLinks = extracted.images;
  const finalVideoLinks = extracted.videos;

  const hasGeminiKey = Boolean((apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY);
  const hasOpenAiKey = Boolean((apiKey && apiKey.trim()) || process.env.OPENAI_API_KEY);

  let result = null;

  if (provider === 'gemini' && hasGeminiKey) {
    try {
      result = await generateWithGemini({
        prompt,
        videoLinks: finalVideoLinks,
        imageLinks: finalImageLinks,
        additionalText,
        apiKey,
        model,
      });
    } catch (err) {
      console.warn('⚠️ Modelos de Gemini remotos con incidencia o no disponibles. Usando síntesis estructurada local:', err.message);
      result = generateSmartFallback({
        prompt,
        videoLinks: finalVideoLinks,
        imageLinks: finalImageLinks,
        additionalText,
      });
    }
  } else if (provider === 'openai' && hasOpenAiKey) {
    try {
      result = await generateWithOpenAi({
        prompt,
        videoLinks: finalVideoLinks,
        imageLinks: finalImageLinks,
        additionalText,
        apiKey,
      });
    } catch (err) {
      console.warn('⚠️ Error en OpenAI API. Usando síntesis estructurada local:', err.message);
      result = generateSmartFallback({
        prompt,
        videoLinks: finalVideoLinks,
        imageLinks: finalImageLinks,
        additionalText,
      });
    }
  } else {
    // Smart fallback synthesizer if no key is provided
    console.log('💡 Generando con motor de síntesis local de PrettierMails.');
    result = generateSmartFallback({
      prompt,
      videoLinks: finalVideoLinks,
      imageLinks: finalImageLinks,
      additionalText,
    });
  }

  return sanitizeGeneratedEmail(result);
}
