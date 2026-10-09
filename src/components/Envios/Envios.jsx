import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiEdit3,
  FiEye,
  FiMapPin,
  FiPlus,
  FiRadio,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import {
  crearEnvio,
  editarEnvio,
  eliminarEnvio,
  marcarEntregado,
  MAX_TEXTO_ENVIO,
  obtenerEnvios,
  obtenerSeguimiento,
} from '../../api/envios';
import { getImagenUrl } from '../../api/helper';
import CampoDireccion from '../Pedidos/CampoDireccion';
import '../Pedidos/Pedidos.css';
import './Envios.css';

const ESTADOS = ['Todos', 'Pendiente', 'En preparación', 'Enviado', 'Entregado'];
const ESTADOS_CON_ENVIO_CREABLE = ['Pendiente', 'En preparación'];
const ITEMS_POR_PAGINA = 6;
// "Ver en tiempo real": el back no tiene websockets, se vuelve a consultar el seguimiento.
const INTERVALO_TIEMPO_REAL_MS = 25000;
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

function Envios({ onVolver, onIrALogin }) {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const [pedidoEnSeguimiento, setPedidoEnSeguimiento] = useState(null);
  const [envioEnFormulario, setEnvioEnFormulario] = useState(null);
  const [envioAEliminar, setEnvioAEliminar] = useState(null);
  const [aviso, setAviso] = useState('');

  const actualizar = () => setRefreshKey((actual) => actual + 1);

  useEffect(() => {
    const controller = new AbortController();

    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        setEnvios(await obtenerEnvios(controller.signal));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    cargar();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    if (!aviso) return undefined;
    const timer = setTimeout(() => setAviso(''), 4000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const metricas = useMemo(() => ({
    total: envios.length,
    sinEnvio: envios.filter((fila) => fila.puede_crear_envio).length,
    enCamino: envios.filter((fila) => fila.estado === 'Enviado').length,
    entregados: envios.filter((fila) => fila.estado === 'Entregado').length,
  }), [envios]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return envios.filter((fila) => {
      const coincideEstado = estado === 'Todos' || fila.estado === estado;
      const campos = [
        fila.id_pedido,
        fila.codigo_seguimiento,
        fila.nombre_comprador,
        fila.direccion,
        fila.repartidor,
      ].filter(Boolean).join(' ').toLowerCase();
      return coincideEstado && (!texto || campos.includes(texto));
    });
  }, [envios, busqueda, estado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA);

  const alGuardarEnvio = (mensaje) => {
    setEnvioEnFormulario(null);
    setEnvioAEliminar(null);
    setAviso(mensaje);
    actualizar();
  };

  const modales = (
    <>
      {envioEnFormulario && (
        <EnvioFormModal
          objetivo={envioEnFormulario}
          onCerrar={() => setEnvioEnFormulario(null)}
          onGuardado={alGuardarEnvio}
        />
      )}
      {envioAEliminar && (
        <EliminarEnvioModal
          objetivo={envioAEliminar}
          onCerrar={() => setEnvioAEliminar(null)}
          onEliminado={alGuardarEnvio}
        />
      )}
      {aviso && <p className="envios-aviso" role="status"><FiCheckCircle aria-hidden="true" />{aviso}</p>}
    </>
  );

  if (pedidoEnSeguimiento) {
    return (
      <section className="pedidos-page envios-page">
        <div className="pedidos-shell">
          <SeguimientoPedido
            idPedido={pedidoEnSeguimiento}
            refreshKey={refreshKey}
            onVolver={() => setPedidoEnSeguimiento(null)}
            onIrALogin={onIrALogin}
            onCrearEnvio={setEnvioEnFormulario}
            onEditarEnvio={setEnvioEnFormulario}
            onEliminarEnvio={setEnvioAEliminar}
            onEntregado={() => alGuardarEnvio(`El pedido #${pedidoEnSeguimiento} se marcó como entregado.`)}
          />
        </div>
        {modales}
      </section>
    );
  }

  return (
    <section className="pedidos-page envios-page">
      <div className="pedidos-shell">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-kicker">Panel del vendedor</span>
            <h1>Envíos</h1>
            <p>Creá envíos para tus pedidos, asigná repartidores y seguí cada entrega.</p>
          </div>

          <div className="pedidos-header-actions">
            {onVolver && (
              <button type="button" className="pedidos-secondary" onClick={onVolver}>
                <FiArrowLeft aria-hidden="true" />
                Mi Tienda
              </button>
            )}
            <button type="button" className="pedidos-secondary" onClick={actualizar} disabled={loading}>
              <FiRefreshCw aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </header>

        <div className="pedidos-summary envios-summary" aria-label="Resumen de envíos">
          <Kpi label="Pedidos" value={metricas.total} tone="neutral" />
          <Kpi label="Sin envío" value={metricas.sinEnvio} tone="warning" />
          <Kpi label="En camino" value={metricas.enCamino} tone="info" />
          <Kpi label="Entregados" value={metricas.entregados} tone="success" />
        </div>

        <div className="pedidos-control-panel envios-control-panel">
          <label className="pedidos-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por código, pedido, comprador, dirección o repartidor"
            />
          </label>

          <div className="pedidos-status-filter" aria-label="Filtrar por estado">
            {ESTADOS.map((opcion) => (
              <button
                type="button"
                key={opcion}
                className={estado === opcion ? 'active' : ''}
                onClick={() => {
                  setEstado(opcion);
                  setPagina(1);
                }}
              >
                {opcion}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="pedidos-message">Cargando envíos...</p>}
        {error && <MensajeError error={error} onIrALogin={onIrALogin} />}
        {!loading && !error && filtrados.length === 0 && (
          <p className="pedidos-message">
            {envios.length === 0 ? 'Tu tienda todavía no tiene pedidos.' : 'No hay envíos que coincidan con la búsqueda.'}
          </p>
        )}

        <div className="envios-list">
          {!error && paginados.map((fila) => (
            <EnvioCard
              key={fila.id_pedido}
              fila={fila}
              onVerSeguimiento={() => setPedidoEnSeguimiento(fila.id_pedido)}
              onCrearEnvio={() => setEnvioEnFormulario(objetivoDesdeFila(fila))}
              onEditarEnvio={() => setEnvioEnFormulario(objetivoDesdeFila(fila))}
              onEliminarEnvio={() => setEnvioAEliminar(objetivoDesdeFila(fila))}
            />
          ))}
        </div>

        {!error && totalPaginas > 1 && (
          <nav className="pedidos-pagination" aria-label="Paginación">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={paginaActual === 1}
              onClick={() => setPagina(Math.max(1, paginaActual - 1))}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            {Array.from({ length: totalPaginas }, (_, index) => index + 1).map((numero) => (
              <button
                type="button"
                key={numero}
                className={paginaActual === numero ? 'active' : ''}
                onClick={() => setPagina(numero)}
              >
                {numero}
              </button>
            ))}
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
      {modales}
    </section>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MensajeError({ error, onIrALogin }) {
  return (
    <div className="pedidos-message error envios-error">
      <span>{error.message}</span>
      {error.sesionVencida && onIrALogin && (
        <button type="button" className="pedidos-secondary" onClick={onIrALogin}>
          Iniciar sesión
        </button>
      )}
    </div>
  );
}

function EnvioCard({ fila, onVerSeguimiento, onCrearEnvio, onEditarEnvio, onEliminarEnvio }) {
  const tieneEnvio = Boolean(fila.id_envio);
  const editable = tieneEnvio && fila.estado !== 'Entregado';

  return (
    <article className="envio-card">
      <div className="envio-card-top">
        <span className="pedido-id">Pedido #{fila.id_pedido}</span>
        <span className={`pedido-status ${estadoClass(fila.estado)}`}>{fila.estado}</span>
        <time dateTime={fila.fecha_pedido}>{formatearFecha(fila.fecha_pedido, true)}</time>
      </div>

      <div className="envio-card-body">
        <div className="envio-card-comprador">
          <h2>{fila.nombre_comprador || 'Comprador sin datos'}</h2>
          <p><FiMapPin aria-hidden="true" />{fila.direccion || 'Dirección sin cargar'}</p>
        </div>

        <dl className="envio-card-datos">
          <div>
            <dt>Seguimiento</dt>
            <dd className={tieneEnvio ? 'envio-codigo' : 'envio-vacio'}>{fila.codigo_seguimiento || 'Sin envío'}</dd>
          </div>
          <div>
            <dt>Repartidor</dt>
            <dd className={fila.repartidor ? '' : 'envio-vacio'}>{fila.repartidor || 'Sin asignar'}</dd>
          </div>
          <div>
            <dt>{fila.cantidad_productos === 1 ? '1 producto' : `${fila.cantidad_productos} productos`}</dt>
            <dd>{formatearPrecio(fila.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="envio-card-actions">
        <button type="button" className="envio-btn" onClick={onVerSeguimiento}>
          <FiEye aria-hidden="true" />
          Ver seguimiento
        </button>
        {fila.puede_crear_envio && (
          <button type="button" className="envio-btn primary" onClick={onCrearEnvio}>
            <FiPlus aria-hidden="true" />
            Crear envío
          </button>
        )}
        {editable && (
          <>
            <button type="button" className="envio-btn" onClick={onEditarEnvio}>
              <FiEdit3 aria-hidden="true" />
              Editar
            </button>
            <button type="button" className="envio-btn danger" onClick={onEliminarEnvio}>
              <FiTrash2 aria-hidden="true" />
              Eliminar
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function SeguimientoPedido({
  idPedido,
  refreshKey,
  onVolver,
  onIrALogin,
  onCrearEnvio,
  onEditarEnvio,
  onEliminarEnvio,
  onEntregado,
}) {
  const [seguimiento, setSeguimiento] = useState(null);
  const [error, setError] = useState(null);
  const [tiempoReal, setTiempoReal] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargar() {
      try {
        const datos = await obtenerSeguimiento(idPedido, controller.signal);
        setSeguimiento(datos);
        setError(null);
        setUltimaActualizacion(new Date());
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      }
    }

    cargar();
    const intervalo = tiempoReal ? setInterval(cargar, INTERVALO_TIEMPO_REAL_MS) : null;
    return () => {
      controller.abort();
      if (intervalo) clearInterval(intervalo);
    };
  }, [idPedido, refreshKey, tiempoReal]);

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(seguimiento.envio.codigo_seguimiento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el código igual queda visible para copiarlo a mano.
    }
  };

  const entregar = async () => {
    setMarcando(true);
    setErrorAccion('');
    try {
      await marcarEntregado(idPedido);
      onEntregado();
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setMarcando(false);
    }
  };

  const volver = (
    <button type="button" className="pedidos-secondary envios-volver" onClick={onVolver}>
      <FiArrowLeft aria-hidden="true" />
      Volver a envíos
    </button>
  );

  if (error && !seguimiento) {
    return (
      <>
        {volver}
        <MensajeError error={error} onIrALogin={onIrALogin} />
      </>
    );
  }

  if (!seguimiento) {
    return (
      <>
        {volver}
        <p className="pedidos-message">Cargando seguimiento...</p>
      </>
    );
  }

  const { comprador, envio, pasos = [], productos = [] } = seguimiento;
  const nombreComprador = envio?.nombre_comprador
    || [comprador?.nombre, comprador?.apellido].filter(Boolean).join(' ')
    || 'Comprador sin datos';
  const objetivo = objetivoDesdeSeguimiento(seguimiento);
  const puedeCrearEnvio = !envio && ESTADOS_CON_ENVIO_CREABLE.includes(seguimiento.estado);
  const editable = envio && seguimiento.estado !== 'Entregado';

  return (
    <>
      {volver}

      <article className="seguimiento-card">
        <header className="seguimiento-header">
          <div>
            <span className="pedidos-kicker">Pedido #{seguimiento.id_pedido}</span>
            <h1>Seguimiento del pedido</h1>
          </div>
          <span className={`pedido-status ${estadoClass(seguimiento.estado)}`}>{seguimiento.estado}</span>
        </header>

        <div className="seguimiento-comprador">
          <span className="seguimiento-avatar" aria-hidden="true">
            {comprador?.iniciales || <FiUser />}
          </span>
          <div>
            <strong>{nombreComprador}</strong>
            <span>{comprador?.direccion || 'Dirección sin cargar'}</span>
          </div>
        </div>

        <ol className="seguimiento-timeline" aria-label="Estado del envío">
          {pasos.map((paso, index) => {
            const siguiente = pasos[index + 1];
            const tramo = !siguiente ? null : siguiente.completado ? 'lleno' : paso.actual ? 'medio' : 'vacio';
            return (
              <li key={paso.clave} className={`seguimiento-paso ${claseDePaso(paso)}`} aria-current={paso.actual ? 'step' : undefined}>
                <span className="seguimiento-paso-titulo">{paso.titulo}</span>
                <span className="seguimiento-paso-icono" aria-hidden="true">{iconoDePaso(paso)}</span>
                {tramo && <span className={`seguimiento-tramo ${tramo}`} aria-hidden="true" />}
                <span className="seguimiento-paso-fecha">{fechaDePaso(paso)}</span>
              </li>
            );
          })}
        </ol>

        <div className="seguimiento-acciones">
          <button
            type="button"
            className={`envio-btn ${tiempoReal ? 'activo' : ''}`}
            aria-pressed={tiempoReal}
            onClick={() => setTiempoReal((actual) => !actual)}
          >
            <FiRadio aria-hidden="true" />
            {tiempoReal ? 'Viendo en tiempo real' : 'Ver en tiempo real'}
          </button>
          {ultimaActualizacion && (
            <span className="seguimiento-actualizado">
              Actualizado {formatearHora(ultimaActualizacion)}
              {error && ' · no se pudo refrescar'}
            </span>
          )}
        </div>

        <div className="seguimiento-info">
          <section className="seguimiento-productos" aria-labelledby="seguimientoProductos">
            <h2 id="seguimientoProductos">Información del pedido</h2>
            <ul>
              {productos.map((producto) => (
                <li key={producto.id_producto}>
                  <img
                    src={getImagenUrl(producto.imagen)}
                    alt=""
                    loading="lazy"
                    onError={(event) => { event.currentTarget.src = getImagenUrl(null); }}
                  />
                  <div>
                    <strong>{producto.nombre || 'Producto sin nombre'}</strong>
                    <span>Cantidad: {producto.cantidad}</span>
                  </div>
                  <span className="seguimiento-precio">{formatearPrecio(producto.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="seguimiento-total">
              <span>Total</span>
              <strong>{formatearPrecio(seguimiento.total)}</strong>
            </p>
          </section>

          <aside className="seguimiento-envio" aria-label="Datos del envío">
            {envio ? (
              <>
                <span className="seguimiento-label">Nro. de seguimiento</span>
                <div className="seguimiento-codigo">
                  <strong>{envio.codigo_seguimiento}</strong>
                  <button type="button" onClick={copiarCodigo} aria-label="Copiar número de seguimiento">
                    {copiado ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                  </button>
                </div>
                {copiado && <span className="seguimiento-copiado" role="status">Copiado</span>}

                <dl>
                  <div><dt><FiTruck aria-hidden="true" />Repartidor</dt><dd>{envio.repartidor}</dd></div>
                  <div><dt><FiClock aria-hidden="true" />Creado</dt><dd>{formatearFecha(envio.fecha_creacion)}</dd></div>
                  <div><dt>Pago</dt><dd>{seguimiento.metodo_pago || 'Sin informar'}</dd></div>
                </dl>
              </>
            ) : (
              <>
                <span className="seguimiento-label">Envío</span>
                <p className="seguimiento-sin-envio">
                  {seguimiento.estado === 'Entregado'
                    ? 'Este pedido se entregó sin envío (retiro en el local).'
                    : 'Este pedido todavía no tiene envío.'}
                </p>
                <dl>
                  <div><dt>Pago</dt><dd>{seguimiento.metodo_pago || 'Sin informar'}</dd></div>
                </dl>
              </>
            )}

            <div className="seguimiento-envio-acciones">
              {puedeCrearEnvio && (
                <button type="button" className="envio-btn primary" onClick={() => onCrearEnvio(objetivo)}>
                  <FiPlus aria-hidden="true" />
                  Crear envío
                </button>
              )}
              {seguimiento.estado === 'Enviado' && (
                <button type="button" className="envio-btn primary" onClick={entregar} disabled={marcando}>
                  <FiCheckCircle aria-hidden="true" />
                  {marcando ? 'Guardando...' : 'Marcar como entregado'}
                </button>
              )}
              {editable && (
                <>
                  <button type="button" className="envio-btn" onClick={() => onEditarEnvio(objetivo)}>
                    <FiEdit3 aria-hidden="true" />
                    Editar envío
                  </button>
                  <button type="button" className="envio-btn danger" onClick={() => onEliminarEnvio(objetivo)}>
                    <FiTrash2 aria-hidden="true" />
                    Eliminar envío
                  </button>
                </>
              )}
            </div>
            {errorAccion && <p className="pedido-modal-error">{errorAccion}</p>}
          </aside>
        </div>
      </article>
    </>
  );
}

function EnvioFormModal({ objetivo, onCerrar, onGuardado }) {
  const editando = Boolean(objetivo.id_envio);
  const [direccion, setDireccion] = useState(objetivo.direccion || '');
  // La dirección que ya tiene el pedido se acepta tal cual; si se cambia, tiene que salir de una sugerencia.
  const [direccionValida, setDireccionValida] = useState(true);
  const [nombreComprador, setNombreComprador] = useState(objetivo.nombre_comprador || '');
  const [repartidor, setRepartidor] = useState(objetivo.repartidor || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (event) => {
    event.preventDefault();
    const datos = {
      direccion: direccion.trim(),
      nombre_comprador: nombreComprador.trim(),
      repartidor: repartidor.trim(),
    };

    if (!datos.repartidor) return setError('Ingresá el nombre del repartidor.');
    if (!datos.nombre_comprador) return setError('Ingresá el nombre del comprador.');
    if (!datos.direccion) return setError('Ingresá la dirección del comprador.');
    if (!direccionValida) return setError('Elegí una de las direcciones sugeridas.');

    setGuardando(true);
    setError('');
    try {
      if (editando) {
        await editarEnvio(objetivo.id_envio, datos);
        onGuardado(`Envío ${objetivo.codigo_seguimiento} actualizado.`);
      } else {
        const respuesta = await crearEnvio({ id_pedido: objetivo.id_pedido, ...datos });
        onGuardado(`Envío ${respuesta.data?.codigo_seguimiento || ''} creado. El pedido pasó a "${respuesta.estado || 'Enviado'}".`);
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <div className="pedido-modal-backdrop" role="presentation" onMouseDown={() => !guardando && onCerrar()}>
      <form
        className="pedido-modal envio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="envioFormTitulo"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={guardar}
        noValidate
      >
        <div>
          <span className="pedido-modal-kicker">Pedido #{objetivo.id_pedido}</span>
          <h2 id="envioFormTitulo">{editando ? 'Editar envío' : 'Crear envío'}</h2>
          <p>
            {editando
              ? `Código ${objetivo.codigo_seguimiento}`
              : 'Al crearlo se genera el número de seguimiento y el pedido pasa a "Enviado".'}
          </p>
        </div>

        <div className="envio-modal-campos">
          <CampoDireccion
            label="Dirección del comprador"
            value={direccion}
            valida={direccionValida}
            onChange={(texto, valida) => {
              setDireccion(texto);
              setDireccionValida(valida);
            }}
            disabled={guardando}
          />

          <label className="envio-campo">
            <span>Nombre del comprador</span>
            <input
              type="text"
              value={nombreComprador}
              onChange={(event) => setNombreComprador(event.target.value)}
              maxLength={MAX_TEXTO_ENVIO}
              placeholder="Escribí aquí"
              disabled={guardando}
            />
          </label>

          <label className="envio-campo">
            <span>Nombre del repartidor</span>
            <input
              type="text"
              value={repartidor}
              onChange={(event) => setRepartidor(event.target.value)}
              maxLength={MAX_TEXTO_ENVIO}
              placeholder="Escribí aquí"
              disabled={guardando}
              autoFocus
            />
          </label>
        </div>

        {error && <p className="pedido-modal-error" role="alert">{error}</p>}

        <div className="pedido-modal-actions">
          <button type="button" className="pedido-modal-cancel" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="pedido-modal-save" disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear envío'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EliminarEnvioModal({ objetivo, onCerrar, onEliminado }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  const eliminar = async () => {
    setEliminando(true);
    setError('');
    try {
      const respuesta = await eliminarEnvio(objetivo.id_envio);
      onEliminado(`Envío ${objetivo.codigo_seguimiento} eliminado. El pedido volvió a "${respuesta.estado}".`);
    } catch (err) {
      setError(err.message);
      setEliminando(false);
    }
  };

  return (
    <div className="pedido-modal-backdrop" role="presentation" onMouseDown={() => !eliminando && onCerrar()}>
      <section
        className="pedido-modal envio-modal envio-modal-eliminar"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="eliminarEnvioTitulo"
        aria-describedby="eliminarEnvioTexto"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="envio-modal-icono" aria-hidden="true"><FiTrash2 /></span>
        <h2 id="eliminarEnvioTitulo">¿Seguro que querés eliminar el envío?</h2>
        <p id="eliminarEnvioTexto">
          Se borra el envío <strong>{objetivo.codigo_seguimiento}</strong> del pedido #{objetivo.id_pedido} y no lo vas a poder
          recuperar. El pedido vuelve al estado que tenía antes de enviarse.
        </p>

        {error && <p className="pedido-modal-error" role="alert">{error}</p>}

        <div className="pedido-modal-actions">
          <button type="button" className="pedido-modal-cancel" onClick={onCerrar} disabled={eliminando} autoFocus>
            Volver
          </button>
          <button type="button" className="envio-btn-eliminar" onClick={eliminar} disabled={eliminando}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </section>
    </div>
  );
}

function objetivoDesdeFila(fila) {
  return {
    id_pedido: fila.id_pedido,
    id_envio: fila.id_envio,
    codigo_seguimiento: fila.codigo_seguimiento,
    direccion: fila.direccion,
    nombre_comprador: fila.nombre_comprador,
    repartidor: fila.repartidor,
  };
}

function objetivoDesdeSeguimiento(seguimiento) {
  const { envio, comprador } = seguimiento;
  return {
    id_pedido: seguimiento.id_pedido,
    id_envio: envio?.id_envio ?? null,
    codigo_seguimiento: envio?.codigo_seguimiento ?? null,
    direccion: envio?.direccion || comprador?.direccion || '',
    nombre_comprador: envio?.nombre_comprador || [comprador?.nombre, comprador?.apellido].filter(Boolean).join(' '),
    repartidor: envio?.repartidor || '',
  };
}

function claseDePaso(paso) {
  if (paso.actual && paso.clave !== 'entregado' && paso.clave !== 'confirmado') return 'actual';
  return paso.completado ? 'completado' : 'pendiente';
}

function iconoDePaso(paso) {
  const clase = claseDePaso(paso);
  if (clase === 'actual') return <FiArrowRight />;
  if (clase === 'completado') return <FiCheck />;
  return <FiClock />;
}

function fechaDePaso(paso) {
  if (!paso.completado) return 'Pendiente';
  if (!paso.fecha) return 'Sin fecha';
  return formatearFecha(paso.fecha, paso.solo_fecha);
}

// Las fechas llegan en ISO UTC; se muestran en hora de Argentina.
function formatearFecha(valor, soloFecha = false) {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(soloFecha ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(fecha);
}

function formatearHora(fecha) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(fecha);
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function estadoClass(estado = '') {
  return estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

export default Envios;
