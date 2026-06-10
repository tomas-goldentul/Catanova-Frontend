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

//el futuro agregar crear categoria, editar (elegir que productos poner y sacar) y eliminar
