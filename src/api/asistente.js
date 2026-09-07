const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const RUTAS = ['/asistente/chat', '/chat/gemini', '/api/asistente/chat'];

function extraerTexto(payload) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const candidatos = [
    payload.respuesta,
    payload.reply,
    payload.texto,
    payload.message,
    payload.text,
    payload.answer,
    payload.content,
    payload.mensaje,
  ];

  for (const candidato of candidatos) {
    if (typeof candidato === 'string' && candidato.trim()) return candidato;
  }

  if (payload.data && typeof payload.data === 'object') return extraerTexto(payload.data);
  return '';
}

export async function enviarMensajeAsistente({ mensaje, modo, historial = [], contexto = {} }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const historialCorto = historial.slice(-30);
  const body = JSON.stringify({ mensaje, modo, historial: historialCorto, contexto });
  let ultimoError = null;

  for (const ruta of RUTAS) {
    try {
      const respuesta = await fetch(`${API_URL}${ruta}`, {
        method: 'POST',
        headers,
        body,
      });
      const payload = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const error = new Error(
          payload.message || payload.error || payload.details || `El asistente respondió con el estado ${respuesta.status}.`
        );
        error.status = respuesta.status;
        error.body = payload;
        throw error;
      }

      const texto = extraerTexto(payload);
      if (!texto.trim()) throw new Error('El asistente devolvió una respuesta vacía.');
      return texto;
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError || new Error('No se pudo conectar con el asistente.');
}

export default { enviarMensajeAsistente };