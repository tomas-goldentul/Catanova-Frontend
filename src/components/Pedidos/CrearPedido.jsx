import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { crearPedido } from '../../api/pedidos';
import { getTodosLosProductos } from '../../api/productos';
import './CrearPedido.css';

const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];
const lista = (data, key) => Array.isArray(data) ? data : (data?.[key] ?? data?.data ?? []);
const id = (value) => value?.id_usuario ?? value?.id_producto ?? value?.id;
const nombreUsuario = (u) => [u?.nombre ?? u?.name, u?.apellido ?? u?.lastName].filter(Boolean).join(' ').trim();
const nombreProducto = (p) => p?.nombre ?? p?.name ?? p?.descripcion ?? 'Producto sin nombre';
const precioProducto = (p) => Number(p?.precio ?? p?.precio_unitario ?? p?.precioUnitario ?? 0);

function CrearPedido({ onCrear, onCancelar }) {
  const [usuarios, setUsuarios] = useState([]), [productos, setProductos] = useState([]);
  const [usuarioTexto, setUsuarioTexto] = useState(''), [usuario, setUsuario] = useState(null);
  const [productoId, setProductoId] = useState(''), [cantidad, setCantidad] = useState(1), [items, setItems] = useState([]);
  const [direccion, setDireccion] = useState(''), [metodoPago, setMetodoPago] = useState('efectivo');
  const [cargando, setCargando] = useState(true), [guardando, setGuardando] = useState(false), [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const headers = { Accept: 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    Promise.all([fetch(`${API_URL}/usuarios`, { headers, signal: controller.signal }), getTodosLosProductos()])
      .then(async ([usuariosRes, productosData]) => {
        if (!usuariosRes.ok) throw new Error('No se pudo cargar el selector de usuarios.');
        setUsuarios(lista(await usuariosRes.json(), 'usuarios'));
        setProductos(lista(productosData, 'productos'));
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message || 'No se pudieron cargar los datos.'); })
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, []);

  const opcionesUsuarios = useMemo(() => usuarios.map((item) => ({ usuario: item, etiqueta: `${nombreUsuario(item) || 'Usuario sin nombre'} · #${id(item)}` })), [usuarios]);
  const elegirUsuario = (valor) => {
    setUsuarioTexto(valor);
    const seleccionado = opcionesUsuarios.find((opcion) => opcion.etiqueta === valor)?.usuario ?? null;
    setUsuario(seleccionado);
    if (seleccionado) setDireccion(seleccionado.direccion ?? seleccionado.domicilio ?? seleccionado.address ?? '');
  };
  const agregarProducto = () => {
    const producto = productos.find((item) => String(id(item)) === String(productoId));
    const unidades = Number(cantidad);
    if (!producto || !Number.isInteger(unidades) || unidades < 1) return setError('Seleccioná un producto y una cantidad válida.');
    const nuevo = { id_producto: id(producto), nombre: nombreProducto(producto), precio: precioProducto(producto), cantidad: unidades };
    setItems((actuales) => {
      const existe = actuales.find((item) => String(item.id_producto) === String(nuevo.id_producto));
      return existe ? actuales.map((item) => item.id_producto === nuevo.id_producto ? { ...item, cantidad: item.cantidad + unidades } : item) : [...actuales, nuevo];
    });
    setCantidad(1); setError('');
  };
  const total = items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  const enviar = async (event) => {
    event.preventDefault();
    if (!usuario || !direccion.trim() || !items.length) return setError('Seleccioná un usuario, indicá una dirección y agregá al menos un producto.');
    setGuardando(true); setError('');
    try { onCrear(await crearPedido({ id_usuario: id(usuario), direccion, metodo_pago: metodoPago, productos: items })); }
    catch (err) { setError(err.message || 'No se pudo crear el pedido.'); }
    finally { setGuardando(false); }
  };
  const cambiarCantidad = (idProducto, valor) => setItems((actuales) => actuales.map((item) => item.id_producto === idProducto ? { ...item, cantidad: Math.max(1, Number(valor) || 1) } : item));

  return <section className="crear-pedido" aria-labelledby="crearPedidoTitulo">
    <div className="crear-pedido-header"><div><span className="crear-pedido-eyebrow">Pedidos</span><h2 id="crearPedidoTitulo">Crear pedido manual</h2><p>Asociá un usuario y productos existentes para registrar la venta.</p></div><button type="button" className="crear-pedido-cerrar" onClick={onCancelar} aria-label="Cerrar formulario"><FiX /></button></div>
    <form className="crear-pedido-contenido" onSubmit={enviar}>
      <fieldset className="crear-pedido-seccion"><legend>Cliente y entrega</legend><div className="crear-pedido-grid">
        <div className="crear-pedido-campo"><label htmlFor="usuarioPedido">Usuario</label><input id="usuarioPedido" list="usuariosPedido" value={usuarioTexto} onChange={(e) => elegirUsuario(e.target.value)} placeholder="Buscá por nombre" autoComplete="off" disabled={cargando} /><datalist id="usuariosPedido">{opcionesUsuarios.map((o) => <option key={id(o.usuario)} value={o.etiqueta} />)}</datalist></div>
        <div className="crear-pedido-campo"><label htmlFor="direccionPedido">Dirección</label><input id="direccionPedido" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle y número" /></div>
      </div></fieldset>
      <fieldset className="crear-pedido-seccion"><legend>Productos</legend><div className="crear-pedido-selector-producto">
        <div className="crear-pedido-campo crear-pedido-campo--doble"><label htmlFor="productoPedido">Producto</label><select id="productoPedido" value={productoId} onChange={(e) => setProductoId(e.target.value)} disabled={cargando}><option value="">Seleccioná un producto</option>{productos.map((producto) => <option key={id(producto)} value={id(producto)}>{nombreProducto(producto)} · {formatearPrecio(precioProducto(producto))}</option>)}</select></div>
        <div className="crear-pedido-campo crear-pedido-campo--cantidad"><label htmlFor="cantidadPedido">Cantidad</label><input id="cantidadPedido" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></div><button type="button" className="crear-pedido-agregar-btn" onClick={agregarProducto} disabled={cargando}><FiPlus />Agregar</button>
      </div><div className="crear-pedido-tabla-wrap"><table className="crear-pedido-tabla"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th aria-label="Quitar" /></tr></thead><tbody>{!items.length && <tr><td colSpan="5" className="crear-pedido-tabla-vacia">Todavía no agregaste productos.</td></tr>}{items.map((item) => <tr key={item.id_producto}><td>{item.nombre}</td><td><input type="number" min="1" value={item.cantidad} onChange={(e) => cambiarCantidad(item.id_producto, e.target.value)} /></td><td>{formatearPrecio(item.precio)}</td><td>{formatearPrecio(item.precio * item.cantidad)}</td><td><button type="button" className="crear-pedido-quitar-item" onClick={() => setItems((actuales) => actuales.filter((actual) => actual.id_producto !== item.id_producto))} aria-label={`Quitar ${item.nombre}`}><FiTrash2 /></button></td></tr>)}</tbody></table></div><div className="crear-pedido-total"><span>Total del pedido</span><strong>{formatearPrecio(total)}</strong></div></fieldset>
      <fieldset className="crear-pedido-seccion"><legend>Pago</legend><div className="crear-pedido-campo"><label htmlFor="metodoPagoPedido">Método de pago</label><select id="metodoPagoPedido" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>{METODOS_PAGO.map((metodo) => <option key={metodo} value={metodo}>{metodo[0].toUpperCase() + metodo.slice(1)}</option>)}</select></div></fieldset>
      {error && <p className="crear-pedido-error" role="alert">{error}</p>}<div className="crear-pedido-acciones"><button type="button" className="crear-pedido-btn-secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button><button type="submit" className="crear-pedido-btn-principal" disabled={guardando || cargando}>{guardando ? 'Creando…' : 'Crear pedido'}</button></div>
    </form>
  </section>;
}

function formatearPrecio(valor) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(valor || 0); }
export default CrearPedido;
