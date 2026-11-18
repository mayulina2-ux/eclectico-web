// Servidor local para desarrollo: sirve la web y el formulario igual que Vercel.
// Uso: npm install && npm start  →  http://localhost:3000
const path = require('path');
const express = require('express');
const { enviarSolicitud } = require('./lib/contacto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
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

app.listen(PORT, () => {
  console.log(`Ecléctico en http://localhost:${PORT}`);
});
