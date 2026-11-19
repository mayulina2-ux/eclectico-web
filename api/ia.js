// Función de Vercel: GET /api/ia (¿está activa?) · POST /api/ia (preguntar al decorador)
const { preguntarIA, iaDisponible } = require('../lib/ia');

module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).json({ disponible: iaDisponible() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const r = await preguntarIA(body);
    return res.status(r.status).json(r.ok ? { text: r.text } : { error: r.error });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error inesperado' });
  }
};
