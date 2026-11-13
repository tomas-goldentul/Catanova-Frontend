const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PERIODOS_ESTADISTICAS = ['hoy', 'semana', 'mes'];

function headersAuth() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// El back no siempre responde JSON (rutas inexistentes o errores de Express devuelven HTML),
// así que leemos el texto y solo lo parseamos si corresponde.
async function leerRespuesta(res, mensajeGenerico) {
  const esJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = esJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const mensaje = res.status === 401
      ? 'Tu sesión expiró. Volvé a iniciar sesión.'
      : (data?.message || mensajeGenerico);
    const error = new Error(mensaje);
    error.status = res.status;
    throw error;
  }

  if (!data) throw new Error(mensajeGenerico);
  return data.data ?? data;
}

// GET /estadisticas/tienda/:idTienda?periodo=hoy|semana|mes
export async function getEstadisticasTienda(idTienda, periodo, signal) {
  const res = await fetch(
    `${API_URL}/estadisticas/tienda/${encodeURIComponent(idTienda)}?periodo=${encodeURIComponent(periodo)}`,
    { headers: headersAuth(), signal }
  );
  return leerRespuesta(res, 'No se pudieron cargar las estadísticas.');
}

// GET /estadisticas/tienda/:idTienda/lectura?periodo=... → { periodo, texto, modelo, generado_en }
// Puede tardar varios segundos (Gemini) y devolver 503 si la IA no está configurada.
export async function getLecturaEstadisticas(idTienda, periodo, signal) {
  const res = await fetch(
    `${API_URL}/estadisticas/tienda/${encodeURIComponent(idTienda)}/lectura?periodo=${encodeURIComponent(periodo)}`,
    { headers: headersAuth(), signal }
  );
  return leerRespuesta(res, 'No se pudo generar la lectura.');
}
