import { useEffect, useState } from 'react';
import { getTodosProductosPorTienda } from '../../api/productos';
import { registrarVentaManual } from '../../api/ventas';
import { getUsuariosPorTienda, crearUsuarioParaTienda } from '../../api/usuarios';
import './RegistrarVentaModal.css';

const METODOS_PAGO = ['Efectivo', 'Mercado Pago', 'Tarjeta'];
const NUEVO_USUARIO_VACIO = { nombre: '', apellido: '', telefono: '' };

const normalizarIdUsuario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const texto = String(valor).trim();
  if (!texto || texto === 'Seleccionar cliente' || texto === 'Sin cliente asignado') return null;
  const numero = Number(texto);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

const normalizarListaProductos = (lista, idTienda) =>
  (Array.isArray(lista) ? lista : [])
    .filter((p) => Number(p?.id_tienda ?? p?.tienda_id ?? 0) === Number(idTienda))
    .filter((p) => p.activo && !p.eliminado && Number(p.stock ?? 0) > 0);

const normalizarListaUsuarios = (lista, idTienda) =>
  (Array.isArray(lista) ? lista : []).filter((u) => {
    const tiendaUsuario = Number(u?.id_tienda ?? u?.tienda_id ?? u?.idTienda ?? 0);
    const tieneTiendaEnRespuesta = u?.id_tienda !== undefined || u?.tienda_id !== undefined || u?.idTienda !== undefined;
    return !tieneTiendaEnRespuesta || tiendaUsuario === Number(idTienda);
  });

const nombreUsuario = (u) =>
  [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim() || 'Usuario sin nombre';
const etiquetaUsuario = (u) =>
  u?.telefono ? `${nombreUsuario(u)} · ${u.telefono}` : nombreUsuario(u);

function RegistrarVentaModal({ idTienda, onVentaRegistrada, onCancelar }) {
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState('');

  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [idUsuarioSeleccionado, setIdUsuarioSeleccionado] = useState('');
  const [detalles, setDetalles] = useState([]);

  const [mostrarAltaUsuario, setMostrarAltaUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(NUEVO_USUARIO_VACIO);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const productoActual = productos.find(
    (p) => String(p.id_producto) === String(idProductoSeleccionado)
  );

  const cantidadYaAgregada = (idProducto) =>
    detalles
      .filter((d) => String(d.id_producto) === String(idProducto))
      .reduce((acc, d) => acc + Number(d.cantidad || 0), 0);

  const stockDisponibleActual = productoActual
    ? Math.max(0, Number(productoActual.stock) - cantidadYaAgregada(productoActual.id_producto))
    : 0;

  const totalCalculado = detalles
    .reduce((acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario), 0)
    .toFixed(2);

  useEffect(() => {
    let montado = true;
    async function cargar() {
      setLoadingDatos(true);
      setErrorDatos('');
      try {
        const [listaProductos, listaUsuarios] = await Promise.all([
          getTodosProductosPorTienda(idTienda),
          getUsuariosPorTienda(idTienda).catch(() => []),
        ]);
        if (!montado) return;

        const disponibles = normalizarListaProductos(listaProductos, idTienda);
        const usuariosDeLaTienda = normalizarListaUsuarios(listaUsuarios, idTienda);
        setProductos(disponibles);
        setUsuarios(usuariosDeLaTienda);

        if (disponibles.length > 0) {
          setIdProductoSeleccionado((actual) =>
            disponibles.some((p) => String(p.id_producto) === String(actual))
              ? actual
              : String(disponibles[0].id_producto)
          );
        }

        setIdUsuarioSeleccionado((actual) =>
          actual && !usuariosDeLaTienda.some((u) => String(u.id_usuario) === String(actual)) ? '' : actual
        );
      } catch {
        if (montado) setErrorDatos('No se pudieron cargar los productos y clientes de la tienda.');
      } finally {
        if (montado) setLoadingDatos(false);
      }
    }
    cargar();
    return () => { montado = false; };
  }, [idTienda]);

  const seleccionarProducto = (id) => {
    setIdProductoSeleccionado(id);
    setCantidad(1);
    setErrorGuardado('');
  };

  const agregarDetalle = () => {
    setErrorGuardado('');
    if (!productoActual) {
      setErrorGuardado('Seleccioná un producto válido de la tienda.');
      return;
    }
    const cantidadNum = Number(cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      setErrorGuardado('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (cantidadNum > stockDisponibleActual) {
      setErrorGuardado(`Stock insuficiente. Disponible: ${stockDisponibleActual}`);
      return;
    }

    const precio = Number(productoActual.precio);
    setDetalles((prev) => {
      const idx = prev.findIndex((d) => String(d.id_producto) === String(productoActual.id_producto));
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cantidadNum };
        return copia;
      }
      return [...prev, {
        id_producto: Number(productoActual.id_producto),
        nombre_producto: productoActual.nombre,
        cantidad: cantidadNum,
        precio_unitario: precio,
      }];
    });
    setCantidad(1);
  };

  const quitarDetalle = (idProducto) => {
    setDetalles((prev) => prev.filter((d) => String(d.id_producto) !== String(idProducto)));
  };

  const cambiarNuevoUsuario = (campo, valor) => {
    const limpio = campo === 'telefono' ? valor.replace(/[^\d\s+()-]/g, '') : valor;
    setNuevoUsuario((prev) => ({ ...prev, [campo]: limpio }));
  };

  const guardarNuevoUsuario = async (e) => {
    e.preventDefault();
    const nombre = nuevoUsuario.nombre.trim();
    const apellido = nuevoUsuario.apellido.trim();
    if (!nombre || !apellido) {
      setErrorUsuario('El nombre y el apellido son obligatorios.');
      return;
    }
    setGuardandoUsuario(true);
    setErrorUsuario('');
    try {
      const creado = await crearUsuarioParaTienda({
        nombre,
        apellido,
        telefono: nuevoUsuario.telefono.trim(),
        direccion: '',
        id_tienda: Number(idTienda),
      });
      const usuarioCreado = creado?.data ?? creado;
      if (!usuarioCreado?.id_usuario) throw new Error('El servidor no devolvió el usuario creado.');
      setUsuarios((prev) => [...prev, usuarioCreado]);
      setIdUsuarioSeleccionado(String(usuarioCreado.id_usuario));
      setNuevoUsuario(NUEVO_USUARIO_VACIO);
      setMostrarAltaUsuario(false);
    } catch (err) {
      setErrorUsuario(err.message || 'No se pudo crear el usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGuardado('');

    if (detalles.length === 0) {
      setErrorGuardado('Agregá al menos un producto a la venta.');
      return;
    }

    const idUsuarioNormalizado = normalizarIdUsuario(idUsuarioSeleccionado);
    if (idUsuarioSeleccionado && idUsuarioNormalizado === null) {
      setErrorGuardado('Seleccioná un cliente real de la tienda.');
      return;
    }
    const usuarioSeleccionado = idUsuarioNormalizado !== null
      ? usuarios.find((u) => Number(u.id_usuario) === Number(idUsuarioNormalizado)) || null
      : null;
    if (idUsuarioNormalizado !== null && !usuarioSeleccionado) {
      setErrorGuardado('El cliente asignado no existe en la base de datos de esta tienda.');
      return;
    }

    setGuardando(true);
    try {
      const lineas = detalles.map((d) => ({
        id_producto: Number(d.id_producto),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
      }));

      const payload = {
        id_tienda: Number(idTienda),
        metodo_pago: metodoPago,
        id_usuario: idUsuarioNormalizado,
        // Compatibilidad: backend nuevo usa "productos", el front usa "detalles".
        productos: lineas,
        detalles: lineas,
      };

      const venta = await registrarVentaManual(payload);
      const ventaNormalizada = {
        ...venta,
        id_tienda: Number(idTienda),
        ...(idUsuarioNormalizado !== null && { id_usuario: idUsuarioNormalizado }),
        ...(usuarioSeleccionado && { nombre_cliente: nombreUsuario(usuarioSeleccionado) }),
        detalles: detalles.map((d) => ({
          ...d,
          subtotal: Number(d.cantidad) * Number(d.precio_unitario),
        })),
        total: Number(venta?.total ?? totalCalculado),
      };

      onVentaRegistrada(
        ventaNormalizada,
        detalles.map((d) => d.nombre_producto).join(', '),
        usuarioSeleccionado ? nombreUsuario(usuarioSeleccionado) : null
      );
    } catch (err) {
      setErrorGuardado(err.message || 'No se pudo registrar la venta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rvm-backdrop" role="presentation" onMouseDown={onCancelar}>
      <div
        className="rvm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rvm-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rvm-header">
          <div>
            <span className="rvm-kicker">Panel del vendedor</span>
            <h2 id="rvm-titulo">Registrar venta</h2>
          </div>
          <button type="button" className="rvm-close" aria-label="Cerrar" onClick={onCancelar} disabled={guardando}>
            ✕
          </button>
        </div>

        {loadingDatos ? (
          <p className="rvm-msg">Cargando datos...</p>
        ) : errorDatos ? (
          <p className="rvm-msg rvm-msg--error">{errorDatos}</p>
        ) : productos.length === 0 ? (
          <p className="rvm-msg">No hay productos disponibles con stock.</p>
        ) : (
          <form className="rvm-form" onSubmit={handleSubmit}>
            <label className="rvm-label" htmlFor="rvm-producto">Producto</label>
            <select
              id="rvm-producto"
              className="rvm-select"
              value={idProductoSeleccionado}
              onChange={(e) => seleccionarProducto(e.target.value)}
              disabled={guardando}
            >
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre} — Stock: {p.stock} — ${Number(p.precio).toFixed(2)}
                </option>
              ))}
            </select>

            <label className="rvm-label" htmlFor="rvm-cantidad">
              Cantidad
              {productoActual && <span className="rvm-stock-hint">(disp. {stockDisponibleActual})</span>}
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                id="rvm-cantidad"
                type="number"
                className="rvm-input"
                min={1}
                max={stockDisponibleActual || 1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={guardando}
                style={{ flex: 1 }}
              />
              <button type="button" className="rvm-btn rvm-btn--confirm" onClick={agregarDetalle} disabled={guardando || stockDisponibleActual <= 0}>
                Agregar
              </button>
            </div>

            {detalles.length > 0 && (
              <div className="rvm-resumen" style={{ marginTop: 8 }}>
                <div className="rvm-resumen-row" style={{ fontWeight: 600, marginBottom: 6 }}>
                  <span>Productos en la venta</span>
                </div>
                {detalles.map((d) => (
                  <div key={d.id_producto} className="rvm-resumen-row" style={{ alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1 }}>
                      {d.nombre_producto} × {d.cantidad} — ${(Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2)}
                    </span>
                    <button type="button" className="rvm-btn rvm-btn--cancel" onClick={() => quitarDetalle(d.id_producto)} disabled={guardando} style={{ padding: '2px 8px' }}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="rvm-label" htmlFor="rvm-metodo">Método de pago</label>
            <select id="rvm-metodo" className="rvm-select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} disabled={guardando}>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <hr className="rvm-divider" />

            <div className="rvm-usuario-header">
              <label className="rvm-label" htmlFor="rvm-usuario">
                Cliente <span className="rvm-opcional">(opcional)</span>
              </label>
              <button
                type="button"
                className="rvm-nuevo-usuario-btn"
                onClick={() => { setMostrarAltaUsuario((v) => !v); setErrorUsuario(''); }}
                disabled={guardando}
              >
                {mostrarAltaUsuario ? '✕ Cancelar' : '+ Nuevo cliente'}
              </button>
            </div>

            <select id="rvm-usuario" className="rvm-select" value={idUsuarioSeleccionado} onChange={(e) => setIdUsuarioSeleccionado(e.target.value)} disabled={guardando}>
              <option value="">Sin cliente asignado</option>
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>{etiquetaUsuario(u)}</option>
              ))}
            </select>

            {mostrarAltaUsuario && (
              <div className="rvm-alta-usuario">
                <p className="rvm-alta-usuario__desc">El cliente se guarda como usuario de la tienda sin email ni contraseña.</p>
                <div className="rvm-alta-usuario__grid">
                  <div className="rvm-campo">
                    <label htmlFor="rvm-nuevo-nombre" className="rvm-label rvm-label--sm">Nombre</label>
                    <input id="rvm-nuevo-nombre" className="rvm-input" value={nuevoUsuario.nombre} onChange={(e) => cambiarNuevoUsuario('nombre', e.target.value)} placeholder="Nombre" maxLength={50} disabled={guardandoUsuario} />
                  </div>
                  <div className="rvm-campo">
                    <label htmlFor="rvm-nuevo-apellido" className="rvm-label rvm-label--sm">Apellido</label>
                    <input id="rvm-nuevo-apellido" className="rvm-input" value={nuevoUsuario.apellido} onChange={(e) => cambiarNuevoUsuario('apellido', e.target.value)} placeholder="Apellido" maxLength={50} disabled={guardandoUsuario} />
                  </div>
                  <div className="rvm-campo rvm-campo--full">
                    <label htmlFor="rvm-nuevo-telefono" className="rvm-label rvm-label--sm">Teléfono <span className="rvm-opcional">(opcional)</span></label>
                    <input id="rvm-nuevo-telefono" type="tel" className="rvm-input" value={nuevoUsuario.telefono} onChange={(e) => cambiarNuevoUsuario('telefono', e.target.value)} placeholder="Teléfono" maxLength={20} disabled={guardandoUsuario} />
                  </div>
                </div>
                {errorUsuario && <p className="rvm-msg rvm-msg--error" role="alert">{errorUsuario}</p>}
                <div className="rvm-alta-usuario__acciones">
                  <button type="button" className="rvm-btn rvm-btn--cancel" onClick={() => { setMostrarAltaUsuario(false); setNuevoUsuario(NUEVO_USUARIO_VACIO); setErrorUsuario(''); }} disabled={guardandoUsuario}>Cancelar</button>
                  <button type="button" className="rvm-btn rvm-btn--confirm" onClick={guardarNuevoUsuario} disabled={guardandoUsuario}>{guardandoUsuario ? 'Guardando...' : 'Guardar y seleccionar'}</button>
                </div>
              </div>
            )}

            <div className="rvm-resumen">
              <div className="rvm-resumen-row rvm-resumen-total">
                <span>Total ({detalles.reduce((a, d) => a + Number(d.cantidad), 0)} u.)</span>
                <strong>${totalCalculado}</strong>
              </div>
            </div>

            {errorGuardado && <p className="rvm-msg rvm-msg--error" role="alert">{errorGuardado}</p>}

            <div className="rvm-actions">
              <button type="button" className="rvm-btn rvm-btn--cancel" onClick={onCancelar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="rvm-btn rvm-btn--confirm" disabled={guardando || detalles.length === 0}>
                {guardando ? 'Registrando...' : 'Confirmar venta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistrarVentaModal;
