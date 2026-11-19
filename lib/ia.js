// Decorador IA del probador: reenvía la petición a Google Gemini.
// La clave va en la variable de entorno GEMINI_API_KEY (nunca en la web).
// Se consigue gratis en https://aistudio.google.com/apikey

// Se prueban en orden; si Google retira uno, pasa al siguiente.
const MODELOS = [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'].filter(Boolean);
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const MAX_PROMPT = 12000;
const MAX_IMAGEN = 3_000_000; // ~3 MB en base64

function iaDisponible() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function preguntarIA(body) {
  if (!iaDisponible()) return { ok: false, status: 503, error: 'La IA no está configurada' };

  const prompt = String(body.prompt || '').slice(0, MAX_PROMPT);
  if (!prompt) return { ok: false, status: 400, error: 'Falta la pregunta' };

  const parts = [{ text: prompt }];
  const img = body.imagen;
  if (img && typeof img === 'string') {
    const m = img.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m || m[2].length > MAX_IMAGEN) return { ok: false, status: 400, error: 'Imagen no válida' };
    parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }

  let r, j;
  intentos: for (const modelo of MODELOS) {
    for (let intento = 0; intento < 2; intento++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
        }),
      });
      j = await r.json().catch(() => ({}));
      if (r.ok) break intentos;
      console.error('Gemini', modelo, r.status, JSON.stringify(j).slice(0, 300));
      // 503/500 = saturado: reintenta una vez y luego prueba otro modelo. 404 = modelo retirado. 429 = cuota.
      if (r.status === 503 || r.status === 500) { if (intento === 0) { await espera(1500); continue; } break; }
      if (r.status === 404 || r.status === 429) break;
      break intentos;
    }
  }
  if (!r.ok) return { ok: false, status: r.status === 429 ? 429 : 502, error: r.status === 429 ? 'rate_limited' : 'La IA no ha respondido' };
  const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) return { ok: false, status: 502, error: 'Respuesta vacía' };
  return { ok: true, status: 200, text };
}

module.exports = { preguntarIA, iaDisponible };
