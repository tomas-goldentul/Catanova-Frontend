import { useState } from 'react';
import './GestionCategorias.css';

const MOCK_PRODUCTOS = [
    { id: 1, nombre: 'Remera oversize', precio: 50000 },
    { id: 2, nombre: 'Pantalón cargo', precio: 45000 },
    { id: 3, nombre: 'Campera bomber', precio: 85000 },
    { id: 4, nombre: 'Buzo hoodie', precio: 65000 },
    { id: 5, nombre: 'Calza deportiva', precio: 35000 },
];

const MOCK_CATEGORIAS_INICIALES = [
    {
        id: 1,
        nombre: 'Remeras',
        productos: [
            { id: 1, nombre: 'Remera oversize', cantidad: 2, precioUnitario: 50000 },
        ],
    },
    {
        id: 2,
        nombre: 'Pantalones',
        productos: [
            { id: 2, nombre: 'Pantalón cargo', cantidad: 1, precioUnitario: 45000 },
        ],
    },
];

function FilaProducto({ item, onQuitar }) {
    return (
        <tr className="gc-tabla__fila">
            <td className="gc-tabla__celda">{item.nombre}</td>
            <td className="gc-tabla__celda gc-tabla__celda--centro">{item.cantidad}</td>
            <td className="gc-tabla__celda gc-tabla__celda--centro">
                ${item.precioUnitario.toLocaleString('es-AR')}
            </td>
            <td className="gc-tabla__celda gc-tabla__celda--centro">
                ${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}
            </td>
            <td className="gc-tabla__celda gc-tabla__celda--accion">
                <button className="gc-btn-quitar" onClick={() => onQuitar(item.id)} aria-label="Quitar producto">
                    ✕
                </button>
            </td>
        </tr>
    );
}

function SelectorProducto({ lista, onAgregar }) {
    const [productoId, setProductoId] = useState('');
    const [cantidad, setCantidad] = useState(1);

    const handleAgregar = () => {
        if (!productoId) return;
        const producto = MOCK_PRODUCTOS.find(p => p.id === Number(productoId));
        if (!producto) return;
        onAgregar(producto, Number(cantidad));
        setProductoId('');
        setCantidad(1);
    };

    return (
        <div className="gc-selector-row">
            <div className="gc-campo">
                <label className="gc-campo__label">Productos:</label>
                <select
                    className="gc-select"
                    value={productoId}
                    onChange={e => setProductoId(e.target.value)}
                >
                    <option value="">Selecciona un producto</option>
                    {MOCK_PRODUCTOS.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>
            </div>
            <div className="gc-campo gc-campo--cantidad">
                <label className="gc-campo__label">Cantidad</label>
                <input
                    className="gc-input gc-input--cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                />
            </div>
            <button className="gc-btn-agregar-item" onClick={handleAgregar}>
                + Agregar
            </button>
        </div>
    );
}

function TablaProductos({ lista, onQuitar }) {
    if (lista.length === 0) return null;

    return (
        <div className="gc-lista-productos">
            <span className="gc-lista-productos__titulo">Lista de productos</span>
            <table className="gc-tabla">
                <thead>
                    <tr>
                        <th className="gc-tabla__th"></th>
                        <th className="gc-tabla__th gc-tabla__th--centro">Cantidad</th>
                        <th className="gc-tabla__th gc-tabla__th--centro">Precio unitario</th>
                        <th className="gc-tabla__th gc-tabla__th--centro">Total</th>
                        <th className="gc-tabla__th"></th>
                    </tr>
                </thead>
                <tbody>
                    {lista.map(item => (
                        <FilaProducto key={item.id} item={item} onQuitar={onQuitar} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PanelCrear({ onCrear, onCancelar }) {
    const [nombre, setNombre] = useState('');
    const [lista, setLista] = useState([]);
    const [error, setError] = useState('');

    const handleAgregarProducto = (producto, cantidad) => {
        setLista(prev => {
            const existe = prev.find(i => i.id === producto.id);
            if (existe) {
                return prev.map(i =>
                    i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
                );
            }
            return [...prev, { id: producto.id, nombre: producto.nombre, cantidad, precioUnitario: producto.precio }];
        });
    };

    const handleQuitarProducto = (id) => {
        setLista(prev => prev.filter(i => i.id !== id));
    };

    const handleSubmit = () => {
        if (!nombre.trim()) {
            setError('Ingresá un nombre para la categoría.');
            return;
        }
        if (lista.length === 0) {
            setError('Agregá al menos un producto.');
            return;
        }
        onCrear({ nombre: nombre.trim(), productos: lista });
    };

    return (
        <div className="gc-panel">
            <h2 className="gc-panel__titulo">Crear Categoría</h2>

            <div className="gc-campo gc-campo--nombre">
                <label className="gc-campo__label gc-campo__label--destacado" htmlFor="gc-nombre">
                    Nombre:
                </label>
                <div className="gc-input-busqueda-wrap">
                    <span className="gc-input-busqueda-icono">🔍</span>
                    <input
                        id="gc-nombre"
                        className="gc-input gc-input--busqueda"
                        type="text"
                        placeholder="Busca una categoría"
                        value={nombre}
                        onChange={e => { setNombre(e.target.value); setError(''); }}
                    />
                </div>
            </div>

            <SelectorProducto lista={lista} onAgregar={handleAgregarProducto} />
            <TablaProductos lista={lista} onQuitar={handleQuitarProducto} />

            {error && <p className="gc-error">{error}</p>}

            <div className="gc-acciones gc-acciones--derecha">
                <button className="gc-btn gc-btn--principal" onClick={handleSubmit}>Agregar</button>
            </div>
        </div>
    );
}

function PanelEditar({ categoria, onGuardar, onBorrar, onCancelar }) {
    const [lista, setLista] = useState(categoria.productos);

    const handleAgregarProducto = (producto, cantidad) => {
        setLista(prev => {
            const existe = prev.find(i => i.id === producto.id);
            if (existe) {
                return prev.map(i =>
                    i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
                );
            }
            return [...prev, { id: producto.id, nombre: producto.nombre, cantidad, precioUnitario: producto.precio }];
        });
    };

    const handleQuitarProducto = (id) => {
        setLista(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="gc-panel">
            <h2 className="gc-panel__titulo">Editar Categoría</h2>

            <SelectorProducto lista={lista} onAgregar={handleAgregarProducto} />
            <TablaProductos lista={lista} onQuitar={handleQuitarProducto} />

            <div className="gc-acciones gc-acciones--editar">
                <button className="gc-btn gc-btn--peligro" onClick={onBorrar}>
                    Borrar Categoría
                </button>
                <button className="gc-btn gc-btn--principal" onClick={() => onGuardar({ ...categoria, productos: lista })}>
                    Agregar
                </button>
            </div>
        </div>
    );
}

function PanelBorrar({ categoria, onConfirmar, onVolver }) {
    return (
        <div className="gc-panel gc-panel--borrar">
            <h2 className="gc-panel__titulo gc-panel__titulo--borrar">
                ¿Seguro que quieres eliminar la Categoría?
            </h2>
            <p className="gc-panel__subtitulo">Al eliminarla no la podrás recuperar</p>
            <div className="gc-acciones">
                <button className="gc-btn gc-btn--eliminar" onClick={onConfirmar}>Eliminar</button>
                <button className="gc-btn gc-btn--volver" onClick={onVolver}>Volver</button>
            </div>
        </div>
    );
}

function GestionCategorias() {
    const [categorias, setCategorias] = useState(MOCK_CATEGORIAS_INICIALES);
    const [vista, setVista] = useState('lista');
    const [categoriaActiva, setCategoriaActiva] = useState(null);

    const abrirEditar = (categoria) => {
        setCategoriaActiva(categoria);
        setVista('editar');
    };

    const volverALista = () => {
        setVista('lista');
        setCategoriaActiva(null);
    };

    const handleCrear = (nueva) => {
        setCategorias(prev => [...prev, { id: Date.now(), ...nueva }]);
        volverALista();
    };

    const handleGuardar = (editada) => {
        setCategorias(prev => prev.map(c => c.id === editada.id ? editada : c));
        volverALista();
    };

    const handleBorrar = () => {
        setCategorias(prev => prev.filter(c => c.id !== categoriaActiva.id));
        volverALista();
    };

    return (
        <div className="gc-contenedor">
            {vista === 'lista' && (
                <div className="gc-vista-lista">
                    <div className="gc-lista-header">
                        <h1 className="gc-lista-titulo">Categorías</h1>
                        <button className="gc-btn gc-btn--principal" onClick={() => setVista('crear')}>
                            + Nueva Categoría
                        </button>
                    </div>

                    {categorias.length === 0 ? (
                        <p className="gc-vacio">No hay categorías creadas todavía.</p>
                    ) : (
                        <ul className="gc-categorias-lista">
                            {categorias.map(cat => (
                                <li key={cat.id} className="gc-categoria-item">
                                    <div className="gc-categoria-info">
                                        <span className="gc-categoria-nombre">{cat.nombre}</span>
                                        <span className="gc-categoria-count">
                                            {cat.productos.length} {cat.productos.length === 1 ? 'producto' : 'productos'}
                                        </span>
                                    </div>
                                    <button
                                        className="gc-btn gc-btn--secundario gc-btn--sm"
                                        onClick={() => abrirEditar(cat)}
                                    >
                                        Editar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {vista === 'crear' && (
                <PanelCrear onCrear={handleCrear} onCancelar={volverALista} />
            )}

            {vista === 'editar' && categoriaActiva && (
                <PanelEditar
                    categoria={categoriaActiva}
                    onGuardar={handleGuardar}
                    onBorrar={() => setVista('borrar')}
                    onCancelar={volverALista}
                />
            )}

            {vista === 'borrar' && categoriaActiva && (
                <PanelBorrar
                    categoria={categoriaActiva}
                    onConfirmar={handleBorrar}
                    onVolver={() => setVista('editar')}
                />
            )}
        </div>
    );
}

export default GestionCategorias;
