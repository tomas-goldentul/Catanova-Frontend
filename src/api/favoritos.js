const BASE_URL = "http://localhost:3000/favoritos";

export async function getFavoritos() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadFavoritosUltimos7Dias() {
  const res = await fetch(`${BASE_URL}/ultimos/7dias`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadFavoritosUltimoMes() {
  const res = await fetch(`${BASE_URL}/ultimos/mes`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadFavoritosUltimoAno() {
  const res = await fetch(`${BASE_URL}/ultimos/ano`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadFavoritosUltimos2Anios() {
  const res = await fetch(`${BASE_URL}/ultimos/2anos`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getFavorito(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function insertFavorito(datosFavorito) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosFavorito),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data?.message || data?._raw || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data;
}

export async function deleteFavorito(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  return data;
}

export async function getCantidadFavoritosProducto(id) {
  const res = await fetch(`${BASE_URL}/producto/${id}/cantidad`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}