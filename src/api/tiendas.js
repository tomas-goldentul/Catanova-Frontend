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