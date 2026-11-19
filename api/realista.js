// Función de Vercel: GET /api/realista (¿qué modelos hay?) · POST /api/realista (montaje → foto realista)
const { hacerRealista, estadoRealista } = require('../lib/realista');

module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).json(await estadoRealista());
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const r = await hacerRealista(body);
    return res.status(r.status).json(r.ok ? { imagen: r.imagen } : { error: r.error });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error inesperado' });
  }
};
