// «Convertir en foto realista»: manda el montaje del probador a un modelo de imagen de Gemini.
// Usa la misma clave GEMINI_API_KEY que el decorador (solo en el servidor).
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_IMAGEN = 3_000_000; // ~3 MB en base64
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

const PROMPT = 'Convierte esta imagen en una fotografía de interiorismo totalmente realista. Mantén la habitación exactamente igual (paredes, suelo, ventanas, luz) y mantén cada mueble y objeto en la misma posición y tamaño, pero intégralos de forma fotorrealista: perspectiva correcta, sombras de contacto en el suelo, reflejos y la misma iluminación y temperatura de color de la estancia. Materiales con textura real (madera, terciopelo, latón, cerámica). Estilo ecléctico y cálido, sin añadir ni quitar objetos.';

// Google cambia los nombres de los modelos a menudo: se buscan los que generan imágenes.
let cache = null;
async function modelosImagen() {
  if (process.env.GEMINI_IMAGE_MODEL) return [process.env.GEMINI_IMAGE_MODEL];
  if (cache && Date.now() - cache.t < 3600_000) return cache.m;
  const r = await fetch(`${BASE}/models?pageSize=1000`, { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((j.error && j.error.message) || 'No se pudo listar modelos'), { status: r.status });
  const m = (j.models || [])
    .filter((x) => /image/i.test(x.name) && !/imagen-|embedding|tts|live/i.test(x.name)
      && (x.supportedGenerationMethods || ['generateContent']).includes('generateContent'))
    .map((x) => x.name.replace('models/', ''))
    // Primero «flash» normal (calidad/rapidez), luego lite y pro; los preview al final.
    .sort((a, b) => (/preview/.test(a) - /preview/.test(b)) || (/lite/.test(a) - /lite/.test(b)) || (/flash/.test(b) - /flash/.test(a)) || b.localeCompare(a, 'en', { numeric: true }));
  cache = { t: Date.now(), m };
  return m;
}

async function hacerRealista(body) {
  if (!process.env.GEMINI_API_KEY) return { ok: false, status: 503, error: 'La IA no está configurada' };
  const img = String(body.imagen || '');
  const mm = img.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!mm || mm[2].length > MAX_IMAGEN) return { ok: false, status: 400, error: 'Imagen no válida' };
  const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.slice(0, 3000) : PROMPT;

  const modelos = (await modelosImagen()).slice(0, 4);
  if (!modelos.length) return { ok: false, status: 502, error: 'No hay modelo de imagen disponible' };

  let ultimo = 'sin respuesta';
  let cuota = false;
  for (const modelo of modelos) {
    for (let intento = 0; intento < 2; intento++) {
      const r = await fetch(`${BASE}/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mm[1], data: mm[2] } }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const parts = j.candidates?.[0]?.content?.parts || [];
        const p = parts.find((x) => x.inline_data || x.inlineData);
        if (p) {
          const d = p.inline_data || p.inlineData;
          return { ok: true, status: 200, imagen: `data:${d.mime_type || d.mimeType || 'image/png'};base64,${d.data}`, modelo };
        }
        ultimo = `${modelo}: sin imagen (${parts.map((x) => x.text || '').join(' ').slice(0, 200) || j.candidates?.[0]?.finishReason || '?'})`;
        console.error('Gemini imagen', ultimo);
        break; // prueba el siguiente modelo
      }
      ultimo = `${modelo} ${r.status} ${JSON.stringify(j).slice(0, 300)}`;
      console.error('Gemini imagen', ultimo);
      if (r.status === 503 || r.status === 500) { if (intento === 0) { await espera(2000); continue; } break; }
      if (r.status === 429) { cuota = true; break; }
      if (r.status === 404 || r.status === 400 || r.status === 403) break;
      break;
    }
  }
  return { ok: false, status: cuota ? 429 : 502, error: cuota ? 'rate_limited' : 'La IA no ha podido crear la imagen' };
}

// Comprobación (sin mostrar la clave): qué modelos de imagen ve la cuenta.
async function estadoRealista() {
  if (!process.env.GEMINI_API_KEY) return { disponible: false };
  try { return { disponible: true, modelos: (await modelosImagen()).slice(0, 6) }; }
  catch (e) { return { disponible: false, error: e.message }; }
}

module.exports = { hacerRealista, estadoRealista };
