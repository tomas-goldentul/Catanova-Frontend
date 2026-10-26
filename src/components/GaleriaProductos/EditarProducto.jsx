import { useEffect, useState } from 'react';
import {
    actualizarProducto,
    getProductoPorId
} from '../../api/productos';
import {
    getCategoriasPorTienda,
    getProductosDeCategoria,
    asociarProductoACategoria
} from '../../api/categorias';
import './EditarProducto.css';

const obtenerIdProducto = (producto) =>
    producto?.id_producto ?? producto?.id ?? producto?._id;

const obtenerIdCategoria = (categoria) =>
    categoria?.id_categoria ?? categoria?.id;

const obtenerLista = (data) =>
    Array.isArray(data)
        ? data
        : data?.productos ?? data?.categorias ?? data?.data ?? [];

const obtenerPrecio = (precio) => {
    const numero = Number(String(precio ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(numero) ? numero : 0;
};

function EditarProducto({ producto, onCancelar, onGuardar }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        precio: '',
        stock: '',
        imagen: '',
        tipo: '',
        descripcion: ''
    });

    const [categorias, setCategorias] = useState([]);
    const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
    const [categoriasOriginales, setCategoriasOriginales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;

        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError('');

                const idTienda = Number(localStorage.getItem('id_tienda'));
                const idProducto = obtenerIdProducto(producto);

                if (!idProducto) {
                    throw new Error('No se encontró el identificador del producto.');
                }

                if (!idTienda || !Number.isFinite(idTienda)) {
                    throw new Error('No se encontró una tienda activa.');
                }

                const [productoData, categoriasData] = await Promise.all([
                    getProductoPorId(idProducto),
                    getCategoriasPorTienda(idTienda)
                ]);

                const productoOriginal =
                    productoData?.producto ??
                    productoData?.data ??
                    productoData;

                const listaCategorias = obtenerLista(categoriasData);

                const asociaciones = await Promise.all(
                    listaCategorias.map(async (categoria) => {
                        const idCategoria = obtenerIdCategoria(categoria);

                        try {
                            const data = await getProductosDeCategoria(idCategoria);

                            const productosCategoria = obtenerLista(data);

                            const pertenece = productosCategoria.some((item) =>
                                String(obtenerIdProducto(item)) === String(idProducto)
                            );

                            return pertenece ? idCategoria : null;
                        } catch {
                            return null;
                        }
                    })
                );

                const idsSeleccionados = asociaciones.filter(
                    (id) => id !== null && id !== undefined
                );

                if (cancelado) return;

                setFormulario({
                    nombre: productoOriginal.nombre ?? '',
                    precio: String(obtenerPrecio(productoOriginal.precio)),
                    stock: String(productoOriginal.stock ?? 0),
                    imagen:
                        productoOriginal.imagen ??
                        productoOriginal.foto ??
                        productoOriginal.imagen_url ??
                        '',
                    tipo: productoOriginal.tipo ?? '',
                    descripcion: productoOriginal.descripcion ?? ''
                });

                setCategorias(listaCategorias);
                setCategoriasOriginales(idsSeleccionados);
                setCategoriasSeleccionadas(idsSeleccionados);
            } catch (err) {
                if (!cancelado) {
                    setError(err.message || 'No se pudieron cargar los datos.');
                }
            } finally {
                if (!cancelado) setCargando(false);
            }
        };

        cargarDatos();

        return () => {
            cancelado = true;
        };
    }, [producto]);

    const cambiarCampo = (event) => {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    const alternarCategoria = (idCategoria) => {
        setCategoriasSeleccionadas((anteriores) =>
            anteriores.some((id) => String(id) === String(idCategoria))
                ? anteriores.filter((id) => String(id) !== String(idCategoria))
                : [...anteriores, idCategoria]
        );
    };

    const guardarCambios = async (event) => {
        event.preventDefault();
        setError('');

        if (!formulario.nombre.trim()) {
            setError('El nombre del producto es obligatorio.');
            return;
        }

        const precio = Number(formulario.precio);
        const stock = Number(formulario.stock);

        if (!Number.isFinite(precio) || precio < 0) {
            setError('Ingresá un precio válido.');
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            setError('El stock debe ser un número entero igual o mayor que cero.');
            return;
        }

        const idProducto = obtenerIdProducto(producto);
        const idTienda = Number(localStorage.getItem('id_tienda'));

        try {
            setGuardando(true);

            if (!idTienda || Number.isNaN(idTienda)) {
                throw new Error('No se encontró una tienda válida.');
            }

            // Validar el precio
            const precio = Number(formulario.precio);

            if (!Number.isFinite(precio) || precio <= 0) {
                throw new Error('Ingresá un precio válido mayor que cero.');
            }

            if (precio > 99999999) {
                throw new Error('El precio no puede superar $99.999.999.');
            }

            await actualizarProducto(idProducto, {
                nombre: formulario.nombre.trim(),
                precio,
                stock,
                imagen: formulario.imagen.trim(),
                tipo: formulario.tipo.trim(),
                descripcion: formulario.descripcion.trim(),
                id_tienda: idTienda
            });

            const porAgregar = categoriasSeleccionadas.filter(
                (id) => !categoriasOriginales.some(
                    (original) => String(original) === String(id)
                )
            );

            const porQuitar = categoriasOriginales.filter(
                (id) => !categoriasSeleccionadas.some(
                    (seleccionada) => String(seleccionada) === String(id)
                )
            );

            for (const idCategoria of porAgregar) {
                await asociarProductoACategoria(idCategoria, idProducto);
            }

            for (const idCategoria of porQuitar) {
                const respuesta = await fetch(
                    `http://localhost:3000/categorias/${idCategoria}/productos/${idProducto}`,
                    { method: 'DELETE' }
                );

                if (!respuesta.ok) {
                    const data = await respuesta.json().catch(() => ({}));
                    throw new Error(
                        data.message ||
                        `No se pudo quitar el producto de la categoría ${idCategoria}.`
                    );
                }
            }

            onGuardar({
                ...producto,
                id: idProducto,
                nombre: formulario.nombre.trim(),
                precio: `$${precio.toLocaleString('es-AR')}`,
                stock,
                imagen: formulario.imagen.trim(),
                tipo: formulario.tipo.trim(),
                descripcion: formulario.descripcion.trim()
            });
        } catch (err) {
            setError(
                err.message ||
                'No se pudieron guardar todos los cambios. Revisá la conexión con el servidor.'
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div
            className="editarProductoOverlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !guardando) {
                    onCancelar();
                }
            }}
        >
            <section
                className="editarProductoModal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="editarProductoTitulo"
            >
                <header className="editarProductoHeader">
                    <div>
                        <span className="editarProductoEyebrow">
                            CATÁLOGO · PRODUCTOS
                        </span>
                        <h2 id="editarProductoTitulo">Editar producto</h2>
                        <p>Actualizá la información de tu producto.</p>
                    </div>

                    <button
                        type="button"
                        className="editarProductoCerrar"
                        onClick={onCancelar}
                        disabled={guardando}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </header>

                {cargando ? (
                    <div className="editarProductoEstado">
                        Cargando información del producto…
                    </div>
                ) : (
                    <form onSubmit={guardarCambios}>
                        <div className="editarProductoContenido">
                            <div className="editarProductoCampos">
                                <label className="editarProductoCampo">
                                    Nombre del producto
                                    <input
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={cambiarCampo}
                                        placeholder="Ej. Auriculares inalámbricos"
                                        required
                                    />
                                </label>

                                <div className="editarProductoFila">
                                    <label className="editarProductoCampo">
                                        Precio
                                        <div className="editarProductoInputPrefijo">
                                            <span>$</span>
                                            <input
                                                name="precio"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formulario.precio}
                                                onChange={cambiarCampo}
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label className="editarProductoCampo">
                                        Stock
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={formulario.stock}
                                            onChange={cambiarCampo}
                                            required
                                        />
                                    </label>
                                </div>

                                <label className="editarProductoCampo">
                                    Tipo de producto
                                    <input
                                        name="tipo"
                                        value={formulario.tipo}
                                        onChange={cambiarCampo}
                                        placeholder="Ej. Electrónica"
                                    />
                                </label>

                                <label className="editarProductoCampo">
                                    Descripción
                                    <textarea
                                        name="descripcion"
                                        value={formulario.descripcion}
                                        onChange={cambiarCampo}
                                        placeholder="Describí las características del producto…"
                                        rows="4"
                                    />
                                </label>

                                <label className="editarProductoCampo">
                                    URL de la imagen
                                    <input
                                        name="imagen"
                                        type="text"
                                        value={formulario.imagen}
                                        onChange={cambiarCampo}
                                        placeholder="URL o ruta de la imagen"
                                    />
                                </label>

                                <section className="editarProductoCategorias">
                                    <div className="editarProductoCategoriasTitulo">
                                        <div>
                                            <h3>Categorías</h3>
                                            <p>Podés elegir más de una.</p>
                                        </div>
                                        <span>
                                            {categoriasSeleccionadas.length} seleccionadas
                                        </span>
                                    </div>

                                    {categorias.length === 0 ? (
                                        <p className="editarProductoSinCategorias">
                                            No hay categorías para esta tienda.
                                        </p>
                                    ) : (
                                        <div className="editarProductoListaCategorias">
                                            {categorias.map((categoria) => {
                                                const idCategoria =
                                                    obtenerIdCategoria(categoria);

                                                const seleccionada =
                                                    categoriasSeleccionadas.some(
                                                        (id) =>
                                                            String(id) ===
                                                            String(idCategoria)
                                                    );

                                                return (
                                                    <label
                                                        key={idCategoria}
                                                        className={`editarProductoCategoria ${
                                                            seleccionada
                                                                ? 'seleccionada'
                                                                : ''
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={seleccionada}
                                                            onChange={() =>
                                                                alternarCategoria(
                                                                    idCategoria
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            {categoria.nombre ??
                                                                'Categoría sin nombre'}
                                                        </span>
                                                        <span className="editarProductoCheck">
                                                            {seleccionada ? '✓' : '+'}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            </div>

                            <aside className="editarProductoVistaPrevia">
                                <span className="editarProductoPreviewLabel">
                                    VISTA PREVIA
                                </span>

                                {formulario.imagen.trim() ? (
                                    <img
                                        src={formulario.imagen}
                                        alt={formulario.nombre || 'Vista previa'}
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none';
                                        }}
                                        onLoad={(event) => {
                                            event.currentTarget.style.display = 'block';
                                        }}
                                    />
                                ) : (
                                    <div className="editarProductoImagenVacia">
                                        <span>◇</span>
                                        <p>Agregá una URL para previsualizar la imagen.</p>
                                    </div>
                                )}

                                <h3>
                                    {formulario.nombre || 'Nombre del producto'}
                                </h3>
                                <strong>
                                    ${obtenerPrecio(formulario.precio).toLocaleString('es-AR')}
                                </strong>
                                <p>Stock disponible: {formulario.stock || '0'}</p>
                            </aside>
                        </div>

                        {error && (
                            <div className="editarProductoError" role="alert">
                                {error}
                            </div>
                        )}

                        <footer className="editarProductoFooter">
                            <button
                                type="button"
                                className="editarProductoCancelar"
                                onClick={onCancelar}
                                disabled={guardando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="editarProductoGuardar"
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando…' : 'Guardar cambios'}
                            </button>
                        </footer>
                    </form>
                )}
            </section>
        </div>
    );
}

export default EditarProducto;
