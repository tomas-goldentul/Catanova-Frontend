const BASE_URL = "http://localhost:3000/productos";

export async function getProductosActivos() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getTodosLosProductos() {
  const res = await fetch(`${BASE_URL}/get`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getProductoPorId(id) {
  const data = await getTodosLosProductos(); 
  const lista = Array.isArray(data)
    ? data
    : data?.productos ?? [];

  const producto = lista.find(
    (item) => item.id_producto === id || item.id === id || String(item.id_producto) === String(id) || String(item.id) === String(id)
  );

  if (!producto) {
    throw new Error('Producto no encontrado');
  }

  return producto;
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
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosProducto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

export async function borrarProducto(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "PUT",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function getProductosPorCategoria(idCat) {
  const res = await fetch(`${BASE_URL}/get/categoria/${idCat}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function agregarStock(id, cantidad) {
  if (!cantidad || cantidad <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  console.log("Agregando stock:", { id, cantidad });

  const res = await fetch(`${BASE_URL}/agregar-stock/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cantidad: Number(cantidad) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function editarStock(id, cantidad) {
  if (cantidad === undefined || cantidad < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }

  console.log("Editando stock:", { id, cantidad });

  const res = await fetch(`${BASE_URL}/editar-stock/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cantidad: Number(cantidad) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function editarNombre(id, nombre) {
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre es obligatorio");
  }

  console.log("Editando nombre:", { id, nombre });

  const res = await fetch(`${BASE_URL}/editar-nombre/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nombre.trim() }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function editarTipo(id, tipo) {
  if (!tipo || !tipo.trim()) {
    throw new Error("El tipo es obligatorio");
  }

  console.log("Editando tipo:", { id, tipo });

  const res = await fetch(`${BASE_URL}/editar-tipo/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo: tipo.trim() }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export async function cambiarImagen(id, imagen) {
  if (!imagen || !imagen.trim()) {
    throw new Error("La URL de imagen es obligatoria");
  }

  console.log("Cambiando imagen:", { id, imagen });

  const res = await fetch(`${BASE_URL}/cambiar-imagen/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagen: imagen.trim() }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}
