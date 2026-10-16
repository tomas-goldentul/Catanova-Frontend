import { useEffect, useState } from 'react';
import { getTodosProductosPorTienda } from '../../api/productos';
import { registrarVentaManual } from '../../api/ventas';
import { getUsuariosPorTienda, crearUsuarioParaTienda } from '../../api/usuarios';
import './RegistrarVentaModal.css';

const METODOS_PAGO = ['Efectivo', 'Tarjeta de débito', 'Tarjeta de crédito', 'Transferencia'];
const NUEVO_USUARIO_VACIO = { nombre: '', apellido: '', telefono: '' };

const nombreUsuario = (u) =>
  [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim() || 'Usuario sin nombre';
const etiquetaUsuario = (u) =>
  u?.telefono ? `${nombreUsuario(u)} · ${u.telefono}` : nombreUsuario(u);

function RegistrarVentaModal({ idTienda, onVentaRegistrada, onCancelar }) {
  // ——— Datos ———
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState('');

  // ——— Formulario principal ———
  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [idUsuarioSeleccionado, setIdUsuarioSeleccionado] = useState('');

  // ——— Alta usuario ———
  const [mostrarAltaUsuario, setMostrarAltaUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(NUEVO_USUARIO_VACIO);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState('');

  // ——— Envío ———
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  // Producto actualmente seleccionado
  const productoActual = productos.find(
    (p) => String(p.id_producto) === String(idProductoSeleccionado)
  );

  const totalCalculado = productoActual
    ? (Number(productoActual.precio) * Number(cantidad)).toFixed(2)
    : '0.00';

  // ——— Carga inicial ———
  useEffect(() => {
    let montado = true;

    async function cargar() {
      setLoadingDatos(true);
      setErrorDatos('');
      try {
        const [listaProductos, listaUsuarios] = await Promise.all([
          getTodosProductosPorTienda(idTienda),
          getUsuariosPorTienda(idTienda).catch(() => []), // usuarios es opcional, no falla
        ]);

        if (!montado) return;

        const disponibles = (Array.isArray(listaProductos) ? listaProductos : []).filter(
          (p) => p.activo && !p.eliminado && Number(p.stock) > 0
        );
        setProductos(disponibles);
        if (disponibles.length > 0) {
          setIdProductoSeleccionado(String(disponibles[0].id_producto));
        }

        setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : []);
      } catch (err) {
        if (montado) setErrorDatos('No se pudieron cargar los productos.');
      } finally {
        if (montado) setLoadingDatos(false);
      }
    }

    cargar();
    return () => { montado = false; };
  }, [idTienda]);

  // Resetear cantidad al cambiar producto
  useEffect(() => {
    setCantidad(1);
    setErrorGuardado('');
  }, [idProductoSeleccionado]);

  // ——— Alta de usuario rápida ———
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
        id_tienda: Number(idTienda),
      });
      if (!creado?.id_usuario) throw new Error('El servidor no devolvió el usuario creado.');

      setUsuarios((prev) => [...prev, creado]);
      setIdUsuarioSeleccionado(String(creado.id_usuario));
      setNuevoUsuario(NUEVO_USUARIO_VACIO);
      setMostrarAltaUsuario(false);
    } catch (err) {
      setErrorUsuario(err.message || 'No se pudo crear el usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  // ——— Envío de la venta ———
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGuardado('');

    if (!productoActual) {
      setErrorGuardado('Seleccioná un producto.');
      return;
    }

    const cantidadNum = Number(cantidad);
    if (cantidadNum <= 0 || !Number.isInteger(cantidadNum)) {
      setErrorGuardado('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (cantidadNum > Number(productoActual.stock)) {
      setErrorGuardado(`Stock insuficiente. Disponible: ${productoActual.stock}`);
      return;
    }

    setGuardando(true);
    try {
      const venta = await registrarVentaManual({
        id_producto: productoActual.id_producto,
        id_tienda: idTienda,
        cantidad: cantidadNum,
        precio_unitario: Number(productoActual.precio),
        metodo_pago: metodoPago,
        // id_usuario es opcional: null si no se seleccionó ninguno
        id_usuario: idUsuarioSeleccionado ? Number(idUsuarioSeleccionado) : null,
      });
      onVentaRegistrada(venta, productoActual.nombre);
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
        {/* Header */}
        <div className="rvm-header">
          <div>
            <span className="rvm-kicker">Panel del vendedor</span>
            <h2 id="rvm-titulo">Registrar venta</h2>
          </div>
          <button
            type="button"
            className="rvm-close"
            aria-label="Cerrar"
            onClick={onCancelar}
            disabled={guardando}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {loadingDatos ? (
          <p className="rvm-msg">Cargando datos...</p>
        ) : errorDatos ? (
          <p className="rvm-msg rvm-msg--error">{errorDatos}</p>
        ) : productos.length === 0 ? (
          <p className="rvm-msg">No hay productos disponibles con stock.</p>
        ) : (
          <form className="rvm-form" onSubmit={handleSubmit}>

            {/* ── Producto ── */}
            <label className="rvm-label" htmlFor="rvm-producto">
              Producto
            </label>
            <select
              id="rvm-producto"
              className="rvm-select"
              value={idProductoSeleccionado}
              onChange={(e) => setIdProductoSeleccionado(e.target.value)}
              disabled={guardando}
            >
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre} — Stock: {p.stock} — ${Number(p.precio).toFixed(2)}
                </option>
              ))}
            </select>

            {/* ── Cantidad ── */}
            <label className="rvm-label" htmlFor="rvm-cantidad">
              Cantidad
              {productoActual && (
                <span className="rvm-stock-hint">(máx. {productoActual.stock})</span>
              )}
            </label>
            <input
              id="rvm-cantidad"
              type="number"
              className="rvm-input"
              min={1}
              max={productoActual?.stock ?? 1}
              value={cantidad}
              onChange={(e) =>
                setCantidad(e.target.value === '' ? '' : Number(e.target.value))
              }
              disabled={guardando}
            />

            {/* ── Método de pago ── */}
            <label className="rvm-label" htmlFor="rvm-metodo">
              Método de pago
            </label>
            <select
              id="rvm-metodo"
              className="rvm-select"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              disabled={guardando}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* ── Divider ── */}
            <hr className="rvm-divider" />

            {/* ── Usuario (opcional) ── */}
            <div className="rvm-usuario-header">
              <label className="rvm-label" htmlFor="rvm-usuario">
                Cliente
                <span className="rvm-opcional">(opcional)</span>
              </label>
              <button
                type="button"
                className="rvm-nuevo-usuario-btn"
                onClick={() => {
                  setMostrarAltaUsuario((v) => !v);
                  setErrorUsuario('');
                }}
                disabled={guardando}
              >
                {mostrarAltaUsuario ? '✕ Cancelar' : '+ Nuevo cliente'}
              </button>
            </div>

            <select
              id="rvm-usuario"
              className="rvm-select"
              value={idUsuarioSeleccionado}
              onChange={(e) => setIdUsuarioSeleccionado(e.target.value)}
              disabled={guardando}
            >
              <option value="">Sin cliente asignado</option>
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {etiquetaUsuario(u)}
                </option>
              ))}
            </select>

            {/* ── Alta rápida de usuario ── */}
            {mostrarAltaUsuario && (
              <div className="rvm-alta-usuario">
                <p className="rvm-alta-usuario__desc">
                  El cliente se guarda como usuario de la tienda sin email ni contraseña.
                </p>
                <div className="rvm-alta-usuario__grid">
                  <div className="rvm-campo">
                    <label htmlFor="rvm-nuevo-nombre" className="rvm-label rvm-label--sm">
                      Nombre
                    </label>
                    <input
                      id="rvm-nuevo-nombre"
                      className="rvm-input"
                      value={nuevoUsuario.nombre}
                      onChange={(e) => cambiarNuevoUsuario('nombre', e.target.value)}
                      placeholder="Nombre"
                      maxLength={50}
                      disabled={guardandoUsuario}
                    />
                  </div>
                  <div className="rvm-campo">
                    <label htmlFor="rvm-nuevo-apellido" className="rvm-label rvm-label--sm">
                      Apellido
                    </label>
                    <input
                      id="rvm-nuevo-apellido"
                      className="rvm-input"
                      value={nuevoUsuario.apellido}
                      onChange={(e) => cambiarNuevoUsuario('apellido', e.target.value)}
                      placeholder="Apellido"
                      maxLength={50}
                      disabled={guardandoUsuario}
                    />
                  </div>
                  <div className="rvm-campo rvm-campo--full">
                    <label htmlFor="rvm-nuevo-telefono" className="rvm-label rvm-label--sm">
                      Teléfono <span className="rvm-opcional">(opcional)</span>
                    </label>
                    <input
                      id="rvm-nuevo-telefono"
                      type="tel"
                      className="rvm-input"
                      value={nuevoUsuario.telefono}
                      onChange={(e) => cambiarNuevoUsuario('telefono', e.target.value)}
                      placeholder="Teléfono"
                      maxLength={20}
                      disabled={guardandoUsuario}
                    />
                  </div>
                </div>

                {errorUsuario && (
                  <p className="rvm-msg rvm-msg--error" role="alert">
                    {errorUsuario}
                  </p>
                )}

                <div className="rvm-alta-usuario__acciones">
                  <button
                    type="button"
                    className="rvm-btn rvm-btn--cancel"
                    onClick={() => {
                      setMostrarAltaUsuario(false);
                      setNuevoUsuario(NUEVO_USUARIO_VACIO);
                      setErrorUsuario('');
                    }}
                    disabled={guardandoUsuario}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rvm-btn rvm-btn--confirm"
                    onClick={guardarNuevoUsuario}
                    disabled={guardandoUsuario}
                  >
                    {guardandoUsuario ? 'Guardando...' : 'Guardar y seleccionar'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Resumen ── */}
            {productoActual && (
              <div className="rvm-resumen">
                <div className="rvm-resumen-row">
                  <span>Precio unitario</span>
                  <strong>${Number(productoActual.precio).toFixed(2)}</strong>
                </div>
                <div className="rvm-resumen-row rvm-resumen-total">
                  <span>Total</span>
                  <strong>${totalCalculado}</strong>
                </div>
              </div>
            )}

            {errorGuardado && (
              <p className="rvm-msg rvm-msg--error" role="alert">
                {errorGuardado}
              </p>
            )}

            {/* ── Acciones ── */}
            <div className="rvm-actions">
              <button
                type="button"
                className="rvm-btn rvm-btn--cancel"
                onClick={onCancelar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rvm-btn rvm-btn--confirm"
                disabled={guardando || productos.length === 0}
              >
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
