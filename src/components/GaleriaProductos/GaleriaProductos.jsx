import { useEffect, useState } from 'react';
import Footer from '../Footer/Footer';
import StatCard from '../StatCard/StatCard';
import TarjetaProducto from '../TarjetaProducto/TarjetaProducto';
import Paginacion from '../Paginacion/Paginacion';
import AgregarProducto from '../AgregarProducto/AgregarProducto';
import FiltroProductos from './FiltroProductos';
import { getTodosLosProductos, getTodosProductosPorTienda, updateEstadoProducto, borrarProducto } from '../../api/productos';
import { IconoBuscar, IconoFiltrar, IconoMas, IconoPaquete, IconoTienda, IconoOjoTachado, IconoInventario } from '../Icons/Icons';
import './GaleriaProductos.css';

const parsearActivo = (valor) => {
    if (valor === true || valor === 1 || valor === '1' || valor === 'true' || valor === 'TRUE') return true;
    return false;
};

const normalizarProducto = (producto) => ({
    id: producto.id_producto ?? producto.id ?? producto._id ?? producto.productoId,
    nombre: producto.nombre ?? 'Sin nombre',
    imagen: producto.imagen ?? producto.foto ?? producto.imagenUrl ?? producto.imagen_url ?? producto.image ?? producto.url ?? '',
    talle: producto.talle ?? producto.talla ?? 'Sin talle',
    stock: Number(producto.stock ?? 0),
    precio: typeof producto.precio === 'number'
        ? `$${producto.precio.toLocaleString('es-AR')}`
        : (typeof producto.precio === 'string'
            ? `$${Number(producto.precio).toLocaleString('es-AR')}`
            : '$0'),
    activo: parsearActivo(producto.activo ?? producto.estado),
});

const PRODUCTOS_POR_PAGINA = 6;

const obtenerPrecioNumerico = (precio) => {
    const numero = Number(String(precio).replace(/[^\d.-]/g, ''));
    return Number.isFinite(numero) ? numero : 0;
};

const IconoProductosVacios = () => (
    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 9h2M7 12h4" />
    </svg>
);

function GaleriaProductos({ onVerEnTienda }) {
    const [productos, setProductos] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
    const [mostrarFiltro, setMostrarFiltro] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [soloActivos, setSoloActivos] = useState(false);
    const [orden, setOrden] = useState('todos');

    useEffect(() => {
        let activo = true;

        const cargarProductos = async () => {
            try {
                const tiendaIdRaw = localStorage.getItem('id_tienda');
                const tiendaId = tiendaIdRaw ? Number(tiendaIdRaw) : null;
                const data = tiendaId && Number.isFinite(tiendaId)
                    ? await getTodosProductosPorTienda(tiendaId)
                    : await getTodosLosProductos();
                const lista = Array.isArray(data) ? data : data?.productos ?? [];

                if (!activo) return;

                const productosNormalizados = lista.map(normalizarProducto);
                console.log('Productos cargados:', productosNormalizados.map(p => ({
                    nombre: p.nombre,
                    imagen: p.imagen,
                    tiene_imagen: !!p.imagen && p.imagen.trim() !== ''
                })));

                setProductos(productosNormalizados);
            } catch (error) {
                if (!activo) return;

                console.error('No se pudieron cargar los productos:', error);
                setMensaje('No se pudieron cargar los productos. Verifica que el backend esté disponible.');
                setProductos([]);
            }
        };

        cargarProductos();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        if (!mensaje) return undefined;

        const timer = window.setTimeout(() => setMensaje(''), 2500);
        return () => window.clearTimeout(timer);
    }, [mensaje]);

    const productosFiltrados = productos
        .filter((productoActual) => {
            const coincideBusqueda = productoActual.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const coincideActivo = soloActivos ? productoActual.activo : true;
            return coincideBusqueda && coincideActivo;
        })
        .sort((a, b) => {
            if (orden === 'barato') {
                return obtenerPrecioNumerico(a.precio) - obtenerPrecioNumerico(b.precio);
            }
            if (orden === 'caro') {
                return obtenerPrecioNumerico(b.precio) - obtenerPrecioNumerico(a.precio);
            }
            return 0;
        });

    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const productosPagina = productosFiltrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    const enTienda = productos.filter(productoActual => productoActual.activo).length;
    const sinPublicar = productos.filter(productoActual => !productoActual.activo).length;
    const stockBajo = productos.filter(productoActual => productoActual.stock < 10).length;

    const base = Math.max(productos.length, 1);
    const enTiendaPct = Math.round((enTienda / base) * 100);
    const sinPublicarPct = Math.round((sinPublicar / base) * 100);
    const stockBajoPct = Math.round((stockBajo / base) * 100);

    const handleEliminar = async (id) => {
        await borrarProducto(id);
        setProductos(productosPrevios => productosPrevios.filter(productoActual => productoActual.id !== id));
    };

    const handleAgregar = async (id) => {
        const producto = productos.find((item) => item.id === id);

        if (!producto) {
            setMensaje('No se encontró el producto.');
            return;
        }

        if (producto.activo) {
            setMensaje('Este producto ya está en la tienda.');
            return;
        }

        try {
            await updateEstadoProducto(id, true);
            setProductos((productosPrevios) =>
                productosPrevios.map((item) =>
                    item.id === id ? { ...item, activo: true } : item
                )
            );
            setMensaje(`"${producto.nombre}" se agregó a la tienda.`);
        } catch (error) {
            setMensaje(error.message || 'No se pudo agregar el producto a la tienda.');
        }
    };

    const handleEditar = () => {
        setMensaje('La edición de productos estará disponible próximamente.');
    };

    const handleCrearProducto = (nuevoProducto) => {
        setProductos(productosPrevios => [
            normalizarProducto(nuevoProducto),
            ...productosPrevios
        ]);

        setPaginaActual(1);
        setMostrarAgregarProducto(false);
    };

    const irVerEnTienda = (id) => {
        if (onVerEnTienda) {
            onVerEnTienda(id);
            return;
        }
        setMensaje('Dirigite a la sección Catálogo para ver tu tienda pública.');
    };

    return (
        <>
            <div className="galeria">

                <div className="galeriaHero">
                    <div className="galeriaHeroTitulo">
                        <div className="galeriaHeroTexto">
                            <h1>Galería de Productos</h1>
                            <p>{productos.length} productos en tu catálogo</p>
                        </div>
                        <div className="galeriaHeroAcciones">
                            <div className="galeriaBuscadorContenedor">
                                <IconoBuscar />
                                <input
                                    type="text"
                                    className="galeriaBuscador"
                                    placeholder="Buscar producto..."
                                    value={busqueda}
                                    onChange={(event) => {
                                        setBusqueda(event.target.value);
                                        setPaginaActual(1);
                                    }}
                                />
                            </div>
                            <button
                                className="galeriaFiltrar"
                                onClick={() => {
                                    setMostrarFiltro((valorActual) => !valorActual);
                                    setPaginaActual(1);
                                }}
                            >
                                <IconoFiltrar /> Filtrar
                            </button>
                            <button
                                className="galeriaCrearNuevoProd"
                                onClick={() => setMostrarAgregarProducto(true)}
                            >
                                <IconoMas /> Nuevo producto
                            </button>
                        </div>
                    </div>
                </div>

                {mostrarAgregarProducto && (
                    <AgregarProducto
                        onCrear={handleCrearProducto}
                        onCancelar={() => setMostrarAgregarProducto(false)}
                    />
                )}

                {mostrarFiltro && (
                    <FiltroProductos
                        orden={orden}
                        onCambiarOrden={(nuevoOrden) => {
                            setOrden(nuevoOrden);
                            setPaginaActual(1);
                        }}
                        soloActivos={soloActivos}
                        onToggleActivos={() => {
                            setSoloActivos((valorActual) => !valorActual);
                            setPaginaActual(1);
                        }}
                        onCerrar={() => setMostrarFiltro(false)}
                    />
                )}

                {mensaje && (
                    <div className="galeriaToast">
                        <p className="galeriaToastTexto">{mensaje}</p>
                    </div>
                )}

                <div className="estadisticasGenerales">
                    <StatCard
                        label="Total Productos"
                        value={productosFiltrados.length}
                        icono={IconoPaquete}
                        color="#6366f1"
                        tendencia={`${enTiendaPct}% en tienda`}
                        tendenciaPositiva={true}
                    />
                    <StatCard
                        label="En Tienda"
                        value={enTienda}
                        icono={IconoTienda}
                        color="#00b894"
                        tendencia={`+${enTiendaPct}%`}
                        tendenciaPositiva={true}
                    />
                    <StatCard
                        label="Sin Publicar"
                        value={sinPublicar}
                        icono={IconoOjoTachado}
                        color="#f59e0b"
                        tendencia={`${sinPublicarPct}% del total`}
                        tendenciaPositiva={false}
                    />
                    <StatCard
                        label="Stock Bajo"
                        value={stockBajo}
                        icono={IconoInventario}
                        color="#ef4444"
                        tendencia={`${stockBajoPct}% del total`}
                        tendenciaPositiva={false}
                    />
                </div>

                {productosPagina.length > 0 ? (
                    <div className="productosOrdenados">
                        {productosPagina.map((producto, index) => (
                            <TarjetaProducto
                                key={producto.id ?? `${producto.nombre}-${index}`}
                                {...producto}
                                onAgregar={() => handleAgregar(producto.id)}
                                onEliminar={() => handleEliminar(producto.id)}
                                onEditar={handleEditar}
                                onVerEnTienda={() => irVerEnTienda(producto.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="galeriaVacio">
                        <div className="galeriaVacioIcono">
                            <IconoProductosVacios />
                        </div>
                        <h3>No se encontraron productos</h3>
                        <p>Probá ajustando los filtros o agregá un nuevo producto a tu catálogo.</p>
                    </div>
                )}

                {totalPaginas > 1 && (
                    <Paginacion
                        total={totalPaginas}
                        paginaActual={paginaActual}
                        onChange={setPaginaActual}
                    />
                )}

            </div>
            <Footer />
        </>
    );
}

export default GaleriaProductos;