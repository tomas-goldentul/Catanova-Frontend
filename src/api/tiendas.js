const BASE_URL = "http://localhost:3000/tiendas";

export async function getNombre(id) {
  const res = await fetch(`${BASE_URL}/get/nombre/${id}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  // Tu backend devuelve { message, data: { nombre } }. Retornamos data directo.
  return json.data; 
}

export async function getSlogan(id) {
  const res = await fetch(`${BASE_URL}/get/slogan/${id}`);
  
  if(!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  
  const json = await res.json();
  // Tu backend devuelve { message, data: { slogan } }. Retornamos data directo.
  return json.data;
}

export async function getTodasLasTiendas() {

    const res = await fetch(`${BASE_URL}/get/all`);

    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    return json.data;
}

export async function abrirTienda(id) {
  const res = await fetch(`${BASE_URL}/abrir/${id}`, {
    method: "PUT",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();

  return json.data;
}


export async function cerrarTienda(id) {
  const res = await fetch(`${BASE_URL}/cerrar/${id}`, {
    method: "PUT",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();

  return json.data;
}

export async function actualizarTienda(id, datos) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Error ${res.status}`);
  }

  return json.data;
}

export async function getTiendaPorId(id) {
  const res = await fetch(`${BASE_URL}/get/${id}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();

  return json.data;
}