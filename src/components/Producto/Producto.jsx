import { useState } from 'react';
import { FaArrowLeft, FaChartLine, FaEye, FaDollarSign, FaHeart, FaTag, FaTrash, FaPen, FaSyncAlt, FaClipboardList, FaChevronDown } from 'react-icons/fa';import Header from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Producto.css';

function Producto() {
    const producto = {
        nombre: 'Remera Blanca Standard',
        tipo: 'Ropa',
        precio: 30000,
        stock: 50,
        colores: 1,
        imagen: '',
    };

    const analiticas = [
        { icon: FaChartLine, valor: 4, label: 'Ventas' },
        { icon: FaEye, valor: 28, label: 'Vistas' },
        { icon: FaDollarSign, valor: '$180.000', label: 'Ganancias' },
        { icon: FaHeart, valor: 15, label: 'Favoritos' },
    ];

    const etiquetas = ['Moda', 'Chill', 'Barato', 'Ropa', 'Modesto', 'Tranquilidad', 'Remera', 'MSI'];
    const [etiquetaActiva, setEtiquetaActiva] = useState('Tranquilidad');

    return (
        <>
        <Header />

        <section className="cuerpo">
            <section className="producto">
            {/* Volver */}
            <button>
                <FaArrowLeft size={22} />
            </button>

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

                        <button className="btnQueBaja">
                            Editar Producto {/* Cuando entras a la caja de data se abre este boton, sale abajo */}
                        </button>
                    </div>
                </div>

                {/* Analíticas */}
                <div className="Analiticas">
                    <div className="AnaliticasArriba">
                        <h3 className="text-lg font-semibold text-gray-900">Analíticas:</h3>
                        <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1">
                        Último mes <FaChevronDown size={14} />
                        </button>
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
                            onClick={() => setEtiquetaActiva(etiqueta)}
                            className={`Unidad ${
                            activa
                                ? 'normal'
                                : 'hovereada'
                            }`}
                        >
                            {etiqueta}
                        </button>
                        );
                    })}
                </div>
            </div>

            {/* Acciones */}
            <div className="Acciones">
                <button className="Accion1">
                <FaTrash size={16} />
                Borrar Producto
                </button>

                <button className="Accion2">
                <FaPen size={16} />
                Editar Producto
                </button>

                <button className="Accion3">
                <FaSyncAlt size={16} />
                Agregar Stock
                </button>

                <button className="Accion4">
                <FaClipboardList size={16} />
                Modificar Stock
                </button>
            </div>
            </section>
        </section>

        <Footer />
        </>
    );
    }

    export default Producto;
