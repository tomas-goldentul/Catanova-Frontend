const BASE_URL = "http://localhost:3000/categorias";

export async function getCategorias() {
  const res = await fetch(`${BASE_URL}/`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function getCategoriaPorId(id) {
  const res = await fetch(`${BASE_URL}/${id}`);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function getProductosDeCategoria(id) {
  const res = await fetch(`${BASE_URL}/${id}/productos`);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}
//trae los productos de una categoría

export async function getCategoriasPorTienda(id) {
  const res = await fetch(`${BASE_URL}/tienda/${id}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function crearCategoria({ nombre, id_tienda, productos = [] }) {
  const res = await fetch(`${BASE_URL}/insert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, id_tienda, productos }),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data.error || data.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data;
}

export async function editarCategoria(id, { nombre, productos = [] }) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, productos }),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data.error || data.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data;
}

export async function eliminarCategoria(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data.error || data.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data;
}