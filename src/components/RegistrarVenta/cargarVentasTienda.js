import { getVentasPorTienda, normalizarDetallesVenta } from '../../api/ventas';
import { getTodosProductosPorTienda } from '../../api/productos';
import { getUsuariosPorTienda } from '../../api/usuarios';
import { obtenerPedidosPorTienda } from '../../api/pedidos';

// Trae las ventas de la tienda y normaliza sus detalles.
// También incorpora pedidos de la tienda que no tengan una venta vinculada, para que el
// historial/facturación de Ventas refleje lo mismo que la pestaña Pedidos.
export async function cargarVentasTienda(idTienda) {
  const [ventasData, productosData, usuariosData, pedidosData] = await Promise.all([
    getVentasPorTienda(idTienda).catch(() => []),
    getTodosProductosPorTienda(idTienda).catch(() => []),
    getUsuariosPorTienda(idTienda).catch(() => []),
    obtenerPedidosPorTienda(idTienda).catch(() => []),
  ]);

  const productosPorId = new Map(
    (Array.isArray(productosData) ? productosData : [])
      .map((p) => [Number(p?.id_producto ?? p?.id ?? 0), p])
      .filter(([id]) => id > 0)
  );

  const usuariosPorId = new Map(
    (Array.isArray(usuariosData) ? usuariosData : [])
      .map((u) => [Number(u?.id_usuario ?? u?.id ?? 0), u])
      .filter(([id]) => id > 0)
  );

  const ventasNormalizadas = (Array.isArray(ventasData) ? ventasData : [])
    .filter((venta) => Number(venta?.id_tienda ?? venta?.tienda_id ?? venta?.idTienda ?? 0) === Number(idTienda))
    .map((venta) => {
      const detallesRaw = normalizarDetallesVenta(venta);
      const detalles = detallesRaw.map((d) => {
        const prod = productosPorId.get(Number(d.id_producto));
        return {
          ...d,
          nombre_producto: d.nombre_producto || prod?.nombre || `Producto #${d.id_producto || '?'}`,
        };
      });
      const total = Number(venta?.total) || detalles.reduce((acc, d) => acc + Number(d.subtotal || 0), 0);

      const idUsuario = Number(venta?.id_usuario ?? venta?.usuario_id ?? venta?.idUsuario ?? 0);
      const usuario = usuariosPorId.get(idUsuario);
      const nombreCliente = venta?.nombre_cliente
        || (usuario ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim() : null);

      return {
        ...venta,
        ...(nombreCliente ? { nombre_cliente: nombreCliente } : {}),
        detalles,
        total,
      };
    });

  const idsPedidosConVenta = new Set(
    ventasNormalizadas
      .map((v) => Number(v?.id_pedido ?? v?.pedido?.id_pedido ?? 0))
      .filter((id) => id > 0)
  );

  const ventasDesdePedidos = (Array.isArray(pedidosData) ? pedidosData : [])
    .filter((p) => !idsPedidosConVenta.has(Number(p?.id_pedido ?? p?.id ?? 0)))
    .map((p) => {
      const detallesPedido = (Array.isArray(p?.detalles) ? p.detalles : [])
        .filter((d) => Number(d?.id_tienda ?? d?.id_tienda_producto ?? idTienda) === Number(idTienda))
        .map((d) => {
          const idProducto = Number(d?.id_producto ?? 0);
          const cantidad = Number(d?.cantidad ?? 0);
          const precioUnitario = Number(d?.precio_unitario ?? d?.precio ?? (cantidad ? Number(d?.precio_total ?? 0) / cantidad : 0));
          const subtotal = Number(d?.precio_total ?? d?.subtotal ?? cantidad * precioUnitario);
          const prod = productosPorId.get(idProducto);
          return {
            id_producto: idProducto,
            cantidad,
            precio_unitario: precioUnitario,
            subtotal,
            nombre_producto: d?.nombre_producto ?? prod?.nombre ?? `Producto #${idProducto || '?'}`,
          };
        });
      const total = detallesPedido.reduce((acc, d) => acc + Number(d.subtotal || 0), 0);
      const nombreCliente = [p?.nombre_usuario, p?.apellido_usuario].filter(Boolean).join(' ').trim()
        || p?.clienteNombre || null;
      return {
        id_venta: p?.id_venta ?? null,
        id_pedido: Number(p?.id_pedido ?? p?.id ?? 0) || null,
        id_tienda: Number(idTienda),
        id_usuario: p?.id_usuario ?? null,
        ...(nombreCliente ? { nombre_cliente: nombreCliente } : {}),
        fecha: p?.fecha || null,
        metodo_pago: p?.metodo_pago || null,
        total,
        detalles: detallesPedido,
        _origen: 'pedido',
      };
    })
    .filter((v) => v.detalles.length > 0);

  return [...ventasNormalizadas, ...ventasDesdePedidos]
    .sort((a, b) => new Date(b?.fecha || 0) - new Date(a?.fecha || 0));
}
