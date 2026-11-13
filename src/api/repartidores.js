const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obtenerHeaders() {
  const token = localStorage.getItem('token');
  const headers = { Accept: 'application/json' };
  console.log("Token:", localStorage.getItem("token"));
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.repartidores)) return data.repartidores;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizarNombre(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function fetchJson(url, options = {}, mensaje) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `${mensaje} (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function obtenerRepartidores(signal) {
  const response = await fetchJson(`${API_URL}/repartidores`, { headers: obtenerHeaders(), signal }, 'No se pudieron obtener los repartidores');
  return normalizarLista(response);
}

export async function buscarRepartidores({ q = '', id_tienda, limit = 12 } = {}, signal) {
  const busqueda = String(q ?? '').trim();
  const params = new URLSearchParams();
  if (busqueda) params.set('q', busqueda);
  if (id_tienda) params.set('id_tienda', String(id_tienda));
  if (limit) params.set('limit', String(limit));

  const urls = [
    `${API_URL}/repartidores?${params.toString()}`,
    `${API_URL}/repartidores/search?${params.toString()}`,
    id_tienda ? `${API_URL}/repartidores/por-tienda/${encodeURIComponent(id_tienda)}?${params.toString()}` : '',
  ].filter(Boolean);

  let ultimoError = null;
  for (const url of urls) {
    try {
      const data = await fetchJson(url, { headers: obtenerHeaders(), signal }, 'No se pudieron buscar repartidores');
      const lista = normalizarLista(data);
      if (lista.length > 0) return lista;
      return lista;
    } catch (error) {
      if (error?.status === 404 || error?.status === 405) {
        ultimoError = error;
        continue;
      }
      throw error;
    }
  }

  if (ultimoError) return [];
  return [];
}

export async function crearRepartidor(datos = {}, signal) {
  const nombre = String(datos.nombre ?? '').trim();
  const idTienda = datos.id_tienda ?? datos.idTienda ?? localStorage.getItem('id_tienda');

  if (!nombre) {
    throw new Error('El nombre del repartidor es obligatorio.');
  }

  const payload = {
    nombre,
    ...(datos.telefono ? { telefono: String(datos.telefono) } : {}),
    ...(datos.apellido ? { apellido: String(datos.apellido) } : {}),
    ...(idTienda ? { id_tienda: Number(idTienda) } : {}),
  };

  const response = await fetchJson(`${API_URL}/repartidores`, {
    method: 'POST',
    headers: { ...obtenerHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  }, 'No se pudo guardar el repartidor');

  const lista = normalizarLista(response);
  if (lista.length) {
    return lista[0];
  }

  return response?.data ?? response;
}

export { normalizarNombre };
