import { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartLine, FaEye, FaDollarSign, FaHeart, FaTag, FaTrash, FaPen, FaSyncAlt, FaClipboardList, FaChevronDown, FaTimes } from 'react-icons/fa';
import Header from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { getProductoPorId, actualizarProducto } from '../../api/productos';
import {
  getVentasUltimos7Dias,
  getVentasUltimoMes,
  getVentasUltimoAno,
  getVentasUltimos2Anios,
} from '../../api/ventas';
import './Producto.css';

function Producto({ productoId, onVolver }) {
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [periodo, setPeriodo] = useState('mes');
    const [diasPersonalizados, setDiasPersonalizados] = useState(30);
    const [ventasHistoricas, setVentasHistoricas] = useState({ ventas: '-', ganancias: '-', vistas: '-', favoritos: '-' });
    const [vistaPanel, setVistaPanel] = useState(null);
    const [formProducto, setFormProducto] = useState(null);
    const [stockCantidad, setStockCantidad] = useState(1);
    const [stockNuevo, setStockNuevo] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [cargandoVentas, setCargandoVentas] = useState(false);

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
            stock: producto.stock,
            colores: producto.colores,
            imagen: producto.imagen,
        });
        setStockNuevo(producto.stock);
    }, [producto]);

    const normalizeVenta = (venta) => {
        const cantidad = Number(venta.cantidad ?? venta.cantidad_vendida ?? venta.cantidadVendida ?? 1);
        const precio = Number(venta.precio ?? venta.precio_unitario ?? venta.precioUnitario ?? 0);
        const total = Number(venta.total ?? venta.importe ?? venta.monto ?? (precio * cantidad));
        const productoId = venta.id_producto ?? venta.producto_id ?? venta.productoId ?? venta.id_producto_venta ?? venta.id;

        return { cantidad, precio, total, productoId, fecha: new Date(venta.fecha ?? venta.createdAt ?? venta.fecha_venta ?? null) };
    };

    const esVentaDelProducto = (venta, idProducto) => {
        if (!venta || !idProducto) return false;
        return String(venta.productoId) === String(idProducto);
    };

    const cargarVentasHistoricas = async () => {
        if (!producto) return;

        setCargandoVentas(true);
        try {
            let ventas = [];
            if (periodo === '7dias') {
                ventas = await getVentasUltimos7Dias();
            } else if (periodo === 'mes') {
                ventas = await getVentasUltimoMes();
            } else if (periodo === '1anio') {
                ventas = await getVentasUltimoAno();
            } else if (periodo === '2anios') {
                ventas = await getVentasUltimos2Anios();
            }

            const filtradas = (Array.isArray(ventas) ? ventas : []).map(normalizeVenta).filter(v => esVentaDelProducto(v, producto.id));
            const ventasSum = filtradas.reduce((sum, item) => sum + item.cantidad, 0);
            const gananciasSum = filtradas.reduce((sum, item) => sum + item.total, 0);

            setVentasHistoricas({
                ventas: ventasSum,
                ganancias: gananciasSum,
                vistas: producto.vistas ?? '-',
                favoritos: producto.favoritos ?? '-',
            });
        } catch (err) {
            setVentasHistoricas({ ventas: '-', ganancias: '-', vistas: producto.vistas ?? '-', favoritos: producto.favoritos ?? '-' });
        } finally {
            setCargandoVentas(false);
        }
    };

    useEffect(() => {
        cargarVentasHistoricas();
    }, [producto, periodo, diasPersonalizados]);

    const periodos = [
        { id: '7dias', label: 'Últimos 7 días' },
        { id: 'mes', label: 'Último mes' },
        { id: '1anio', label: '1 año' },
        { id: '2anios', label: '2 años' },
        { id: 'personalizado', label: 'Personalizado' },
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

        const actualizacion = {
            nombre: formProducto.nombre,
            tipo: formProducto.tipo,
            precio: Number(formProducto.precio) || 0,
            stock: Number(formProducto.stock) || 0,
            colores: Number(formProducto.colores) || 1,
            imagen: formProducto.imagen,
        };

        try {
            setGuardando(true);
            await actualizarProducto(producto.id, actualizacion);
            setProducto(prev => ({
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
        const nuevoStock = producto.stock + cantidad;

        try {
            setGuardando(true);
            await actualizarProducto(producto.id, { stock: nuevoStock });
            setProducto(prev => ({
                ...prev,
                stock: nuevoStock,
            }));
            setVistaPanel(null);
        } catch (err) {
            setError(err.message || 'Error al actualizar stock');
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
            await actualizarProducto(producto.id, { stock: nuevoStock });
            setProducto(prev => ({
                ...prev,
                stock: nuevoStock,
            }));
            setVistaPanel(null);
        } catch (err) {
            setError(err.message || 'Error al actualizar stock');
        } finally {
            setGuardando(false);
        }
    };

    const analiticas = producto
        ? [
            { icon: FaChartLine, valor: cargandoVentas ? 'Cargando...' : ventasHistoricas.ventas, label: 'Ventas' },
            { icon: FaEye, valor: producto.vistas ?? ventasHistoricas.vistas, label: 'Vistas' },
            { icon: FaDollarSign, valor: cargandoVentas ? 'Cargando...' : (Number.isFinite(ventasHistoricas.ganancias) ? `$${ventasHistoricas.ganancias.toLocaleString('es-AR')}` : ventasHistoricas.ganancias), label: 'Ganancias' },
            { icon: FaHeart, valor: producto.favoritos ?? ventasHistoricas.favoritos, label: 'Favoritos' },
        ]
        : [
            { icon: FaChartLine, valor: '-', label: 'Ventas' },
            { icon: FaEye, valor: '-', label: 'Vistas' },
            { icon: FaDollarSign, valor: '-', label: 'Ganancias' },
            { icon: FaHeart, valor: '-', label: 'Favoritos' },
        ];

    const [etiquetas, setEtiquetas] = useState(['Moda', 'Chill', 'Barato', 'Ropa', 'Modesto', 'Tranquilidad', 'Remera', 'MSI']);
    const [etiquetaActiva, setEtiquetaActiva] = useState('Tranquilidad');

    const handleEliminarEtiqueta = (etiqueta) => {
        setEtiquetas(prev => prev.filter(item => item !== etiqueta));
        if (etiquetaActiva === etiqueta) {
            setEtiquetaActiva(prev => {
                const siguiente = etiquetas.find(item => item !== etiqueta);
                return siguiente || '';
            });
        }
    };

    return (
        <>
        <Header />

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
                                <div className="AnaliticasFiltros">
                                    {periodos.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`AnaliticasFiltroBtn ${periodo === item.id ? 'AnaliticasFiltroBtn--activo' : ''}`}
                                            onClick={() => setPeriodo(item.id)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {periodo === 'personalizado' && (
                                <div className="AnaliticasPersonalizado">
                                    <label className="AnaliticasPersonalizado__label" htmlFor="dias-personalizados">
                                        Días personalizados:
                                    </label>
                                    <input
                                        id="dias-personalizados"
                                        type="number"
                                        min="1"
                                        value={diasPersonalizados}
                                        onChange={(e) => setDiasPersonalizados(e.target.value)}
                                        className="AnaliticasPersonalizado__input"
                                    />
                                </div>
                            )}

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
                    {etiquetas.map((etiqueta) => {
                        const activa = etiqueta === etiquetaActiva;
                        return (
                        <button
                            key={etiqueta}
                            type="button"
                            onClick={() => setEtiquetaActiva(etiqueta)}
                            className={`Unidad ${
                            activa
                                ? 'normal'
                                : 'hovereada'
                            }`}
                        >
                            {etiqueta}
                            <span
                                className="Unidad__close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarEtiqueta(etiqueta);
                                }}
                            >
                                ×
                            </span>
                        </button>
                        );
                    })}
                </div>
            </div>

            {/* Acciones */}
            <div className="Acciones">
                <button className="Accion1" type="button">
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
                        <label>
                            Stock
                            <input
                                type="number"
                                min="0"
                                value={formProducto.stock}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, stock: e.target.value }))}
                            />
                        </label>
                        <label>
                            Colores
                            <input
                                type="number"
                                min="1"
                                value={formProducto.colores}
                                onChange={(e) => setFormProducto(prev => ({ ...prev, colores: e.target.value }))}
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
