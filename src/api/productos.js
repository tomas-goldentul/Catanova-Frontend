const BASE_URL = "http://localhost:3000/productos";

export async function getProductosActivos() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getTodosLosProductos() {
  const res = await fetch(`${BASE_URL}/all`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function insertProducto(datosProducto) {
  
  console.log("Enviando producto:", datosProducto);

  const res = await fetch(`${BASE_URL}/insert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosProducto),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    // respuesta no-JSON, dejamos el texto crudo en data._raw
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data?.message || data?._raw || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data;
}

export async function updateEstadoProducto(id, estado) {
  const res = await fetch(`${BASE_URL}/estado/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: Boolean(estado) }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  return data;
}

export async function actualizarProducto(id, datosProducto) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosProducto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}
