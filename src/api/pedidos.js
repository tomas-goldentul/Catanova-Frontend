const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function actualizarEstadoPedido(id, estado) {
  if (!id) throw new Error('No se encontró el identificador del pedido.');
  if (!estado) throw new Error('Seleccioná un estado para el pedido.');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/pedidos/estado/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ estado }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `No se pudo actualizar el estado (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return payload;
}
