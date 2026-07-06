import { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartLine, FaEye, FaDollarSign, FaHeart, FaTag, FaTrash, FaPen, FaSyncAlt, FaClipboardList, FaPlus, FaTimes } from 'react-icons/fa';
import Header from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { getProductoPorId, actualizarProducto, borrarProducto, agregarStock, editarStock } from '../../api/productos';
import { obtenerEtiquetasProducto, agregarEtiqueta, borrarEtiqueta } from '../../api/etiquetas';
import {
  getVentasUltimos7Dias,
  getVentasUltimoMes,
  getVentasUltimoAno,
  getVentasUltimos2Anios,
} from '../../api/ventas';
import {
  getFavoritos,
} from '../../api/favoritos';
import {
  getVistas,
} from '../../api/vistas';
import './Producto.css';

function Producto({ productoId, onVolver, onIrAMenuPrincipal }) {
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [periodo, setPeriodo] = useState('mes');
    const [ventasHistoricas, setVentasHistoricas] = useState({ ventas: '-', ganancias: '-', vistas: '-', favoritos: '-' });
    const [vistaPanel, setVistaPanel] = useState(null);
    const [formProducto, setFormProducto] = useState(null);
    const [stockCantidad, setStockCantidad] = useState(1);
    const [stockNuevo, setStockNuevo] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [etiquetas, setEtiquetas] = useState([]);
    const [etiquetaActiva, setEtiquetaActiva] = useState('');
    const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');

    useEffect(() => {
        async function loadProducto() {
            if (!productoId) {
                setError('Seleccioná un producto desde el catálogo');
                setLoading(false);
                return;
            }

            try {
                const item = await getProductoPorId(productoId);
                const precio = Number(item.precio ?? item.precioUnitario ?? 0);
                const ventas = Number(item.ventas ?? 0);

                setProducto({
                    id: item.id_producto ?? item.id,
                    nombre: item.nombre ?? item.producto ?? 'Producto',
                    tipo: item.tipo ?? item.categoria ?? 'Ropa',
                    precio,
                    stock: Number(item.stock ?? 0),
                    colores: Number(item.colores ?? 1),
                    imagen: item.imagen ?? item.foto ?? 'https://i.imgur.com/6vxWj7O.png',
                    ventas,
                    vistas: Number(item.vistas ?? 0),
                    favoritos: Number(item.favoritos ?? 0),
                    ganancias: Number(item.ganancias ?? precio * ventas),
                });
            } catch (err) {
                setError(err.message || 'Error al cargar el producto');
            } finally {
                setLoading(false);
            }
        }

        loadProducto();
    }, [productoId]);

    useEffect(() => {
        if (!producto) return;

        setFormProducto({
            nombre: producto.nombre,
            tipo: producto.tipo,
            precio: producto.precio,
            imagen: producto.imagen,
        });
        setStockNuevo(producto.stock);
    }, [producto]);

    useEffect(() => {
        if (!producto?.id) return;

        async function loadEtiquetas() {
            try {
                const data = await obtenerEtiquetasProducto(producto.id);
                const lista = Array.isArray(data)
                    ? data.map((item) => ({
                          id: item.id ?? item.id_etiqueta ?? item.id_etiqueta_producto,
                          nombre: item.nombre ?? item.etiqueta ?? item.label ?? '',
                      }))
                    : [];
                setEtiquetas(lista);
                if (lista.length > 0) {
                    setEtiquetaActiva(lista[0].nombre);
                }
            } catch (err) {
                console.error(err);
                setEtiquetas([]);
            }
        }

        loadEtiquetas();
    }, [producto?.id]);

    const normalizeVenta = (venta) => {
        const cantidad = Number(venta.cantidad ?? venta.cantidad_vendida ?? venta.cantidadVendida ?? 1);
        const precio = Number(venta.precio ?? venta.precio_unitario ?? venta.precioUnitario ?? 0);
        const total = Number(venta.total ?? venta.importe ?? venta.monto ?? (precio * cantidad));
        const productoId = venta.id_producto ?? venta.producto_id ?? venta.productoId ?? venta.id_producto_venta ?? venta.id;

        return { cantidad, precio, total, productoId, fecha: new Date(venta.fecha ?? venta.createdAt ?? venta.fecha_venta ?? null) };
    };

    const normalizeContador = (registro) => {
        const cantidad = Number(registro.cantidad ?? registro.total ?? registro.cantidad_vistas ?? registro.cantidad_favoritos ?? 1);
        const productoId = registro.id_producto ?? registro.producto_id ?? registro.productoId ?? registro.idProducto ?? registro.id;
        return { cantidad, productoId, fecha: new Date(registro.fecha ?? registro.createdAt ?? registro.fecha_vista ?? registro.fecha_favorito ?? null) };
    };

    const esRegistroDelProducto = (registro, idProducto) => {
        if (!registro || !idProducto) return false;
        return String(registro.productoId) === String(idProducto);
    };

    const extraerLista = (respuesta) => {
        if (Array.isArray(respuesta)) return respuesta;
        if (Array.isArray(respuesta?.data)) return respuesta.data;
        if (respuesta && typeof respuesta === 'object') return [respuesta];
        return [];
    };

    const estaEnPeriodo = (fecha, periodoSeleccionado) => {
        if (!fecha || Number.isNaN(fecha.getTime())) return false;

        const ahora = new Date();
        const limite = new Date(ahora);

        if (periodoSeleccionado === '7dias') {
            limite.setDate(ahora.getDate() - 7);
        } else if (periodoSeleccionado === 'mes') {
            limite.setMonth(ahora.getMonth() - 1);
        } else if (periodoSeleccionado === '1anio') {
            limite.setFullYear(ahora.getFullYear() - 1);
        } else if (periodoSeleccionado === '2anios') {
            limite.setFullYear(ahora.getFullYear() - 2);
        } else {
            return true;
        }

        return fecha >= limite;
    };

    const cargarVentasHistoricas = async () => {
        if (!producto) return;

        setCargandoVentas(true);
        try {
            let ventas = [];
            let vistas = [];
            let favoritos = [];

            if (periodo === '7dias') {
                ventas = await getVentasUltimos7Dias();
            } else if (periodo === 'mes') {
                ventas = await getVentasUltimoMes();
            } else if (periodo === '1anio') {
                ventas = await getVentasUltimoAno();
            } else if (periodo === '2anios') {
                ventas = await getVentasUltimos2Anios();
            }

            const [vistasRespuesta, favoritosRespuesta] = await Promise.all([
                getVistas(),
                getFavoritos(),
            ]);

            const ventasFiltradas = extraerLista(ventas).map(normalizeVenta).filter(v => esRegistroDelProducto(v, producto.id));
            const vistasFiltradas = extraerLista(vistasRespuesta)
                .map(normalizeContador)
                .filter(v => esRegistroDelProducto(v, producto.id) && estaEnPeriodo(v.fecha, periodo));
            const favoritosFiltradas = extraerLista(favoritosRespuesta)
                .map(normalizeContador)
                .filter(v => esRegistroDelProducto(v, producto.id) && estaEnPeriodo(v.fecha, periodo));

            const ventasSum = ventasFiltradas.reduce((sum, item) => sum + item.cantidad, 0);
            const gananciasSum = ventasFiltradas.reduce((sum, item) => sum + item.total, 0);
            const vistasSum = vistasFiltradas.reduce((sum, item) => sum + item.cantidad, 0);
            const favoritosSum = favoritosFiltradas.reduce((sum, item) => sum + item.cantidad, 0);

            setVentasHistoricas({
                ventas: ventasSum,
                ganancias: gananciasSum,
                vistas: vistasSum,
                favoritos: favoritosSum,
            });
        } catch (err) {
            setVentasHistoricas({ ventas: '-', ganancias: '-', vistas: producto.vistas ?? '-', favoritos: producto.favoritos ?? '-' });
        } finally {
            setCargandoVentas(false);
        }
    };

    useEffect(() => {
        cargarVentasHistoricas();
    }, [producto, periodo]);

    const periodos = [
        { id: '7dias', label: 'Últimos 7 días' },
        { id: 'mes', label: 'Último mes' },
        { id: '1anio', label: '1 año' },
        { id: '2anios', label: '2 años' },
    ];

    const handleAbrirPanel = (panel) => {
        setVistaPanel(panel);
        if (panel === 'modificarStock') {
            setStockNuevo(producto?.stock ?? 0);
        }
        if (panel === 'agregarStock') {
            setStockCantidad(1);
        }
    };

    const handleGuardarProducto = async () => {
        if (!formProducto || !producto) return;

        const tiendaIdRaw = localStorage.getItem('id_tienda');
        const tiendaId = Number(tiendaIdRaw);
        const tiendaIdFinal = tiendaIdRaw && !Number.isNaN(tiendaId) ? tiendaId : 1;

        const actualizacion = {
            nombre: formProducto.nombre,
            precio: Number(formProducto.precio) || 0,
            imagen: formProducto.imagen,
            stock: Number(producto.stock),
            activo: true,
            id_tienda: tiendaIdFinal,
        };

        try {
            setGuardando(true);
            await actualizarProducto(producto.id, actualizacion);
            setProducto((prev) => ({
                ...prev,
                ...actualizacion,
            }));
            setVistaPanel(null);
        } catch (err) {
            setError(err.message || 'Error al guardar el producto');
        } finally {
            setGuardando(false);
        }
    };

    const handleAgregarStock = async () => {
        if (!producto) return;
        const cantidad = Number(stockCantidad) || 0;

        try {
            setGuardando(true);
            await agregarStock(producto.id, cantidad);
            setProducto((prev) => ({
                ...prev,
                stock: prev.stock + cantidad,
            }));
            setVistaPanel(null);
        } catch (err) {
            setError(err.message || 'Error al agregar stock');
        } finally {
            setGuardando(false);
        }
    };

    const handleModificarStock = async () => {
        if (!producto) return;
        const nuevoStock = Number(stockNuevo);
        if (Number.isNaN(nuevoStock)) return;

        try {
            setGuardando(true);
            await editarStock(producto.id, nuevoStock);
            setProducto((prev) => ({
                ...prev,
                stock: nuevoStock,
            }));
            setVistaPanel(null);
        } catch (err) {
            setError(err.message || 'Error al modificar stock');
        } finally {
            setGuardando(false);
        }
    };

    const handleBorrarProducto = async () => {
        if (!producto) return;

        try {
            setGuardando(true);
            await borrarProducto(producto.id);
            onVolver?.();
        } catch (err) {
            setError(err.message || 'Error al borrar el producto');
        } finally {
            setGuardando(false);
        }
    };

    const handleAgregarEtiqueta = async () => {
        if (!producto || !nuevaEtiqueta.trim()) return;

        try {
            setGuardando(true);
            const data = await agregarEtiqueta(nuevaEtiqueta.trim(), producto.id);
            const nueva = {
                id: data.id ?? data.id_etiqueta ?? Date.now(),
                nombre: data.nombre ?? nuevaEtiqueta.trim(),
            };
            setEtiquetas((prev) => [...prev, nueva]);
            setEtiquetaActiva(nueva.nombre);
            setNuevaEtiqueta('');
        } catch (err) {
            setError(err.message || 'Error al agregar etiqueta');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminarEtiqueta = async (etiquetaId) => {
        if (!etiquetaId) return;

        try {
            await borrarEtiqueta(etiquetaId);
            setEtiquetas((prev) => {
                const siguiente = prev.filter((item) => item.id !== etiquetaId);
                if (etiquetaActiva && !siguiente.some((item) => item.nombre === etiquetaActiva)) {
                    setEtiquetaActiva(siguiente[0]?.nombre ?? '');
                }
                return siguiente;
            });
        } catch (err) {
            setError(err.message || 'Error al eliminar la etiqueta');
        }
    };

    const analiticas = producto
        ? [
            { icon: FaChartLine, valor: cargandoVentas ? 'Cargando...' : ventasHistoricas.ventas, label: 'Ventas' },
            { icon: FaEye, valor: cargandoVentas ? 'Cargando...' : ventasHistoricas.vistas, label: 'Vistas' },
            { icon: FaDollarSign, valor: cargandoVentas ? 'Cargando...' : (Number.isFinite(ventasHistoricas.ganancias) ? `$${ventasHistoricas.ganancias.toLocaleString('es-AR')}` : ventasHistoricas.ganancias), label: 'Ganancias' },
            { icon: FaHeart, valor: cargandoVentas ? 'Cargando...' : ventasHistoricas.favoritos, label: 'Favoritos' },
        ]
        : [
            { icon: FaChartLine, valor: '-', label: 'Ventas' },
            { icon: FaEye, valor: '-', label: 'Vistas' },
            { icon: FaDollarSign, valor: '-', label: 'Ganancias' },
            { icon: FaHeart, valor: '-', label: 'Favoritos' },
        ];

    return (
        <>
        <Header onLogoClick={onIrAMenuPrincipal} />

        <section className="cuerpo">
            <section className="producto">
            {/* Volver */}
            <button type="button" onClick={() => onVolver?.()}>
                <FaArrowLeft size={22} />
            </button>

            {loading ? (
                <div className="producto-cargando">Cargando producto...</div>
            ) : error ? (
                <div className="producto-error">{error}</div>
            ) : (
                <>
                    {/* Encabezado */}
                    <h1>{producto.nombre}</h1>
                    <h2>
                        Tipo de producto:{' '}
                        <span>{producto.tipo}</span>
                    </h2>

                    {/* Bloque superior: imagen / precio + analíticas */}
                    <div className="parteSuperior">
                        {/* Imagen + datos */}
                        <div className='ImgData'>
                            <img
                                src={producto.imagen}
                                alt={producto.nombre}
                            />

                            <div className="data">
                                <div className="text-sm text-gray-800 space-y-1">
                                    <p className="font-semibold">Precio: ${producto.precio.toLocaleString('es-AR')}</p>
                                    <p className="font-semibold">Stock: {producto.stock}</p>
                                    <p className="font-semibold">Colores: {producto.colores}</p>
                                </div>

                                                <button className="btnQueBaja" type="button" onClick={() => handleAbrirPanel('editar')}>
                                    Editar Producto
                                </button>
                            </div>
                        </div>

                        {/* Analíticas */}
                        <div className="Analiticas">
                                            <div className="AnaliticasArriba">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Analíticas:</h3>
                                    <p className="text-xs text-gray-500">Periodo: {periodos.find(p => p.id === periodo)?.label}</p>
                                </div>
                                <div className="AnaliticasPeriodo">
                                    <select
                                        className="AnaliticasPeriodoSelect"
                                        value={periodo}
                                        onChange={(e) => setPeriodo(e.target.value)}
                                    >
                                        {periodos.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="AnaliticasAbajo">
                                {analiticas.map(({ icon: Icon, valor, label }) => (
                                <div key={label} className="datoInfromativo">
                                    <Icon size={18}/>
                                    <p className="Precio">{valor}</p>
                                    <p className="Subtitulo">{label}</p>
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Etiquetas */}
            <div className="Etiquetas">
                <div className="EtiquetasArriba">
                    <FaTag size={18} className="text-teal-500" />
                    <h3 className="text-base font-semibold text-gray-900">Etiquetas:</h3>
                </div>
                <p className="EtiquetasDescripcion">
                Estas sirven para que tus productos lleguen a más clientes
                </p>

                <div className="EtiquetasAbajo">
                    {etiquetas.length > 0 ? etiquetas.map((etiqueta) => {
                        const activa = etiqueta.nombre === etiquetaActiva;
                        return (
                        <button
                            key={etiqueta.id}
                            type="button"
                            onClick={() => setEtiquetaActiva(etiqueta.nombre)}
                            className={`Unidad ${activa ? 'normal' : 'hovereada'}`}
                        >
                            {etiqueta.nombre}
                            <span
                                className="Unidad__close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarEtiqueta(etiqueta.id);
                                }}
                            >
                                ×
                            </span>
                        </button>
                        );
                    }) : (
                        <p className="EtiquetasDescripcion">No hay etiquetas cargadas.</p>
                    )}
                </div>
                <div className="EtiquetasAgregar">
                    <input
                        type="text"
                        placeholder="Agregar nueva etiqueta"
                        value={nuevaEtiqueta}
                        onChange={(e) => setNuevaEtiqueta(e.target.value)}
                    />
                    <button type="button" className="EtiquetasAgregarBtn" onClick={handleAgregarEtiqueta} disabled={guardando || !nuevaEtiqueta.trim()}>
                        <FaPlus size={14} />
                        Agregar
                    </button>
                </div>
            </div>

            {/* Acciones */}
            <div className="Acciones">
                <button className="Accion1" type="button" onClick={handleBorrarProducto}>
                    <FaTrash size={16} />
                    Borrar Producto
                </button>

                <button className="Accion2" type="button" onClick={() => handleAbrirPanel('editar')}>
                    <FaPen size={16} />
                    Editar Producto
                </button>

                <button className="Accion3" type="button" onClick={() => handleAbrirPanel('agregarStock')}>
                    <FaSyncAlt size={16} />
                    Agregar Stock
                </button>

                <button className="Accion4" type="button" onClick={() => handleAbrirPanel('modificarStock')}>
                    <FaClipboardList size={16} />
                    Modificar Stock
                </button>
            </div>

            {vistaPanel === 'editar' && formProducto && (
                <div className="producto-panel">
                    <div className="producto-panel__header">
                        <h3>Editar producto</h3>
                        <button type="button" className="producto-panel__cerrar" onClick={() => setVistaPanel(null)}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="producto-panel__grid">
                        <label>
                            Nombre
                            <input
                                type="text"
                                value={formProducto.nombre}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, nombre: e.target.value }))}
                            />
                        </label>
                        <label>
                            Tipo
                            <input
                                type="text"
                                value={formProducto.tipo}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, tipo: e.target.value }))}
                            />
                        </label>
                        <label>
                            Precio
                            <input
                                type="number"
                                min="0"
                                value={formProducto.precio}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, precio: e.target.value }))}
                            />
                        </label>
                        <label className="producto-panel__full">
                            URL de imagen
                            <input
                                type="text"
                                value={formProducto.imagen}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, imagen: e.target.value }))}
                            />
                        </label>
                    </div>
                    <div className="producto-panel__acciones">
                        <button type="button" className="producto-panel__btn producto-panel__btn--secundario" onClick={() => setVistaPanel(null)}>
                            Cancelar
                        </button>
                        <button type="button" className="producto-panel__btn producto-panel__btn--principal" onClick={handleGuardarProducto} disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}

            {vistaPanel === 'agregarStock' && (
                <div className="producto-panel">
                    <div className="producto-panel__header">
                        <h3>Agregar stock</h3>
                        <button type="button" className="producto-panel__cerrar" onClick={() => setVistaPanel(null)}>
                            <FaTimes />
                        </button>
                    </div>
                    <label>
                        Cantidad a sumar
                        <input
                            type="number"
                            min="1"
                            value={stockCantidad}
                            onChange={(e) => setStockCantidad(e.target.value)}
                        />
                    </label>
                    <div className="producto-panel__acciones">
                        <button type="button" className="producto-panel__btn producto-panel__btn--secundario" onClick={() => setVistaPanel(null)}>
                            Cancelar
                        </button>
                        <button type="button" className="producto-panel__btn producto-panel__btn--principal" onClick={handleAgregarStock}>
                            Agregar stock
                        </button>
                    </div>
                </div>
            )}

            {vistaPanel === 'modificarStock' && (
                <div className="producto-panel">
                    <div className="producto-panel__header">
                        <h3>Modificar stock</h3>
                        <button type="button" className="producto-panel__cerrar" onClick={() => setVistaPanel(null)}>
                            <FaTimes />
                        </button>
                    </div>
                    <label>
                        Stock nuevo
                        <input
                            type="number"
                            min="0"
                            value={stockNuevo}
                            onChange={(e) => setStockNuevo(e.target.value)}
                        />
                    </label>
                    <div className="producto-panel__acciones">
                        <button type="button" className="producto-panel__btn producto-panel__btn--secundario" onClick={() => setVistaPanel(null)}>
                            Cancelar
                        </button>
                        <button type="button" className="producto-panel__btn producto-panel__btn--principal" onClick={handleModificarStock}>
                            Guardar stock
                        </button>
                    </div>
                </div>
            )}
            </section>
        </section>

        <Footer />
        </>
    );
    }

    export default Producto;
