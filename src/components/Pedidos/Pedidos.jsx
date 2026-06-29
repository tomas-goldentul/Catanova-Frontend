import { useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiEdit3,
  FiEye,
  FiFileText,
  FiMapPin,
  FiMoreVertical,
  FiPackage,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import './Pedidos.css';

const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ESTADOS = ['Todos', 'Pendiente', 'Entregado'];
const ORDENES = [
  { value: 'fecha', label: 'Fecha reciente' },
  { value: 'total', label: 'Mayor total' },
  { value: 'estado', label: 'Estado' },
];
const ITEMS_POR_PAGINA = 4;

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [vista, setVista] = useState(() => obtenerVistaInicial());
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [orden, setOrden] = useState('fecha');
  const [pagina, setPagina] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const pedidosDisponibles = pedidos;
  const actualizarPedidos = () => {
    setRefreshKey((actual) => actual + 1);
  };
  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setPagina(1);
    setMenuAbierto('');
    guardarVista(nuevaVista);
  };

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = [...pedidosDisponibles].filter((pedido) => {
      const detalle = normalizarPedido(pedido);
      const coincideEstado = estado === 'Todos' || detalle.estado === estado;
      const campos = [
        detalle.id,
        detalle.comprador,
        detalle.direccion,
        detalle.codigoPostal,
        detalle.localidad,
        detalle.repartidor,
        detalle.tienda,
        resumenProductos(detalle.productos),
      ].join(' ');

      return coincideEstado && (!texto || campos.toLowerCase().includes(texto));
    });

    return filtrados.sort((a, b) => ordenarPedidos(normalizarPedido(a), normalizarPedido(b), orden));
  }, [busqueda, estado, orden, pedidosDisponibles]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pedidosPaginados = pedidosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  const metricas = useMemo(() => {
    const normalizados = pedidosDisponibles.map(normalizarPedido);
    const pendientes = normalizados.filter((pedido) => pedido.estado === 'Pendiente').length;
    const entregados = normalizados.filter((pedido) => pedido.estado === 'Entregado').length;
    const facturado = normalizados.reduce((acc, pedido) => acc + pedido.total, 0);

    return { total: normalizados.length, pendientes, entregados, facturado };
  }, [pedidosDisponibles]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPedidos() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchPedidos(vista, controller.signal);
        setPedidos(extraerListaPedidos(data));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'No se pudieron cargar los pedidos.');
          setPedidos([]);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarPedidos();

    return () => controller.abort();
  }, [vista, refreshKey]);

  return (
    <section className={`pedidos-page ${vista === 'usuario' ? 'buyer-view' : 'seller-view'}`}>
      <div className="pedidos-shell">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-kicker">{vista === 'usuario' ? 'Panel del comprador' : 'Panel del vendedor'}</span>
            <h1>{vista === 'usuario' ? 'Mis compras' : 'Pedidos y envios'}</h1>
            <p>
              {vista === 'usuario'
                ? 'Seguimiento de compras, tiendas, pagos y entregas en una vista compacta.'
                : 'Operacion diaria, entregas, pagos y responsables en una vista compacta.'}
            </p>
          </div>

          <div className="pedidos-header-actions">
            <button type="button" className="pedidos-secondary" onClick={actualizarPedidos}>
              <FiRefreshCw aria-hidden="true" />
              Actualizar
            </button>
            {vista === 'tienda' && (
              <button type="button" className="pedidos-secondary">
                <FiPrinter aria-hidden="true" />
                Imprimir
              </button>
            )}
          </div>
        </header>

        <div className="pedidos-perspective-panel">
          <div className="pedidos-perspective-copy">
            <span>Punto de vista</span>
            <strong>{vista === 'usuario' ? 'Comprador' : 'Vendedor'}</strong>
          </div>
          <div className="pedidos-view-switch" aria-label="Elegir punto de vista">
            <button
              type="button"
              className={vista === 'usuario' ? 'active' : ''}
              onClick={() => cambiarVista('usuario')}
            >
              <FiShoppingBag aria-hidden="true" />
              Comprador
            </button>
            <button
              type="button"
              className={vista === 'tienda' ? 'active' : ''}
              onClick={() => cambiarVista('tienda')}
            >
              <FiTruck aria-hidden="true" />
              Vendedor
            </button>
          </div>
        </div>

        <div className="pedidos-summary" aria-label="Resumen de pedidos">
          <KpiCard label={vista === 'usuario' ? 'Compras realizadas' : 'Pedidos activos'} value={metricas.total} tone="neutral" />
          <KpiCard label="Pendientes" value={metricas.pendientes} tone="warning" />
          <KpiCard label="Entregados" value={metricas.entregados} tone="info" />
          <KpiCard label={vista === 'usuario' ? 'Total comprado' : 'Facturado'} value={formatearPrecio(metricas.facturado)} tone="success" />
        </div>

        <div className="pedidos-control-panel">
          <label className="pedidos-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
              placeholder={vista === 'usuario' ? 'Buscar direccion, tienda, producto o CP' : 'Buscar direccion, cliente, repartidor o CP'}
            />
          </label>

          <div className="pedidos-status-filter" aria-label="Filtrar por estado">
            {ESTADOS.map((option) => (
              <button
                type="button"
                key={option}
                className={estado === option ? 'active' : ''}
                onClick={() => {
                  setEstado(option);
                  setPagina(1);
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="pedidos-sort">
            <span>Ordenar</span>
            <select value={orden} onChange={(event) => setOrden(event.target.value)}>
              {ORDENES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>
        </div>

        {loading && <p className="pedidos-message">Cargando pedidos...</p>}

        {error && <p className="pedidos-message error">{error}</p>}

        {!loading && !error && pedidosFiltrados.length === 0 && (
          <p className="pedidos-message">No hay pedidos que coincidan con la busqueda.</p>
        )}

        <div className="pedidos-list">
          {pedidosPaginados.map((pedido) => {
            const detalle = normalizarPedido(pedido);
            const menuId = `menu-${detalle.id}`;
            const tituloPedido = vista === 'usuario' ? detalle.tienda : detalle.direccion;

            return (
              <article className="pedido-card" key={detalle.id}>
                <div className="pedido-card-main">
                  <div className="pedido-topline">
                    <span className="pedido-id">{detalle.id}</span>
                    <span className={`pedido-priority ${priorityClass(detalle.prioridad)}`}>
                      {detalle.prioridad}
                    </span>
                    <time dateTime={detalle.fecha}>{formatearFecha(detalle.fecha)}</time>
                  </div>

                  <div className="pedido-title-block">
                    <h2>{tituloPedido}</h2>
                    <span className={`pedido-status ${estadoClass(detalle.estado)}`}>
                      {estadoLabel(detalle.estado)}
                    </span>
                  </div>

                  <p className="pedido-products">{resumenProductos(detalle.productos)}</p>

                  <div className="pedido-people">
                    <PersonPill
                      icon={vista === 'usuario' ? <FiPackage aria-hidden="true" /> : <FiUsers aria-hidden="true" />}
                      label={vista === 'usuario' ? `Pedido ${detalle.id}` : detalle.comprador}
                    />
                    <PersonPill icon={<FiTruck aria-hidden="true" />} label={detalle.repartidor} muted={detalle.repartidor === 'Sin asignar'} />
                  </div>

                  <ProgressBar estado={detalle.estado} />
                </div>

                <div className="pedido-meta">
                  <MetaItem
                    icon={<FiMapPin aria-hidden="true" />}
                    label={vista === 'usuario' ? 'Destino' : 'Zona'}
                    value={vista === 'usuario' ? detalle.direccion : `${detalle.localidad} · ${detalle.codigoPostal}`}
                  />
                  <MetaItem icon={<FiClock aria-hidden="true" />} label={vista === 'usuario' ? 'Llega' : 'Entrega estimada'} value={detalle.eta} />
                  <MetaItem icon={<FiCreditCard aria-hidden="true" />} label="Pago" value={detalle.pago} accent={detalle.pago === 'Pagado'} />
                </div>

                <div className="pedido-total-panel">
                  <span>Total</span>
                  <strong>{formatearPrecio(detalle.total)}</strong>
                  <button type="button" className="pedido-view">
                    <FiEye aria-hidden="true" />
                    {vista === 'usuario' ? 'Ver compra' : 'Ver detalle'}
                  </button>
                </div>

                <div className="pedido-menu-wrap">
                  <button
                    type="button"
                    className="pedido-menu-trigger"
                    aria-label="Acciones del pedido"
                    aria-expanded={menuAbierto === menuId}
                    onClick={() => setMenuAbierto((actual) => (actual === menuId ? '' : menuId))}
                  >
                    <FiMoreVertical aria-hidden="true" />
                  </button>

                  {menuAbierto === menuId && (
                    <div className="pedido-menu">
                      {vista === 'tienda' && (
                        <>
                          <button type="button">
                            <FiEdit3 aria-hidden="true" />
                            Editar pedido
                          </button>
                          <button type="button">
                            <FiUserCheck aria-hidden="true" />
                            Asignar repartidor
                          </button>
                        </>
                      )}
                      <button type="button">
                        <FiCheckCircle aria-hidden="true" />
                        {vista === 'usuario' ? 'Consultar estado' : 'Cambiar estado'}
                      </button>
                      <button type="button">
                        <FiFileText aria-hidden="true" />
                        {vista === 'usuario' ? 'Ver comprobante' : 'Imprimir etiqueta'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {pedidosFiltrados.length > 0 && (
          <nav className="pedidos-pagination" aria-label="Paginacion">
            <button
              type="button"
              aria-label="Pagina anterior"
              disabled={paginaActual === 1}
              onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
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
              aria-label="Pagina siguiente"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

function KpiCard({ label, value, tone }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PersonPill({ icon, label, muted = false }) {
  return (
    <span className={muted ? 'muted' : ''}>
      <span className="person-avatar">{iniciales(label)}</span>
      {icon}
      {label}
    </span>
  );
}

function MetaItem({ icon, label, value, accent = false }) {
  return (
    <div className={accent ? 'accent' : ''}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ estado }) {
  const steps = ['Pendiente', 'Entregado'];
  const activeIndex = Math.max(0, steps.indexOf(estado));

  return (
    <div className="pedido-progress" aria-label={`Progreso ${estadoLabel(estado)}`}>
      {steps.map((step, index) => (
        <span
          key={step}
          className={index <= activeIndex ? 'active' : ''}
          title={estadoLabel(step)}
        />
      ))}
    </div>
  );
}

async function fetchPedidos(vista, signal) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  if (vista === 'usuario') {
    return fetchPedidosUsuario(headers, signal);
  }

  return fetchPedidosTienda(headers, signal);
}

async function fetchPedidosTienda(headers, signal) {
  const tiendaId = obtenerTiendaId();
  const candidates = ['/pedidos/tienda', '/pedidos/store'];

  if (tiendaId) {
    candidates.push(
      `/pedidos/tienda/${tiendaId}`,
      `/pedidos/get/tienda/${tiendaId}`,
      `/pedidos/getByTienda/${tiendaId}`,
      `/pedidos/store/${tiendaId}`,
      `/tiendas/${tiendaId}/pedidos`,
    );
  }

  for (const path of candidates) {
    try {
      return await requestPedidos(path, headers, signal);
    } catch (err) {
      if (signal.aborted || ![400, 401, 403, 404, 405].includes(err.status)) {
        throw err;
      }
    }
  }

  const data = await requestPedidos('/pedidos/getAll', headers, signal);
  const lista = extraerListaPedidos(data);

  return tiendaId ? lista.filter((pedido) => pedidoPerteneceATienda(pedido, tiendaId)) : lista;
}

async function fetchPedidosUsuario(headers, signal) {
  const usuarioId = obtenerUsuarioId();
  const candidates = [
    '/pedidos/mis-pedidos',
    '/pedidos/mios',
    '/pedidos/usuario',
    '/pedidos/user',
  ];

  if (usuarioId) {
    candidates.push(
      `/pedidos/usuario/${usuarioId}`,
      `/pedidos/get/usuario/${usuarioId}`,
      `/pedidos/getByUsuario/${usuarioId}`,
      `/pedidos/user/${usuarioId}`,
      `/usuarios/${usuarioId}/pedidos`,
    );
  }

  let lastError;

  for (const path of candidates) {
    try {
      return await requestPedidos(path, headers, signal);
    } catch (err) {
      lastError = err;
      if (signal.aborted || ![400, 401, 403, 404, 405].includes(err.status)) {
        throw err;
      }
    }
  }

  const data = await requestPedidos('/pedidos/getAll', headers, signal);
  const lista = extraerListaPedidos(data);

  if (!usuarioId) {
    throw lastError || new Error('Inicia sesion para ver tus pedidos.');
  }

  return lista.filter((pedido) => pedidoPerteneceAUsuario(pedido, usuarioId));
}

async function requestPedidos(path, headers, signal) {
  const response = await fetch(`${API_URL}${path}`, { headers, signal });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function obtenerUsuarioId() {
  const fuente = obtenerSesionActual();

  return (
    fuente.id ||
    fuente._id ||
    fuente.id_usuario ||
    fuente.idUsuario ||
    fuente.usuarioId ||
    fuente.userId ||
    fuente.sub ||
    ''
  );
}

function obtenerTiendaId() {
  const fuente = obtenerSesionActual();

  return (
    fuente.id_tienda ||
    fuente.idTienda ||
    fuente.tiendaId ||
    fuente.storeId ||
    fuente.tienda?.id ||
    fuente.tienda?._id ||
    fuente.store?.id ||
    localStorage.getItem('id_tienda') ||
    ''
  );
}

function obtenerVistaDesdeSesion() {
  return obtenerTipoSesion() === 'vendedor' ? 'tienda' : 'usuario';
}

function obtenerVistaInicial() {
  const guardada = localStorage.getItem('pedidos_vista');
  if (guardada === 'usuario' || guardada === 'tienda') return guardada;
  return obtenerVistaDesdeSesion();
}

function guardarVista(vista) {
  localStorage.setItem('pedidos_vista', vista);
}

function obtenerTipoSesion() {
  const fuente = obtenerSesionActual();
  const valores = [
    fuente.rol,
    fuente.role,
    fuente.tipo,
    fuente.tipoUsuario,
    fuente.tipo_usuario,
    fuente.perfil,
    fuente.cuenta,
    fuente.accountType,
  ]
    .filter(Boolean)
    .map((valor) => String(valor).toLowerCase());

  if (
    fuente.esVendedor ||
    fuente.isSeller ||
    fuente.vendedor ||
    fuente.tienda ||
    obtenerTiendaIdDesdeFuente(fuente) ||
    valores.some((valor) => ['vendedor', 'seller', 'tienda', 'store', 'comercio', 'admin_tienda'].includes(valor))
  ) {
    return 'vendedor';
  }

  if (
    fuente.esComprador ||
    fuente.isBuyer ||
    valores.some((valor) => ['comprador', 'buyer', 'cliente', 'customer', 'usuario', 'user'].includes(valor))
  ) {
    return 'comprador';
  }

  return 'desconocido';
}

function obtenerSesionActual() {
  return leerJsonLocalStorage('user') || leerJsonLocalStorage('usuario') || decodificarJwt(localStorage.getItem('token')) || {};
}

function obtenerTiendaIdDesdeFuente(fuente) {
  return fuente.id_tienda || fuente.idTienda || fuente.tiendaId || fuente.storeId || fuente.tienda?.id || fuente.tienda?._id || fuente.store?.id || '';
}

function leerJsonLocalStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function decodificarJwt(token) {
  if (!token || !token.includes('.')) return null;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function pedidoPerteneceAUsuario(pedido, usuarioId) {
  const id = String(usuarioId);
  const comprador = pedido.cliente || pedido.comprador || pedido.usuario || {};
  const candidatos = [
    pedido.id_usuario,
    pedido.usuarioId,
    pedido.userId,
    pedido.clienteId,
    pedido.id_cliente,
    comprador.id,
    comprador._id,
    comprador.id_usuario,
    comprador.usuarioId,
  ];

  return candidatos.some((value) => value != null && String(value) === id);
}

function pedidoPerteneceATienda(pedido, tiendaId) {
  const id = String(tiendaId);
  const tienda = pedido.tienda || pedido.vendedor || pedido.store || {};
  const candidatos = [
    pedido.id_tienda,
    pedido.tiendaId,
    pedido.storeId,
    pedido.vendedorId,
    pedido.id_vendedor,
    tienda.id,
    tienda._id,
    tienda.id_tienda,
    tienda.tiendaId,
  ];

  return candidatos.some((value) => value != null && String(value) === id);
}

function extraerListaPedidos(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.pedidos)) return data.pedidos;
  if (Array.isArray(data?.envios)) return data.envios;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizarPedido(pedido) {
  const productosBase = pedido.productos || pedido.items || pedido.detalle || [];
  const productos = Array.isArray(productosBase) ? productosBase : [];
  const comprador = pedido.cliente || pedido.comprador || pedido.usuario || {};
  const repartidor = pedido.repartidor || pedido.delivery || pedido.cadete || {};
  const tienda = pedido.tienda || pedido.vendedor || pedido.store || {};
  const direccion = pedido.direccion || pedido.direccionEnvio || pedido.shippingAddress || comprador.direccion || {};

  return {
    id: pedido.id || pedido._id || 'Sin ID',
    direccion: normalizarDireccion(direccion),
    comprador: comprador.nombre || comprador.name || pedido.clienteNombre || pedido.compradorNombre || 'Sin datos',
    tienda: tienda.nombre || tienda.name || pedido.tiendaNombre || pedido.nombreTienda || pedido.vendedor?.nombre || 'Tienda sin datos',
    repartidor: repartidor.nombre || repartidor.name || pedido.repartidorNombre || pedido.vendedor?.nombre || 'Sin asignar',
    codigoPostal: pedido.codigoPostal || pedido.cp || direccion.codigoPostal || direccion.cp || comprador.codigoPostal || 'Sin CP',
    localidad: pedido.localidad || pedido.ciudad || direccion.localidad || direccion.ciudad || comprador.localidad || 'Sin localidad',
    estado: normalizarEstado(pedido),
    total: normalizarPrecio(pedido.precio_total ?? pedido.total ?? pedido.totalPedido ?? pedido.montoTotal ?? pedido.amount ?? 0),
    productos,
    fecha: pedido.fecha || pedido.createdAt || '',
    prioridad: pedido.prioridad || pedido.priority || 'Sin prioridad',
    pago: pedido.metodo_pago || pedido.pago || pedido.estadoPago || pedido.paymentStatus || 'Sin informar',
    eta: pedido.eta || pedido.entregaEstimada || pedido.estimatedDelivery || 'Sin informar',
  };
}

function normalizarEstado(pedido) {
  if (typeof pedido.entregado === 'boolean') {
    return pedido.entregado ? 'Entregado' : 'Pendiente';
  }

  if (pedido.entregado === 1 || pedido.entregado === '1' || pedido.entregado === 'true') {
    return 'Entregado';
  }

  if (pedido.entregado === 0 || pedido.entregado === '0' || pedido.entregado === 'false') {
    return 'Pendiente';
  }

  return pedido.estado || 'Pendiente';
}

function normalizarPrecio(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') return Number(valor.replace(',', '.')) || 0;
  return 0;
}

function normalizarDireccion(direccion) {
  if (!direccion) return 'Direccion sin cargar';
  if (typeof direccion === 'string') return direccion;

  const calle = direccion.calle || direccion.street || direccion.direccion;
  const numero = direccion.numero || direccion.number || '';
  const texto = [calle, numero].filter(Boolean).join(' ');

  return texto || 'Direccion sin cargar';
}

function ordenarPedidos(a, b, tipo) {
  if (tipo === 'total') return b.total - a.total;
  if (tipo === 'estado') return estadoRank(a.estado) - estadoRank(b.estado);

  const fechaA = new Date(a.fecha || 0).getTime();
  const fechaB = new Date(b.fecha || 0).getTime();
  return fechaB - fechaA;
}

function estadoRank(estado) {
  return ['Pendiente', 'Preparando', 'Enviado', 'Entregado'].indexOf(estado);
}

function resumenProductos(productos) {
  if (!productos.length) return 'Sin productos cargados';

  return productos
    .slice(0, 3)
    .map((producto) => {
      const nombre = producto.nombre || producto.producto?.nombre || 'Producto';
      const cantidad = producto.cantidad || 1;
      return `${nombre} x${cantidad}`;
    })
    .join(' · ');
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(valor);
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(valor));
}

function estadoLabel(estado) {
  return estado;
}

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function estadoClass(estado) {
  return estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function priorityClass(prioridad) {
  return prioridad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

export default Pedidos;
