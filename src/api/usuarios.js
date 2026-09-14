const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obtenerHeaders() {
  const token = localStorage.getItem('token');
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function obtenerUsuarioPorCuenta(idCuenta, signal) {
  if (!idCuenta) throw new Error('El id_cuenta es obligatorio para consultar el usuario.');

  const response = await fetch(`${API_URL}/usuarios/by-cuenta/${encodeURIComponent(idCuenta)}`, {
    headers: obtenerHeaders(),
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

export async function getUsuariosPorTienda(idTienda, signal) {
  if (!idTienda) throw new Error('El id_tienda es obligatorio para listar sus usuarios.');

  const response = await fetch(`${API_URL}/usuariosxtiendas/por-tienda/${encodeURIComponent(idTienda)}`, {
    headers: obtenerHeaders(),
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `No se pudieron obtener los usuarios (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return Array.isArray(data) ? data : (data?.data ?? data?.usuarios ?? []);
}

export async function crearUsuarioParaTienda({ nombre, apellido, telefono, direccion, id_tienda }) {
  const response = await fetch(`${API_URL}/usuarios/para-tienda`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify({ nombre, apellido, telefono, direccion, id_tienda }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `No se pudo crear el usuario (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data?.data ?? data;
}