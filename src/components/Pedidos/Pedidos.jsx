import { useEffect, useMemo, useState } from 'react';
import './Pedidos.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ESTADOS = ['Todos', 'Pendiente', 'Preparando', 'Enviado', 'Entregado'];

function getStoredVendedorId() {
  const directId = localStorage.getItem('vendedorId');
  if (directId) return directId;

  const user = localStorage.getItem('user') || localStorage.getItem('usuario');
  if (!user) return '';

  try {
    const parsedUser = JSON.parse(user);
    return parsedUser.vendedorId || parsedUser.id || '';
  } catch {
    return '';
  }
}

function Pedidos() {
  const [vendedorId, setVendedorId] = useState(getStoredVendedorId);
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return [...pedidos].filter((pedido) => {
      const estadoPedido = pedido.estado || 'Pendiente';
      const comprador = pedido.cliente?.nombre || pedido.comprador || pedido.clienteNombre || '';
      const direccion = pedido.direccion || pedido.direccionEnvio || pedido.cliente?.direccion || '';
      const codigoPostal = pedido.codigoPostal || pedido.cp || pedido.cliente?.codigoPostal || '';
      const coincideEstado = estado === 'Todos' || estadoPedido === estado;
      const coincideTexto = !texto || `${comprador} ${direccion} ${codigoPostal}`.toLowerCase().includes(texto);

      return coincideEstado && coincideTexto;
    }).sort((a, b) => {
      const fechaA = new Date(a.fecha || a.createdAt || 0).getTime();
      const fechaB = new Date(b.fecha || b.createdAt || 0).getTime();
      return fechaB - fechaA;
    });
  }, [busqueda, estado, pedidos]);

  useEffect(() => {
    if (!vendedorId) return;

    const controller = new AbortController();

    async function cargarPedidos() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/pedidos/vendedor/${vendedorId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudieron cargar los pedidos del vendedor.');
        }

        const data = await response.json();
        setPedidos(Array.isArray(data) ? data : data.pedidos || data.envios || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setPedidos([]);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarPedidos();

    return () => controller.abort();
  }, [vendedorId]);

  return (
    <section className="pedidos-page">
      <div className="pedidos-shell">
        <header className="pedidos-topbar">
          <div>
            <h1>Envíos</h1>
            <p>Total envíos: {pedidosFiltrados.length}</p>
          </div>

          <div className="pedidos-tools">
            <label className="pedidos-search">
              <span>⌕</span>
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar un envío"
              />
            </label>

            <select value={estado} onChange={(event) => setEstado(event.target.value)}>
              {ESTADOS.map((option) => (
                <option key={option} value={option}>
                  {option === 'Todos' ? 'Filtrar' : option}
                </option>
              ))}
            </select>

            <button type="button" className="pedidos-create">
              Crear envío
              <span>+</span>
            </button>
          </div>
        </header>

        <label className="pedidos-vendedor">
          Vendedor
          <input
            type="text"
            value={vendedorId}
            onChange={(event) => setVendedorId(event.target.value)}
            placeholder="ID del vendedor"
          />
        </label>

        {!vendedorId && (
          <p className="pedidos-message">Ingresá un ID de vendedor para ver sus pedidos.</p>
        )}

        {loading && <p className="pedidos-message">Cargando pedidos...</p>}

        {error && <p className="pedidos-message error">{error}</p>}

        {!loading && vendedorId && !error && pedidosFiltrados.length === 0 && (
          <p className="pedidos-message">No hay pedidos que coincidan con la búsqueda.</p>
        )}

        <div className="pedidos-list">
          {pedidosFiltrados.map((pedido) => {
          const productos = pedido.productos || pedido.items || [];
          const id = pedido.id || pedido._id;
          const direccion = pedido.direccion || pedido.direccionEnvio || pedido.cliente?.direccion || 'Dirección sin cargar';
          const comprador = pedido.cliente?.nombre || pedido.comprador || pedido.clienteNombre || 'Sin datos';
          const repartidor = pedido.repartidor?.nombre || pedido.repartidor || pedido.vendedor?.nombre || 'Sin asignar';
          const codigoPostal = pedido.codigoPostal || pedido.cp || pedido.cliente?.codigoPostal || 'Sin CP';
          const localidad = pedido.localidad || pedido.ciudad || pedido.cliente?.localidad || 'Sin localidad';
          const estadoPedido = pedido.estado || 'Pendiente';
          const total = pedido.total || pedido.totalPedido || 0;

          return (
            <article className="pedido-card" key={id}>
              <div className="pedido-main">
                <div>
                  <div className="pedido-title-row">
                    <h2>{direccion}</h2>
                    <span className="pedido-status">{estadoPedido}</span>
                  </div>

                  <p>{resumenProductos(productos)}</p>
                  <p>Comprador: {comprador}</p>
                  <p>Repartidor: {repartidor}</p>
                </div>
              </div>

              <div className="pedido-address">
                <strong>Código Postal:</strong>
                <span>{codigoPostal}</span>
                <strong>Localidad:</strong>
                <span>{localidad}</span>
                <strong>Total:</strong>
                <span>${total}</span>
              </div>

              <div className="pedido-actions">
                <button type="button">Ver pedido</button>
                <button type="button" className="danger">Borrar pedido</button>
              </div>
            </article>
          );
          })}
        </div>

        {pedidosFiltrados.length > 0 && (
          <div className="pedidos-pagination" aria-label="Paginación">
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Más páginas"></button>
          </div>
        )}
      </div>
    </section>
  );
}

function resumenProductos(productos) {
  if (!productos.length) return 'Sin productos cargados';

  return productos
    .slice(0, 3)
    .map((producto) => {
      const nombre = producto.nombre || producto.producto?.nombre || 'Producto';
      const cantidad = producto.cantidad || 1;
      return `${nombre}: ${cantidad} unidad${cantidad === 1 ? '' : 'es'}`;
    })
    .join('; ');
}

export default Pedidos;
