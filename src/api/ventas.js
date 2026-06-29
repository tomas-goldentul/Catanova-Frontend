const BASE_URL = "http://localhost:3000/ventas";

export async function getVentas() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVentasUltimos7Dias() {
  const res = await fetch(`${BASE_URL}/ultimos/7dias`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVentasUltimoMes() {
  const res = await fetch(`${BASE_URL}/ultimos/mes`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVentasUltimoAno() {
  const res = await fetch(`${BASE_URL}/ultimos/ano`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVentasUltimos2Anios() {
  const res = await fetch(`${BASE_URL}/ultimos/2anos`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getVenta(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function insertVenta(datosVenta) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosVenta),
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

export async function updateVenta(datosVenta) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosVenta),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  return data;
}

export async function deleteVenta(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
  return data;
}
