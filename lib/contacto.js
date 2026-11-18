// Lógica compartida del formulario de contacto.
// Valida los datos y los reenvía al webhook de Make, que guarda la solicitud
// en la hoja «FORMULARIO DE CONTACTO» y manda el correo de confirmación.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERESES = [
  'Una pieza concreta',
  'Asesoría de interiorismo',
  'Proyecto profesional',
];

function limpiar(valor, max) {
  return String(valor ?? '').trim().slice(0, max);
}

async function enviarSolicitud(body) {
  const datos = {
    nombre: limpiar(body.nombre, 120),
    email: limpiar(body.email, 160),
    telefono: limpiar(body.telefono, 40),
    interes: limpiar(body.interes, 60),
    mensaje: limpiar(body.mensaje, 3000),
  };

  if (!datos.nombre) return { status: 400, error: 'Falta tu nombre' };
  if (!EMAIL_RE.test(datos.email)) return { status: 400, error: 'Revisa tu email' };
  if (!body.privacidad) return { status: 400, error: 'Tienes que aceptar la política de privacidad' };
  if (!INTERESES.includes(datos.interes)) datos.interes = INTERESES[0];

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (!webhook) {
    console.error('Falta la variable de entorno MAKE_WEBHOOK_URL');
    return { status: 503, error: 'El formulario aún no está conectado' };
  }

  const respuesta = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...datos,
      origen: 'Web Ecléctico',
      fecha: new Date().toISOString(),
    }),
  });

  if (!respuesta.ok) {
    console.error('Make respondió', respuesta.status, await respuesta.text().catch(() => ''));
    return { status: 502, error: 'No hemos podido registrar tu solicitud' };
  }
  return { status: 200, ok: true };
}

module.exports = { enviarSolicitud };
