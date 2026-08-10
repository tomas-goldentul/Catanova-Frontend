const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function actualizarEstadoPedido(id, entregado) {
  if (!id || id === 'Sin ID') {
    throw new Error('No se pudo identificar el pedido. El ID está ausente o inválido.');
  }
  if (typeof entregado !== 'boolean') {
    throw new Error("El campo 'entregado' es obligatorio y debe ser un booleano (true/false).");
  }

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // El backend solo maneja el booleano "entregado", no una lista de estados intermedios.
  // No se puede revertir entregado: true -> false (responde 400).
  const response = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ entregado }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `No se pudo actualizar el estado (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function editarPedido(id, datosActualizados) {
  if (!id || id === 'Sin ID') {
    throw new Error('No se pudo identificar el pedido. El ID está ausente o inválido. Verifica que el pedido tenga id_pedido.');
  }
  
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Preparar el payload según lo esperado por el backend
  const payload = {
    // Campos de entrega
    ...(datosActualizados.direccion && { direccion: datosActualizados.direccion }),
    ...(datosActualizados.localidad && { localidad: datosActualizados.localidad }),
    ...(datosActualizados.codigoPostal && { codigoPostal: datosActualizados.codigoPostal }),
    
    // Método de pago
    ...(datosActualizados.metodoPago && { metodoPago: datosActualizados.metodoPago }),
    ...(datosActualizados.pago && { pago: datosActualizados.pago }),
    
    // Estado
    ...(datosActualizados.estado && { estado: datosActualizados.estado }),
    
    // Productos
    ...(datosActualizados.productos && { productos: datosActualizados.productos }),
    
    // Otros campos opcionales
    ...(datosActualizados.eta && { eta: datosActualizados.eta }),
    ...(datosActualizados.prioridad && { prioridad: datosActualizados.prioridad }),
  };

  const response = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const error = new Error(
      result.message || 
      result.error || 
      result.details ||
      `No se pudo actualizar el pedido (Error ${response.status}).`
    );
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result?.success === true && result.data != null ? result.data : result;
}

export async function obtenerPedido(id) {
  if (!id || id === 'Sin ID') {
    throw new Error('No se pudo identificar el pedido. El ID está ausente o inválido. Verifica que el pedido tenga id_pedido.');
  }

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/pedidos/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `No se pudo obtener el pedido (Error ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return payload?.success === true && payload.data != null ? payload.data : payload;
}
