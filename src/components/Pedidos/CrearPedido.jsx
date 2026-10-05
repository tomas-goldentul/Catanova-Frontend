import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX, FiUserPlus } from 'react-icons/fi';
import { crearPedido, obtenerPedido } from '../../api/pedidos';
import { getProductosPorTienda } from '../../api/productos';
import { getUsuariosPorTienda, crearUsuarioParaTienda } from '../../api/usuarios';
import CampoDireccion from './CampoDireccion';
import './CrearPedido.css';

// Mismas etiquetas que ya tienen guardadas los pedidos existentes (el back las guarda tal cual).
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Débito', 'Mercado Pago'];
const NUEVO_USUARIO_VACIO = { nombre: '', apellido: '', telefono: '' };

const nombreUsuario = (u) => [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim() || 'Usuario sin nombre';
const etiquetaUsuario = (u) => (u?.telefono ? `${nombreUsuario(u)} · ${u.telefono}` : nombreUsuario(u));
const listaDe = (data, key) => (Array.isArray(data) ? data : (data?.[key] ?? data?.data ?? []));

// El back devuelve errores crudos de Postgres en varios casos; se traducen para el vendedor.
function mensajeAmigable(err, porDefecto) {
  const mensaje = err?.message || '';
  if (/pedidos_id_usuario_fkey|usuarios_pkey/i.test(mensaje)) return 'El usuario seleccionado ya no existe. Actualizá la lista de usuarios.';
  if (/fk_uxt_tienda/i.test(mensaje)) return 'La tienda no existe. Volvé a iniciar sesión.';
  if (/too long for type character varying\((\d+)\)/i.test(mensaje)) return `Algún dato supera el máximo de ${mensaje.match(/\((\d+)\)/)[1]} caracteres.`;
  if (/invalid input syntax/i.test(mensaje)) return 'Alguno de los datos enviados tiene un formato inválido.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(mensaje)) return 'No se pudo conectar con el servidor. Probá de nuevo en unos segundos.';
  return mensaje || porDefecto;
}

function CrearPedido({ onCrear, onCancelar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [direccion, setDireccion] = useState('');
  const [direccionValida, setDireccionValida] = useState(false);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem('id_tienda')));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarAltaUsuario, setMostrarAltaUsuario] = useState(false);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(NUEVO_USUARIO_VACIO);
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevaDireccionValida, setNuevaDireccionValida] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState('');

  const idTienda = localStorage.getItem('id_tienda');
  const errorMostrado = error || (idTienda ? '' : 'Iniciá sesión con una cuenta de tienda para crear pedidos.');

  useEffect(() => {
    if (!idTienda) return undefined;

    const controller = new AbortController();
    Promise.all([getUsuariosPorTienda(idTienda, controller.signal), getProductosPorTienda(idTienda)])
      .then(([usuariosTienda, productosTienda]) => {
        setUsuarios(listaDe(usuariosTienda, 'usuarios'));
        setProductos(listaDe(productosTienda, 'productos')
          .map((p) => ({ ...p, precio: Number(p.precio) || 0, stock: Number(p.stock) || 0 }))
          .filter((p) => p.activo !== false && p.stock > 0));
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(mensajeAmigable(err, 'No se pudieron cargar los datos.')); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [idTienda]);

  const usuarioSeleccionado = useMemo(() => usuarios.find((u) => String(u.id_usuario) === String(usuarioId)) ?? null, [usuarios, usuarioId]);
  const productoSeleccionado = useMemo(() => productos.find((p) => String(p.id_producto) === String(productoId)) ?? null, [productos, productoId]);
  const total = items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  const enCarrito = (idProducto) => items.find((item) => item.id_producto === idProducto)?.cantidad ?? 0;

  const cambiarDireccion = (texto, valida) => { setDireccion(texto); setDireccionValida(valida); };
  const cambiarNuevaDireccion = (texto, valida) => { setNuevaDireccion(texto); setNuevaDireccionValida(valida); };

  const seleccionarUsuario = (id) => {
    setUsuarioId(id);
    const elegido = usuarios.find((u) => String(u.id_usuario) === String(id));
    const guardada = (elegido?.direccion ?? '').trim();
    // Si la dirección es la misma que ya estaba validada, no hace falta validarla de nuevo.
    if (guardada !== direccion) cambiarDireccion(guardada, false);
    setError('');
  };

  const cambiarNuevoUsuario = (campo, valor) => {
    const limpio = campo === 'telefono' ? valor.replace(/[^\d\s+()-]/g, '') : valor;
    setNuevoUsuario((actual) => ({ ...actual, [campo]: limpio }));
  };

  const guardarNuevoUsuario = async (event) => {
    event.preventDefault();
    const nombre = nuevoUsuario.nombre.trim();
    const apellido = nuevoUsuario.apellido.trim();
    const direccionNueva = nuevaDireccion.trim();

    if (!idTienda) return setErrorUsuario('No se puede dar de alta un usuario sin una tienda asociada.');
    if (!nombre || !apellido) return setErrorUsuario('El nombre y el apellido son obligatorios.');
    if (direccionNueva && !nuevaDireccionValida) return setErrorUsuario('Elegí una dirección sugerida o dejá el campo vacío.');

    setGuardandoUsuario(true);
    setErrorUsuario('');
    try {
      const creado = await crearUsuarioParaTienda({
        nombre,
        apellido,
        telefono: nuevoUsuario.telefono.trim(),
        direccion: direccionNueva,
        id_tienda: Number(idTienda),
      });
      if (!creado?.id_usuario) throw new Error('El servidor no devolvió el usuario creado. Actualizá la lista e intentá de nuevo.');

      setUsuarios((actuales) => [...actuales, creado]);
      setUsuarioId(String(creado.id_usuario));
      // La dirección ya fue validada en el alta; se reutiliza para el pedido.
      cambiarDireccion(direccionNueva, Boolean(direccionNueva) && nuevaDireccionValida);
      setNuevoUsuario(NUEVO_USUARIO_VACIO);
      cambiarNuevaDireccion('', false);
      setMostrarAltaUsuario(false);
    } catch (err) {
      setErrorUsuario(mensajeAmigable(err, 'No se pudo dar de alta el usuario.'));
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const agregarProducto = () => {
    const unidades = Number(cantidad);
    if (!productoSeleccionado) return setError('Seleccioná un producto.');
    if (!Number.isInteger(unidades) || unidades < 1) return setError('Ingresá una cantidad entera mayor a 0.');

    const idProducto = productoSeleccionado.id_producto;
    const disponible = productoSeleccionado.stock - enCarrito(idProducto);
    if (unidades > disponible) {
      return setError(disponible > 0
        ? `Solo quedan ${disponible} unidades disponibles de ${productoSeleccionado.nombre}.`
        : `Ya agregaste todo el stock disponible de ${productoSeleccionado.nombre}.`);
    }

    setItems((actuales) => (actuales.some((item) => item.id_producto === idProducto)
      ? actuales.map((item) => (item.id_producto === idProducto ? { ...item, cantidad: item.cantidad + unidades } : item))
      : [...actuales, { id_producto: idProducto, nombre: productoSeleccionado.nombre, precio: productoSeleccionado.precio, stock: productoSeleccionado.stock, cantidad: unidades }]));
    setProductoId('');
    setCantidad(1);
    setError('');
  };

  const cambiarCantidad = (idProducto, valor) => setItems((actuales) => actuales.map((item) => (
    item.id_producto === idProducto ? { ...item, cantidad: Math.min(item.stock, Math.max(1, Math.trunc(Number(valor)) || 1)) } : item
  )));

  const quitarItem = (idProducto) => setItems((actuales) => actuales.filter((item) => item.id_producto !== idProducto));

  const enviar = async (event) => {
    event.preventDefault();
    if (!usuarioSeleccionado) return setError('Seleccioná un usuario.');
    if (!direccion.trim()) return setError('Indicá la dirección de entrega.');
    if (!direccionValida) return setError('La dirección no está validada. Elegí una de las sugeridas.');
    if (!items.length) return setError('Agregá al menos un producto.');

    setGuardando(true);
    setError('');
    let creado;
    try {
      creado = await crearPedido({ id_usuario: usuarioSeleccionado.id_usuario, direccion: direccion.trim(), metodo_pago: metodoPago, productos: items });
    } catch (err) {
      setError(mensajeAmigable(err, 'No se pudo crear el pedido.'));
      setGuardando(false);
      return;
    }

    // El pedido ya existe en el back. Si falla el detalle, la pantalla recarga la lista igual.
    let pedidoCompleto = null;
    try { pedidoCompleto = await obtenerPedido(creado?.id_pedido); } catch { /* se recarga la lista */ }
    onCrear(pedidoCompleto);
  };

  const sinStockDisponible = !cargando && idTienda && !productos.length;

  return <section className="crear-pedido" aria-labelledby="crearPedidoTitulo">
    <div className="crear-pedido-header"><div><span className="crear-pedido-eyebrow">Pedidos</span><h2 id="crearPedidoTitulo">Crear pedido manual</h2><p>Asociá un usuario y productos de tu tienda para registrar la venta.</p></div><button type="button" className="crear-pedido-cerrar" onClick={onCancelar} aria-label="Cerrar formulario"><FiX /></button></div>
    <form className="crear-pedido-contenido" onSubmit={enviar} noValidate>
      <fieldset className="crear-pedido-seccion"><legend>Cliente y entrega</legend><div className="crear-pedido-grid">
        <div className="crear-pedido-campo"><label htmlFor="usuarioPedido">Usuario</label><div className="crear-pedido-selector-usuario">
          <select id="usuarioPedido" value={usuarioId} onChange={(e) => seleccionarUsuario(e.target.value)} disabled={cargando || guardando}>
            <option value="">{cargando ? 'Cargando usuarios…' : 'Seleccioná un usuario'}</option>
            {usuarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{etiquetaUsuario(u)}</option>)}
          </select>
          <button type="button" className="crear-pedido-nuevo-usuario-btn" onClick={() => { setMostrarAltaUsuario((a) => !a); setErrorUsuario(''); }} aria-label="Dar de alta un nuevo usuario" disabled={cargando || guardando}><FiUserPlus />Nuevo usuario</button>
        </div>{!cargando && idTienda && !usuarios.length && <p className="crear-pedido-sin-usuarios">Esta tienda todavía no tiene usuarios. Dalo de alta con “Nuevo usuario”.</p>}</div>
        <CampoDireccion label="Dirección de entrega" value={direccion} valida={direccionValida} onChange={cambiarDireccion} disabled={guardando} />
      </div>
        {mostrarAltaUsuario && <div className="crear-pedido-alta-usuario">
          <div className="crear-pedido-alta-usuario-titulo"><strong>Nuevo usuario de la tienda</strong><span>Se agrega a la lista de clientes de esta tienda sin necesidad de email o contraseña.</span></div>
          <div className="crear-pedido-grid">
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioNombre">Nombre</label><input id="nuevoUsuarioNombre" value={nuevoUsuario.nombre} onChange={(e) => cambiarNuevoUsuario('nombre', e.target.value)} placeholder="Nombre" maxLength={50} /></div>
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioApellido">Apellido</label><input id="nuevoUsuarioApellido" value={nuevoUsuario.apellido} onChange={(e) => cambiarNuevoUsuario('apellido', e.target.value)} placeholder="Apellido" maxLength={50} /></div>
            <div className="crear-pedido-campo"><label htmlFor="nuevoUsuarioTelefono">Teléfono (opcional)</label><input id="nuevoUsuarioTelefono" type="tel" value={nuevoUsuario.telefono} onChange={(e) => cambiarNuevoUsuario('telefono', e.target.value)} placeholder="Teléfono" maxLength={20} /></div>
            <CampoDireccion label="Dirección" requerida={false} value={nuevaDireccion} valida={nuevaDireccionValida} onChange={cambiarNuevaDireccion} disabled={guardandoUsuario} />
          </div>
          {errorUsuario && <p className="crear-pedido-error" role="alert">{errorUsuario}</p>}
          <div className="crear-pedido-alta-usuario-acciones">
            <button type="button" className="crear-pedido-btn-alta-secundario" onClick={() => setMostrarAltaUsuario(false)} disabled={guardandoUsuario}>Cancelar</button>
            <button type="button" className="crear-pedido-btn-alta-principal" onClick={guardarNuevoUsuario} disabled={guardandoUsuario}>{guardandoUsuario ? 'Guardando…' : 'Guardar y seleccionar'}</button>
          </div>
        </div>}
      </fieldset>
      <fieldset className="crear-pedido-seccion"><legend>Productos</legend><div className="crear-pedido-selector-producto">
        <div className="crear-pedido-campo crear-pedido-campo--doble"><label htmlFor="productoPedido">Producto de tu tienda</label><select id="productoPedido" value={productoId} onChange={(e) => setProductoId(e.target.value)} disabled={cargando || guardando || !productos.length}>
          <option value="">{sinStockDisponible ? 'No hay productos con stock' : 'Seleccioná un producto'}</option>
          {productos.map((p) => { const disponible = p.stock - enCarrito(p.id_producto); return <option key={p.id_producto} value={p.id_producto} disabled={disponible < 1}>{p.nombre} · {formatearPrecio(p.precio)} · stock {disponible}</option>; })}
        </select></div>
        <div className="crear-pedido-campo crear-pedido-campo--cantidad"><label htmlFor="cantidadPedido">Cantidad</label><input id="cantidadPedido" type="number" min="1" max={productoSeleccionado?.stock} step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></div><button type="button" className="crear-pedido-agregar-btn" onClick={agregarProducto} disabled={cargando || guardando || !productoSeleccionado}><FiPlus />Agregar</button>
      </div><div className="crear-pedido-tabla-wrap"><table className="crear-pedido-tabla"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th aria-label="Quitar" /></tr></thead><tbody>{!items.length && <tr><td colSpan="5" className="crear-pedido-tabla-vacia">Todavía no agregaste productos.</td></tr>}{items.map((item) => <tr key={item.id_producto}><td>{item.nombre}</td><td><input type="number" min="1" max={item.stock} step="1" value={item.cantidad} onChange={(e) => cambiarCantidad(item.id_producto, e.target.value)} aria-label={`Cantidad de ${item.nombre}`} /></td><td>{formatearPrecio(item.precio)}</td><td>{formatearPrecio(item.precio * item.cantidad)}</td><td><button type="button" className="crear-pedido-quitar-item" onClick={() => quitarItem(item.id_producto)} aria-label={`Quitar ${item.nombre}`}><FiTrash2 /></button></td></tr>)}</tbody></table></div><div className="crear-pedido-total"><span>Total del pedido</span><strong>{formatearPrecio(total)}</strong></div></fieldset>
      <fieldset className="crear-pedido-seccion"><legend>Pago</legend><div className="crear-pedido-campo"><label htmlFor="metodoPagoPedido">Método de pago</label><select id="metodoPagoPedido" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>{METODOS_PAGO.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}</select></div></fieldset>
      {errorMostrado && <p className="crear-pedido-error" role="alert">{errorMostrado}</p>}<div className="crear-pedido-acciones"><button type="button" className="crear-pedido-btn-secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button><button type="submit" className="crear-pedido-btn-principal" disabled={guardando || cargando || !idTienda}>{guardando ? 'Creando…' : 'Crear pedido'}</button></div>
    </form>
  </section>;
}

function formatearPrecio(valor) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(valor || 0); }
export default CrearPedido;
