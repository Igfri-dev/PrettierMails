import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Key, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Wand2
} from 'lucide-react';
import YoutubeIcon from '../YoutubeIcon.jsx';
import confetti from 'canvas-confetti';

const PROMPT_SUGGESTIONS = [
  {
    label: '🚀 Lanzamiento de Producto',
    prompt: 'Crea un correo de lanzamiento para un nuevo producto digital. Incluye un video de demostración, una caja con los 3 beneficios clave y un botón de llamada a la acción con oferta de lanzamiento.',
  },
  {
    label: '🎓 Invitación a Masterclass',
    prompt: 'Diseña un correo invitando a una clase en vivo gratuita. Destaca el temario en una caja con fondo azul claro, incluye el enlace de video y un botón para reservar plaza con cupos limitados.',
  },
  {
    label: '⚡ Oferta Flash con Descuento',
    prompt: 'Crea un correo de urgencia para una promoción de 48 horas. Agrega un banner visual, descuento especial del 30% en una caja destacada y un botón de compra directa.',
  },
  {
    label: '📰 Newsletter Tecnológico',
    prompt: 'Boletín semanal con un artículo principal, un video recomendado de YouTube y una sección de recursos destacados de la semana.',
  },
];

export default function AiGeneratorModal({
  isOpen,
  onClose,
  onApplyGeneratedEmail,
}) {
  if (!isOpen) return null;

  // Form State
  const [prompt, setPrompt] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [videoLinks, setVideoLinks] = useState([]);
  const [imageInput, setImageInput] = useState('');
  const [imageLinks, setImageLinks] = useState([]);
  const [additionalText, setAdditionalText] = useState('');

  // Provider, Model and API Key
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('auto');
  const [apiKey, setApiKey] = useState('');
  const [showKeySettings, setShowKeySettings] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load saved API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('prettier_mails_gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key when updated
  const handleKeyChange = (val) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('prettier_mails_gemini_key', val.trim());
    } else {
      localStorage.removeItem('prettier_mails_gemini_key');
    }
  };

  // Add video link (supports multiple URLs separated by space, comma or newline)
  const handleAddVideo = (valToAdd) => {
    const target = typeof valToAdd === 'string' ? valToAdd : videoInput;
    if (!target.trim()) return;
    const splitUrls = target
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));
    
    if (splitUrls.length > 0) {
      setVideoLinks((prev) => Array.from(new Set([...prev, ...splitUrls])));
    } else if (target.trim()) {
      setVideoLinks((prev) => Array.from(new Set([...prev, target.trim()])));
    }
    setVideoInput('');
  };

  // Add image link (supports multiple URLs separated by space, comma or newline)
  const handleAddImage = (valToAdd) => {
    const target = typeof valToAdd === 'string' ? valToAdd : imageInput;
    if (!target.trim()) return;
    const splitUrls = target
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (splitUrls.length > 0) {
      setImageLinks((prev) => Array.from(new Set([...prev, ...splitUrls])));
    } else if (target.trim()) {
      setImageLinks((prev) => Array.from(new Set([...prev, target.trim()])));
    }
    setImageInput('');
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Por favor describe el tipo de correo que deseas crear.');
      return;
    }

    // Auto-capture any typed text in imageInput or videoInput even if user didn't click "+"
    const finalImageLinks = [...imageLinks];
    if (imageInput.trim()) {
      const pendingImages = imageInput
        .split(/[\s,]+/)
        .map((u) => u.trim())
        .filter(Boolean);
      pendingImages.forEach((img) => {
        if (!finalImageLinks.includes(img)) finalImageLinks.push(img);
      });
    }

    const finalVideoLinks = [...videoLinks];
    if (videoInput.trim()) {
      const pendingVideos = videoInput
        .split(/[\s,]+/)
        .map((u) => u.trim())
        .filter(Boolean);
      pendingVideos.forEach((vid) => {
        if (!finalVideoLinks.includes(vid)) finalVideoLinks.push(vid);
      });
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/generate-ai-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          videoLinks: finalVideoLinks,
          imageLinks: finalImageLinks,
          additionalText,
          apiKey: apiKey.trim() || undefined,
          provider,
          model,
        }),
      });

      clearInterval(stepInterval);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar el correo con IA.');
      }

      // Success
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      onApplyGeneratedEmail({
        subject: data.subject,
        globalSettings: data.globalSettings,
        blocks: data.blocks,
      });

      onClose();
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg(err.message || 'Ocurrió un error en la generación con IA.');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Generador de Correos con IA</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Gemini & OpenAI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diseña correos completos con cajas, videos de YouTube, fondos y textos de forma autónoma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prompt Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-brand-400" />
                ¿Qué correo deseas crear? (Instrucciones)
              </span>
            </label>
            <textarea
              id="ai-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe el correo que deseas generar con IA... (ej: 'Escribe un correo promocional para el lanzamiento de...')"
              className="w-full bg-[#0d121c] border-2 border-purple-500/70 focus:border-purple-400 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none shadow-[0_0_20px_rgba(168,85,247,0.2)] transition leading-relaxed font-normal"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Ideas rápidas:</span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => setPrompt(sug.prompt)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* ATTACHMENTS SECTION */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>📎 Adjuntar Recursos (Videos, Imágenes y Textos)</span>
            </div>

            {/* Video Links (YouTube) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                Adjuntar Link de Video de YouTube
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVideo())}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Video</span>
                </button>
              </div>

              {/* Video Chips */}
              {videoLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {videoLinks.map((v, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e2638] border border-red-500/30 text-slate-200 text-xs shadow-sm"
                    >
                      <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold">
                        ▶
                      </span>
                      <span className="truncate max-w-xs text-[11px] font-medium">Video: {v.replace(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/, '').substring(0, 24)}...</span>
                      <button
                        type="button"
                        onClick={() => setVideoLinks(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-400 transition ml-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Links */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Imágenes:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  placeholder="https://images.unsplash.com/... o https://example.com/logo.png"
                  className="flex-1 bg-[#0f1422] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddImage()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Imagen</span>
                </button>
              </div>

              {/* Image Chips */}
              {imageLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {imageLinks.map((img, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e2638] border border-blue-500/30 text-slate-200 text-xs shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate max-w-xs text-[11px] font-medium">Imagen: {img.split('/').pop().substring(0, 20) || 'Imagen'}</span>
                      <button
                        type="button"
                        onClick={() => setImageLinks(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-400 transition ml-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Text / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Textos y Notas Adicionales (Copys, precios, fechas o puntos clave)
              </label>
              <textarea
                rows={2}
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                placeholder="Pega aquí el contenido que quieras que la IA incluya (ej. Cupón: DESC20, Fecha: Viernes 18:00hs, 3 ventajas principales)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* AI Settings Accordion */}
          <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/30 space-y-2">
            <button
              type="button"
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Configurar API Key de IA (Google Gemini / OpenAI)
              </span>
              <span className="text-[11px] text-brand-400">
                {showKeySettings ? 'Ocultar' : 'Configurar'}
              </span>
            </button>

            {showKeySettings && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === 'gemini'}
                      onChange={() => setProvider('gemini')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>Google Gemini (Recomendado)</span>
                  </label>
                  <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === 'openai'}
                      onChange={() => setProvider('openai')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>OpenAI (GPT-4o mini)</span>
                  </label>
                </div>

                {provider === 'gemini' && (
                  <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Modelo de Gemini:</span>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="auto">Auto-detectar activo (Recomendado)</option>
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Rápido y Alta Disponibilidad)</option>
                      <option value="gemini-3.6-flash">gemini-3.6-flash</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                      <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder={provider === 'gemini' ? 'Pega tu clave AIzaSy...' : 'Pega tu clave sk-...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Se guarda de forma segura en tu navegador.</span>
                    {provider === 'gemini' && (
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <span>Obtener clave gratis en Google AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#232d42] bg-[#0c101a] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/30 border border-purple-400/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  {loadingStep === 1 && 'Analizando solicitud y recursos...'}
                  {loadingStep === 2 && 'Diseñando cajas, video y estructura...'}
                  {loadingStep >= 3 && 'Optimizando estilos y paleta...'}
                </span>
              </>
            ) : (
              <>
                <span>Generar Correo</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
