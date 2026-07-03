const BASE_URL = "http://localhost:3000/etiquetas";

export async function obtenerEtiquetasProducto(id_producto) {
  if (!id_producto) {
    throw new Error("El id_producto es obligatorio");
  }

  const res = await fetch(`${BASE_URL}/producto/${id_producto}`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  
  const data = await res.json();
  return data?.data || [];
}

export async function agregarEtiqueta(nombre, id_producto) {
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre de la etiqueta es obligatorio");
  }

  if (!id_producto) {
    throw new Error("El id_producto es obligatorio");
  }

  console.log("Enviando etiqueta:", { nombre, id_producto });

  const res = await fetch(`${BASE_URL}/agregar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nombre.trim(), id_producto: Number(id_producto) }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { _raw: text };
  }

  if (!res.ok) {
    const mensaje = data?.message || data?._raw || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }

  return data?.data || data;
}

export async function borrarEtiqueta(id) {
  if (!id) {
    throw new Error("El id de la etiqueta es obligatorio");
  }

  console.log("Eliminando etiqueta con ID:", id);

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data?.data || data;
}
