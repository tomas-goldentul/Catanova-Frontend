function Ventas({ onVolver }) {
  const idTienda = Number(localStorage.getItem('id_tienda')) || null;

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const ventasDeLaTienda = Array.isArray(ventas)
    ? ventas.filter((venta) => Number(venta?.id_tienda ?? venta?.tienda_id ?? 0) === Number(idTienda))
    : [];

  // Cargar ventas
  useEffect(() => {
    if (!idTienda) {
      setError('No se encontró la tienda. Por favor iniciá sesión nuevamente.');
      return;
    }

    let montado = true;
    async function cargar() {
      setLoading(true);
      setError('');
      try {
        const data = await getVentasPorTienda(idTienda);
        if (montado) setVentas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (montado) setError(err.message || 'No se pudieron cargar las ventas.');
      } finally {
        if (montado) setLoading(false);
      }
    }
    cargar();
    return () => { montado = false; };
  }, [idTienda, refreshKey]);

  // KPIs calculados
  const totalVentas = ventasDeLaTienda.length;
  const facturadoTotal = ventasDeLaTienda.reduce((acc, v) => acc + Number(v.total ?? 0), 0);
  const unidadesVendidas = ventasDeLaTienda.reduce((acc, v) => acc + Number(v.cantidad ?? 0), 0);

  const handleVentaRegistrada = (nuevaVenta, nombreProducto, nombreCliente = null) => {
    const filaOptimista = {
      ...nuevaVenta,
      id_tienda: idTienda,
      nombre_producto: nombreProducto,
      ...(nombreCliente && { nombre_cliente: nombreCliente }),
    };
    setVentas((prev) => [filaOptimista, ...prev]);
    setMostrarModal(false);
    setToastMsg(`Venta de "${nombreProducto}" registrada correctamente`);
  };

  return (
    <section className="ventas-page">
      {toastMsg && (
        <ToastExito mensaje={toastMsg} onClose={() => setToastMsg('')} />
      )}

      <div className="ventas-shell">
        {/* Header */}
        <header className="ventas-header">
          <div className="ventas-heading">
            {onVolver && (
              <button type="button" className="ventas-back" onClick={onVolver}>
                <IconBack />
                Volver
              </button>
            )}
            <span className="ventas-kicker">Panel del vendedor</span>
            <h1>Ventas</h1>
            <p>Historial de ventas y registro de nuevas transacciones.</p>
          </div>

          <div className="ventas-header-actions">
            <button
              type="button"
              className="ventas-btn ventas-btn--secondary"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              <IconRefresh />
              Actualizar
            </button>
            <button
              type="button"
              className="ventas-btn ventas-btn--primary"
              onClick={() => setMostrarModal(true)}
              disabled={!idTienda}
            >
              <IconPlus />
              Registrar venta
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="ventas-kpis" aria-label="Resumen de ventas">
          <KpiCard label="Total de ventas" value={totalVentas} accent="#059669" />
          <KpiCard label="Unidades vendidas" value={unidadesVendidas} accent="#0369a1" />
          <KpiCard label="Facturado" value={formatPrecio(facturadoTotal)} accent="#7c3aed" />
        </div>

        {/* Estados */}
        {loading && <p className="ventas-msg">Cargando ventas...</p>}
        {error && <p className="ventas-msg ventas-msg--error">{error}</p>}

        {/* Tabla de historial */}
        {!loading && !error && ventasDeLaTienda.length === 0 && (
          <div className="ventas-empty">
            <IconEmpty />
            <p>No hay ventas registradas todavía.</p>
            <button
              type="button"
              className="ventas-btn ventas-btn--primary"
              onClick={() => setMostrarModal(true)}
            >
              <IconPlus />
              Registrar primera venta
            </button>
          </div>
        )}

        {!loading && !error && ventasDeLaTienda.length > 0 && (
          <div className="ventas-table-wrap">
            <table className="ventas-table" aria-label="Historial de ventas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Cantidad</th>
                  <th>Precio unit.</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {ventasDeLaTienda.map((v, idx) => {
                  const clienteVenta = obtenerClienteVenta(v);

                  return (
                    <tr key={v.id_venta ?? idx}>
                      <td className="ventas-td--id">
                        {v.id_venta ? `#${v.id_venta}` : '—'}
                      </td>
                      <td className="ventas-td--nombre">{v.nombre_producto || '—'}</td>
                      <td className="ventas-td--cliente">
                        {clienteVenta ? (
                          <span className="ventas-badge ventas-badge--cliente">{clienteVenta}</span>
                        ) : (
                          <span className="ventas-td--sin-cliente">Presencial</span>
                        )}
                      </td>
                      <td className="ventas-td--num">{v.cantidad}</td>
                      <td className="ventas-td--num">{formatPrecio(v.precio_unitario)}</td>
                      <td className="ventas-td--total">{formatPrecio(v.total)}</td>
                      <td>
                        <span className="ventas-badge ventas-badge--metodo">
                          {v.metodo_pago || 'Sin especificar'}
                        </span>
                      </td>
                      <td className="ventas-td--fecha">{formatFecha(v.fecha)}</td>
                      <td className="ventas-td--hora">{formatHora(v.fecha)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && idTienda && (
        <RegistrarVentaModal
          idTienda={idTienda}
          onVentaRegistrada={handleVentaRegistrada}
          onCancelar={() => setMostrarModal(false)}
        />
      )}
    </section>
  );
}

export default Ventas;