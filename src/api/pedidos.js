const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function normalizarPedidoCompatible(pedido) {
  if (!pedido || typeof pedido !== 'object') return pedido;

  const usuario = pedido.usuario || pedido.cliente || pedido.comprador || {};
  const nombreUsuario =
    usuario.nombre ||
    usuario.name ||
    (usuario.nombre && usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : '') ||
    pedido.clienteNombre ||
    pedido.compradorNombre ||
    '';

  const apellidoUsuario = usuario.apellido || usuario.lastName || usuario.lastname || '';
  const nombreCompleto = [usuario.nombre || usuario.name, apellidoUsuario].filter(Boolean).join(' ').trim() || nombreUsuario;
  const telefonoUsuario = usuario.telefono || usuario.phone || usuario.whatsapp || pedido.clienteTelefono || pedido.telefono || '';

  return {
    ...pedido,
    usuario: {
      ...usuario,
      id_usuario: usuario.id_usuario ?? usuario.idUsuario ?? usuario.id ?? pedido.id_usuario ?? pedido.usuarioId ?? null,
      nombre: usuario.nombre || usuario.name || nombreCompleto || '',
      apellido: apellidoUsuario,
      telefono: telefonoUsuario,
    },
    cliente: {
      ...(pedido.cliente || {}),
      id: pedido.cliente?.id ?? pedido.clienteId ?? pedido.id_cliente ?? pedido.id_usuario ?? usuario.id ?? null,
      nombre: nombreCompleto || pedido.clienteNombre || pedido.compradorNombre || '',
      telefono: telefonoUsuario,
      email: pedido.cliente?.email || usuario.email || pedido.email || '',
    },
    clienteNombre: nombreCompleto || pedido.clienteNombre || pedido.compradorNombre || '',
    clienteTelefono: telefonoUsuario || pedido.clienteTelefono || '',
    id_usuario: pedido.id_usuario ?? pedido.usuarioId ?? usuario.id_usuario ?? usuario.idUsuario ?? pedido.cliente?.id ?? null,
  };
}

function normalizarProductosPedido(productos) {
  if (!Array.isArray(productos)) return [];

  return productos
    .map((item) => {
      const idProducto = Number(
        item?.id_producto ??
        item?.idProducto ??
        item?.producto_id ??
        item?.productoId ??
        item?.id ??
        0,
      );

      const cantidad = Number(item?.cantidad ?? item?.qty ?? item?.cantidadProducto ?? 1);

      if (!Number.isFinite(idProducto) || idProducto <= 0 || !Number.isFinite(cantidad) || cantidad <= 0) {
        return null;
      }

      return {
        id_producto: idProducto,
        cantidad,
      };
    })
    .filter(Boolean);
}

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

  const payload = {
    ...(datosActualizados.direccion && { direccion: datosActualizados.direccion }),
    ...(datosActualizados.localidad && { localidad: datosActualizados.localidad }),
    ...(datosActualizados.codigoPostal && { codigoPostal: datosActualizados.codigoPostal }),
    ...(datosActualizados.metodoPago && { metodoPago: datosActualizados.metodoPago }),
    ...(datosActualizados.pago && { pago: datosActualizados.pago }),
    ...(datosActualizados.estado && { estado: datosActualizados.estado }),
    ...(datosActualizados.productos && { productos: datosActualizados.productos }),
    ...(datosActualizados.eta && { eta: datosActualizados.eta }),
    ...(datosActualizados.prioridad && { prioridad: datosActualizados.prioridad }),
    ...(datosActualizados.id_usuario != null && { id_usuario: Number(datosActualizados.id_usuario) }),
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

  return result?.success === true && result.data != null ? normalizarPedidoCompatible(result.data) : normalizarPedidoCompatible(result);
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

  const pedido = payload?.success === true && payload.data != null ? payload.data : payload;
  return normalizarPedidoCompatible(pedido);
}

export async function crearPedido(datosPedido) {
  const payload = datosPedido || {};

  const idUsuario = Number(payload.id_usuario ?? payload.idUsuario ?? payload.usuarioId ?? payload.userId ?? 0);
  const direccion = payload.direccion ?? payload.direccionEntrega ?? payload.direccion_envio ?? '';
  const metodoPago = payload.metodo_pago ?? payload.metodoPago ?? 'efectivo';
  const productos = normalizarProductosPedido(payload.productos ?? payload.items ?? payload.carrito ?? []);

  if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
    throw new Error('Falta el id_usuario para crear el pedido.');
  }

  if (!direccion || !String(direccion).trim()) {
    throw new Error('La dirección es obligatoria para crear el pedido.');
  }

  if (!productos.length) {
    throw new Error('Debes incluir al menos un producto en el pedido.');
  }

  const body = {
    id_usuario: idUsuario,
    direccion: String(direccion).trim(),
    metodo_pago: String(metodoPago).trim().toLowerCase(),
    productos,
  };

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || result.error || `No se pudo crear el pedido (Error ${response.status}).`);
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result?.data ?? result;
}
