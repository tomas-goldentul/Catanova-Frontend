const BASE_URL = "http://localhost:3000/vistas";

export async function getVistas() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadVistasUltimos7Dias() {
  const res = await fetch(`${BASE_URL}/ultimos/7dias`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadVistasUltimoMes() {
  const res = await fetch(`${BASE_URL}/ultimos/mes`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadVistasUltimoAno() {
  const res = await fetch(`${BASE_URL}/ultimos/ano`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCantidadVistasUltimos2Anios() {
  const res = await fetch(`${BASE_URL}/ultimos/2anos`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVista(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function insertVista(datosVista) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosVista),
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

export async function deleteVista(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  return data;
}

export async function getCantidadVistasProducto(id) {
  const res = await fetch(`${BASE_URL}/producto/${id}/cantidad`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  
  const data = await res.json();
  return Number(data.cantidad);
}