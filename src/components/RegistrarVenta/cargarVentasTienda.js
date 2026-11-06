import { getVentasPorTienda } from '../../api/ventas';
import { getTodosProductosPorTienda } from '../../api/productos';
import { getUsuariosPorTienda } from '../../api/usuarios';

// Trae las ventas de la tienda y descarta las que apuntan a productos/usuarios inexistentes.
// Lo usan tanto la pantalla de Ventas como la de Estadísticas para que muestren los mismos números.
export async function cargarVentasTienda(idTienda) {
  const [ventasData, productosData, usuariosData] = await Promise.all([
    getVentasPorTienda(idTienda).catch(() => []),
    getTodosProductosPorTienda(idTienda).catch(() => []),
    getUsuariosPorTienda(idTienda).catch(() => []),
  ]);

  const idsProductos = new Set(
    (Array.isArray(productosData) ? productosData : [])
      .map((p) => Number(p?.id_producto ?? p?.id ?? 0))
      .filter((id) => id > 0)
  );

  const idsUsuarios = new Set(
    (Array.isArray(usuariosData) ? usuariosData : [])
      .map((u) => Number(u?.id_usuario ?? u?.id ?? 0))
      .filter((id) => id > 0)
  );

  return (Array.isArray(ventasData) ? ventasData : []).filter((venta) => {
    const idProducto = Number(venta?.id_producto ?? venta?.producto_id ?? venta?.productoId ?? 0);
    const idUsuario = Number(venta?.id_usuario ?? venta?.usuario_id ?? venta?.idUsuario ?? 0);
    const mismaTienda = Number(venta?.id_tienda ?? venta?.tienda_id ?? venta?.idTienda ?? 0) === Number(idTienda);
    const productoExiste = idsProductos.has(idProducto);
    const usuarioValido = idUsuario === 0 || idsUsuarios.has(idUsuario);
    return mismaTienda && productoExiste && usuarioValido;
  });
}
