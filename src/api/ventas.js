const BASE_URL = "http://localhost:3000/ventas";

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem("token");
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
};

async function leerRespuesta(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }
  if (!res.ok) {
    const mensaje = data?.message || data?.error || data?._raw || `Error ${res.status}: ${res.statusText}`;
    throw new Error(mensaje);
  }
  return data;
}

export async function getVentas() {
  const res = await fetch(`${BASE_URL}/`, { headers: authHeaders() });
  return leerRespuesta(res);
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
  const res = await fetch(`${BASE_URL}/${id}`, { headers: authHeaders() });
  return leerRespuesta(res);
}

export async function insertVenta(datosVenta) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(datosVenta),
  });
  return leerRespuesta(res);
}

export async function updateVenta(datosVenta) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(datosVenta),
  });
  return leerRespuesta(res);
}

export async function deleteVenta(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return leerRespuesta(res);
}

export async function getCantidadVentasProducto(id) {
  const res = await fetch(`${BASE_URL}/producto/${id}/cantidad`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

  const data = await res.json();
  return Number(data.cantidad);
}

export async function getVentasPorTienda(idTienda) {
  const res = await fetch(`${BASE_URL}/tienda/${idTienda}`, { headers: authHeaders() });
  return leerRespuesta(res);
}

export async function registrarVentaManual(datosVenta) {
  const res = await fetch(`${BASE_URL}/manual`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(datosVenta),
  });
  return leerRespuesta(res);
}

export async function crearPedidoDesdeVenta(idVenta, datos = {}) {
  const res = await fetch(`${BASE_URL}/${idVenta}/pedido`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(datos),
  });
  return leerRespuesta(res);
}

export function normalizarDetallesVenta(venta) {
  const items = Array.isArray(venta?.detalles) && venta.detalles.length > 0
    ? venta.detalles
    : (Array.isArray(venta?.productos) && venta.productos.length > 0 ? venta.productos : []);

  if (items.length > 0) {
    return items.map((d) => ({
      ...d,
      id_producto: Number(d?.id_producto ?? d?.producto_id ?? d?.idProducto ?? 0),
      cantidad: Number(d?.cantidad ?? 0),
      precio_unitario: Number(d?.precio_unitario ?? d?.precioUnitario ?? d?.precio ?? 0),
      subtotal: Number(d?.subtotal ?? Number(d?.cantidad ?? 0) * Number(d?.precio_unitario ?? d?.precio ?? 0)),
      nombre_producto: d?.nombre_producto ?? d?.producto?.nombre ?? d?.nombre ?? '',
    }));
  }

  const idProducto = Number(venta?.id_producto ?? venta?.producto_id ?? venta?.productoId ?? 0);
  const cantidad = Number(venta?.cantidad ?? 0);
  const precioUnitario = Number(venta?.precio_unitario ?? venta?.precioUnitario ?? 0);
  if (idProducto || cantidad || precioUnitario) {
    return [{
      id_producto: idProducto,
      cantidad,
      precio_unitario: precioUnitario,
      subtotal: Number(venta?.total ?? cantidad * precioUnitario),
      nombre_producto: venta?.nombre_producto ?? '',
    }];
  }

  return [];
}

export function calcularTotalVenta(venta) {
  const total = Number(venta?.total);
  if (Number.isFinite(total) && total > 0) return total;
  const detalles = normalizarDetallesVenta(venta);
  return detalles.reduce((acc, d) => acc + Number(d.subtotal ?? (d.cantidad * d.precio_unitario) ?? 0), 0);
}