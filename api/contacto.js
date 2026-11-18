// Función de Vercel: POST /api/contacto
const { enviarSolicitud } = require('../lib/contacto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const r = await enviarSolicitud(body);
    return res.status(r.status).json(r.ok ? { ok: true } : { error: r.error });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error inesperado' });
  }
};
