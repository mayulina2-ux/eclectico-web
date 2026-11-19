# Ecléctico · Espacios con personalidad

Web de **Ecléctico**, tienda de muebles, decoración y antigüedades en C/ Reina Victoria 18, Elda (Alicante).

## Qué incluye

- `public/index.html` — la web: portada con música, quiénes somos, nuestra tienda, colecciones, servicios, probador, galería, opiniones y contacto.
- `public/probador/` — el probador de estancias (coloca piezas del catálogo sobre una foto de tu casa).
- `api/contacto.js` — función de Vercel que recibe el formulario y lo envía a Make.
- `server.js` — servidor Express para probar la web en tu ordenador.

## Probarla en local

```bash
npm install
cp .env.example .env   # y pon la dirección del webhook de Make
npm start              # http://localhost:3000
```

## Formulario de contacto

El formulario envía los datos a `POST /api/contacto`, que los reenvía al webhook de Make
(escenario «Integration Google Sheets»). Make guarda la solicitud en la hoja
**FORMULARIO DE CONTACTO** y manda el correo de confirmación al cliente.

Para que funcione en Vercel, añade la variable de entorno `MAKE_WEBHOOK_URL`
en *Project → Settings → Environment Variables*.

## Decorador IA del probador

Los botones «Colocar con IA» y «¿Qué le va a mi estancia?» llaman a `/api/ia`
(`api/ia.js` + `lib/ia.js`), que pregunta a Google Gemini con la foto de la estancia.
Para activarlo, crea una clave gratis en https://aistudio.google.com/apikey y añádela en Vercel
como variable de entorno `GEMINI_API_KEY`. Sin clave, el probador funciona a mano.

## Despliegue

Cada `git push` a `main` se publica automáticamente en Vercel.

---
Proyecto final · Curso de Inteligencia Artificial · Mariola Camacho
