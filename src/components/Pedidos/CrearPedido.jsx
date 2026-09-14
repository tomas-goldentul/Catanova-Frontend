import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX, FiUserPlus } from 'react-icons/fi';
import { crearPedido, obtenerPedido } from '../../api/pedidos';
import { getTodosLosProductos } from '../../api/productos';
import { getUsuariosPorTienda, crearUsuarioParaTienda } from '../../api/usuarios';
import './CrearPedido.css';

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
  const [mostrarAltaUsuario, setMostrarAltaUsuario] = useState(false), [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', apellido: '', telefono: '', direccion: '' });
  const [errorUsuario, setErrorUsuario] = useState('');

  const idTienda = localStorage.getItem('id_tienda');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      idTienda ? getUsuariosPorTienda(idTienda, controller.signal) : Promise.resolve([]),
      getTodosLosProductos(),
    ])
      .then(([usuariosTienda, productosData]) => {
        setUsuarios(Array.isArray(usuariosTienda) ? usuariosTienda : (usuariosTienda?.data ?? usuariosTienda?.usuarios ?? []));
        setProductos(lista(productosData, 'productos'));
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message || 'No se pudieron cargar los datos.'); })
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, [idTienda]);

  const opcionesUsuarios = useMemo(() => usuarios.map((item) => ({ usuario: item, etiqueta: `${nombreUsuario(item) || 'Usuario sin nombre'} · #${id(item)}` })), [usuarios]);
  const seleccionarUsuario = (seleccionado) => {
    setUsuario(seleccionado);
    if (seleccionado) setDireccion(seleccionado.direccion ?? seleccionado.domicilio ?? seleccionado.address ?? '');
  };
  const elegirUsuario = (valor) => {
    setUsuarioTexto(valor);
    const seleccionado = opcionesUsuarios.find((opcion) => opcion.etiqueta === valor)?.usuario ?? null;
    seleccionarUsuario(seleccionado);
  };
  const cambiarNuevoUsuario = (campo, valor) => setNuevoUsuario((actual) => ({ ...actual, [campo]: valor }));
  const guardarNuevoUsuario = async (event) => {
    event.preventDefault();
    if (!idTienda) return setErrorUsuario('No se puede dar de alta un usuario sin una tienda asociada.');
    if (!nuevoUsuario.nombre.trim()) return setErrorUsuario('El nombre es obligatorio.');
    setGuardandoUsuario(true); setErrorUsuario('');
    try {
      const creado = await crearUsuarioParaTienda({ ...nuevoUsuario, id_tienda: idTienda });
      setUsuarios((actuales) => [...actuales, creado]);
      setUsuarioTexto(`${nombreUsuario(creado) || 'Usuario sin nombre'} · #${id(creado)}`);
      seleccionarUsuario(creado);
      setNuevoUsuario({ nombre: '', apellido: '', telefono: '', direccion: '' });
      setMostrarAltaUsuario(false);
    } catch (err) { setErrorUsuario(err.message || 'No se pudo dar de alta el usuario.'); }
    finally { setGuardandoUsuario(false); }
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
    try {
      const creado = await crearPedido({ id_usuario: id(usuario), direccion, metodo_pago: metodoPago, productos: items });
      const pedidoCompleto = await obtenerPedido(creado?.id_pedido);
      onCrear(pedidoCompleto);
    }
    catch (err) { setError(err.message || 'No se pudo crear el pedido.'); }
    finally { setGuardando(false); }
  };
  const cambiarCantidad = (idProducto, valor) => setItems((actuales) => actuales.map((item) => item.id_producto === idProducto ? { ...item, cantidad: Math.max(1, Number(valor) || 1) } : item));

  return <section className="crear-pedido" aria-labelledby="crearPedidoTitulo">
    <div className="crear-pedido-header"><div><span className="crear-pedido-eyebrow">Pedidos</span><h2 id="crearPedidoTitulo">Crear pedido manual</h2><p>Asociá un usuario y productos existentes para registrar la venta.</p></div><button type="button" className="crear-pedido-cerrar" onClick={onCancelar} aria-label="Cerrar formulario"><FiX /></button></div>
    <form className="crear-pedido-contenido" onSubmit={enviar}>
      <fieldset className="crear-pedido-seccion"><legend>Cliente y entrega</legend><div className="crear-pedido-grid">
        <div className="crear-pedido-campo crear-pedido-campo--doble"><label htmlFor="usuarioPedido">Usuario</label><div className="crear-pedido-selector-usuario">
          <input id="usuarioPedido" list="usuariosPedido" value={usuarioTexto} onChange={(e) => elegirUsuario(e.target.value)} placeholder={cargando ? 'Cargando usuarios…' : 'Buscá por nombre'} autoComplete="off" disabled={cargando} />
          <datalist id="usuariosPedido">{opcionesUsuarios.map((o) => <option key={id(o.usuario)} value={o.etiqueta} />)}</datalist>
          <button type="button" className="crear-pedido-nuevo-usuario-btn" onClick={() => { setMostrarAltaUsuario((a) => !a); setErrorUsuario(''); }} aria-label="Dar de alta un nuevo usuario" disabled={cargando}><FiUserPlus />Nuevo usuario</button>
        </div>{!cargando && !usuarios.length && <p className="crear-pedido-sin-usuarios">Esta tienda todavía no tiene usuarios. Dalo de alta con “Nuevo usuario”.</p>}</div>
        <div className="crear-pedido-campo"><label htmlFor="direccionPedido">Dirección</label><input id="direccionPedido" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle y número" /></div>
      </div>
        {mostrarAltaUsuario && <div className="crear-pedido-alta-usuario">
          <div className="crear-pedido-alta-usuario-titulo"><strong>Nuevo usuario de la tienda</strong><span>Se agrega a la lista de clientes de esta tienda sin necesidad de email o contraseña.</span></div>
          <div className="crear-pedido-grid">
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioNombre">Nombre</label><input id="nuevoUsuarioNombre" value={nuevoUsuario.nombre} onChange={(e) => cambiarNuevoUsuario('nombre', e.target.value)} placeholder="Nombre" /></div>
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioApellido">Apellido</label><input id="nuevoUsuarioApellido" value={nuevoUsuario.apellido} onChange={(e) => cambiarNuevoUsuario('apellido', e.target.value)} placeholder="Apellido" /></div>
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioTelefono">Teléfono</label><input id="nuevoUsuarioTelefono" value={nuevoUsuario.telefono} onChange={(e) => cambiarNuevoUsuario('telefono', e.target.value)} placeholder="Teléfono" /></div>
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioDireccion">Dirección</label><input id="nuevoUsuarioDireccion" value={nuevoUsuario.direccion} onChange={(e) => cambiarNuevoUsuario('direccion', e.target.value)} placeholder="Calle y número" /></div>
          </div>
          {errorUsuario && <p className="crear-pedido-error" role="alert">{errorUsuario}</p>}
          <div className="crear-pedido-alta-usuario-acciones">
            <button type="button" className="crear-pedido-btn-alta-secundario" onClick={() => setMostrarAltaUsuario(false)} disabled={guardandoUsuario}>Cancelar</button>
            <button type="button" className="crear-pedido-btn-alta-principal" onClick={guardarNuevoUsuario} disabled={guardandoUsuario}>{guardandoUsuario ? 'Guardando…' : 'Guardar y seleccionar'}</button>
          </div>
        </div>}
      </fieldset>
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