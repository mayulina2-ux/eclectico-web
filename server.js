// Servidor local para desarrollo: sirve la web y el formulario igual que Vercel.
// Uso: npm install && npm start  →  http://localhost:3000
const path = require('path');
// Lee el archivo .env si existe (GEMINI_API_KEY, MAKE_WEBHOOK_URL) para probar en local.
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (e) { /* sin .env */ }
const express = require('express');
const { enviarSolicitud } = require('./lib/contacto');
const { preguntarIA, iaDisponible } = require('./lib/ia');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.post('/api/contacto', async (req, res) => {
  try {
    const r = await enviarSolicitud(req.body || {});
    res.status(r.status).json(r.ok ? { ok: true } : { error: r.error });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inesperado' });
  }
});

app.get('/api/ia', (req, res) => res.json({ disponible: iaDisponible() }));
app.post('/api/ia', async (req, res) => {
  try {
    const r = await preguntarIA(req.body || {});
    res.status(r.status).json(r.ok ? { text: r.text } : { error: r.error });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inesperado' });
  }
});

app.listen(PORT, () => {
  console.log(`Ecléctico en http://localhost:${PORT}`);
});
