const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function obtenerUsuarioPorCuenta(idCuenta, signal) {
  if (!idCuenta) throw new Error('El id_cuenta es obligatorio para consultar el usuario.');

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_URL}/usuarios/by-cuenta/${encodeURIComponent(idCuenta)}`, {
    headers,
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `No se pudo obtener el usuario (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data?.data ?? data;
}
