const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const MAX_TEXTO_ENVIO = 100;

function headersEnvio(conBody = false) {
  const token = localStorage.getItem('token');
  const headers = conBody ? { 'Content-Type': 'application/json' } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Todos los endpoints de envíos responden { success: false, message } ante un error.
async function leerRespuesta(response, mensaje) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || payload.error || `${mensaje} (Error ${response.status}).`);
    error.status = response.status;
    // Token vencido o ausente: la vista ofrece volver a iniciar sesión.
    error.sesionVencida = response.status === 401;
    throw error;
  }
  return payload;
}

// Pedidos de la tienda logueada, con o sin envío (id_envio null si no tiene).
export async function obtenerEnvios(signal) {
  const response = await fetch(`${API_URL}/envios`, { headers: headersEnvio(), signal });
  const payload = await leerRespuesta(response, 'No se pudieron obtener los envíos');
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function obtenerSeguimiento(idPedido, signal) {
  const response = await fetch(`${API_URL}/pedidos/${encodeURIComponent(idPedido)}/seguimiento`, {
    headers: headersEnvio(),
    signal,
  });
  const payload = await leerRespuesta(response, 'No se pudo obtener el seguimiento del pedido');
  return payload.data;
}

// Body: { id_pedido, repartidor, direccion?, nombre_comprador? }. Responde { estado, data }.
export async function crearEnvio(datos) {
  const response = await fetch(`${API_URL}/envios`, {
    method: 'POST',
    headers: headersEnvio(true),
    body: JSON.stringify(datos),
  });
  return leerRespuesta(response, 'No se pudo crear el envío');
}

// Body: { repartidor?, direccion?, nombre_comprador? } (solo cambia lo que se manda).
export async function editarEnvio(idEnvio, datos) {
  const response = await fetch(`${API_URL}/envios/${encodeURIComponent(idEnvio)}`, {
    method: 'PUT',
    headers: headersEnvio(true),
    body: JSON.stringify(datos),
  });
  const payload = await leerRespuesta(response, 'No se pudo editar el envío');
  return payload.data;
}

// Responde { estado } con el estado al que volvió el pedido.
export async function eliminarEnvio(idEnvio) {
  const response = await fetch(`${API_URL}/envios/${encodeURIComponent(idEnvio)}`, {
    method: 'DELETE',
    headers: headersEnvio(),
  });
  return leerRespuesta(response, 'No se pudo eliminar el envío');
}

// "Entregado" se marca por PATCH; "Enviado" solo se pone creando el envío.
export async function marcarEntregado(idPedido) {
  const response = await fetch(`${API_URL}/pedidos/${encodeURIComponent(idPedido)}/estado`, {
    method: 'PATCH',
    headers: headersEnvio(true),
    body: JSON.stringify({ estado: 'Entregado' }),
  });
  return leerRespuesta(response, 'No se pudo marcar el pedido como entregado');
}
