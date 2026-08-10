import { useEffect, useMemo, useState } from 'react';
import { insertProducto } from '../../api/productos';
import { getCategoriasPorTienda } from '../../api/categorias';
import { IconoImagen, IconoCerrar } from '../Icons/Icons';
import './AgregarProducto.css';

function AgregarProducto({ onCrear, onCancelar }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        id_categoria: '',
        tipo: '',
        stock: '',
        precio: '',
        activo: true,
        descripcion: '',
    });

    const [categorias, setCategorias] = useState([]);
    const [imagenNombre, setImagenNombre] = useState('');
    const [errores, setErrores] = useState({});

    // Obtener las categorías reales de la tienda desde la DB
    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const tiendaIdRaw = localStorage.getItem('id_tienda');
                const tiendaId = Number(tiendaIdRaw);

                if (!tiendaIdRaw || Number.isNaN(tiendaId)) {
                    console.error('No se encontró un id_tienda válido.');
                    return;
                }

                const data = await getCategoriasPorTienda(tiendaId);

                const categoriasDB = Array.isArray(data)
                    ? data
                    : data?.categorias ?? [];

                setCategorias(categoriasDB);

                // Seleccionar automáticamente la primera categoría
                // solamente si existen categorías
                if (categoriasDB.length > 0) {
                    setFormulario(datosPrevios => ({
                        ...datosPrevios,
                        categoria:
                            datosPrevios.categoria ||
                            categoriasDB[0].id_categoria
                    }));
                }
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                setCategorias([]);
            }
        };

        cargarCategorias();
    }, []);

    const precioPreview = useMemo(() => {
        const precioNumerico = Number(formulario.precio);
        if (!precioNumerico) return '$0';
        return `$${precioNumerico.toLocaleString('es-AR')}`;
    }, [formulario.precio]);

    const actualizarCampo = (campo, valor) => {
        setFormulario(datosPrevios => ({
            ...datosPrevios,
            [campo]: valor
        }));

        setErrores(erroresPrevios => ({
            ...erroresPrevios,
            [campo]: ''
        }));
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formulario.nombre.trim()) {
            nuevosErrores.nombre = 'Ingresá el nombre del producto.';
        }

        if (!formulario.stock || Number(formulario.stock) < 0) {
            nuevosErrores.stock = 'Ingresá un stock válido.';
        }

        if (!formulario.precio || Number(formulario.precio) <= 0) {
            nuevosErrores.precio = 'Ingresá un precio mayor a cero.';
        }

        // Si el producto se publica en tienda,
        // debe tener una categoría seleccionada.
        if (formulario.activo && !formulario.categoria) {
            nuevosErrores.categoria = 'Seleccioná una categoría.';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const crearProducto = async (event) => {
        event.preventDefault();

        if (!validarFormulario()) return;

        const tiendaIdRaw = localStorage.getItem('id_tienda');
        const tiendaId = Number(tiendaIdRaw);
        const tiendaIdFinal =
            tiendaIdRaw && !Number.isNaN(tiendaId)
                ? tiendaId
                : 1;

        if (!tiendaIdRaw || Number.isNaN(tiendaId)) {
            localStorage.setItem('id_tienda', String(tiendaIdFinal));
        }

        const payload = {
            nombre: formulario.nombre.trim(),
            tipo: formulario.tipo.trim(),
            stock: Number(formulario.stock),
            precio: Number(formulario.precio),
            activo: formulario.activo,

            // Si el producto se publica, se guarda su categoría.
            // Si no se publica, no se le asigna categoría.
            id_categoria: formulario.activo
                ? Number(formulario.categoria)
                : null,

            // Descripción propia del producto
            descripcion: formulario.descripcion.trim(),

            imagen: imagenNombre,
            id_tienda: tiendaIdFinal,
        };

        try {
            const data = await insertProducto(payload);

            // Asumo que el backend retorna el producto creado;
            // ajustá según tu API si devuelve otra estructura.
            const productoCreado =
                data.producto ?? data.data ?? data;

            onCrear(productoCreado);
        } catch (err) {
            const mensaje =
                err.message || 'No se pudo crear el producto.';

            alert(mensaje);
        }
    };

    return (
        <section
            className="agregarProducto"
            aria-labelledby="agregarProductoTitulo"
        >
            <div className="agregarProductoHeader">
                <div>
                    <span className="agregarProductoEyebrow">
                        Inventario
                    </span>

                    <h2 id="agregarProductoTitulo">
                        Agregar producto
                    </h2>

                    <p>
                        Cargá la información principal para dejarlo listo
                        en tu galería.
                    </p>
                </div>

                <button
                    className="agregarProductoCerrar"
                    onClick={onCancelar}
                    aria-label="Cerrar formulario"
                >
                    <IconoCerrar />
                </button>
            </div>

            <form
                className="agregarProductoContenido"
                onSubmit={crearProducto}
            >
                <label className="agregarProductoImagen">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            setImagenNombre(
                                event.target.files?.[0]?.name || ''
                            )
                        }
                    />

                    <IconoImagen />

                    <strong>
                        {imagenNombre || 'Foto del producto'}
                    </strong>

                    <span>
                        {imagenNombre
                            ? 'Imagen lista para previsualizar'
                            : 'PNG o JPG, ideal fondo claro'}
                    </span>
                </label>

                <div className="agregarProductoCampos">

                    <div className="agregarProductoCampo agregarProductoCampo--doble">
                        <label htmlFor="productoNombre">
                            Nombre del producto
                        </label>

                        <input
                            id="productoNombre"
                            type="text"
                            placeholder="Ej: Remera oversize negra"
                            value={formulario.nombre}
                            onChange={(event) =>
                                actualizarCampo(
                                    'nombre',
                                    event.target.value
                                )
                            }
                        />

                        {errores.nombre && (
                            <span className="agregarProductoError">
                                {errores.nombre}
                            </span>
                        )}
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoTipo">
                            Tipo
                        </label>

                        <input
                            id="productoTipo"
                            type="text"
                            placeholder="Ej: Remera"
                            value={formulario.tipo}
                            onChange={(event) =>
                                actualizarCampo(
                                    'tipo',
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoStock">
                            Stock
                        </label>

                        <input
                            id="productoStock"
                            type="number"
                            min="0"
                            placeholder="12"
                            value={formulario.stock}
                            onChange={(event) =>
                                actualizarCampo(
                                    'stock',
                                    event.target.value
                                )
                            }
                        />

                        {errores.stock && (
                            <span className="agregarProductoError">
                                {errores.stock}
                            </span>
                        )}
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoPrecio">
                            Precio
                        </label>

                        <input
                            id="productoPrecio"
                            type="number"
                            min="0"
                            placeholder="28500"
                            value={formulario.precio}
                            onChange={(event) =>
                                actualizarCampo(
                                    'precio',
                                    event.target.value
                                )
                            }
                        />

                        {errores.precio && (
                            <span className="agregarProductoError">
                                {errores.precio}
                            </span>
                        )}
                    </div>

                    <div className="agregarProductoCampo agregarProductoCampo--doble">
                        <label htmlFor="productoDescripcion">
                            Descripción breve
                        </label>

                        <textarea
                            id="productoDescripcion"
                            rows="3"
                            placeholder="Material, estilo, colores disponibles o cualquier dato útil."
                            value={formulario.descripcion}
                            onChange={(event) =>
                                actualizarCampo(
                                    'descripcion',
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <label className="agregarProductoSwitch">
                        <input
                            type="checkbox"
                            checked={formulario.activo}
                            onChange={(event) =>
                                actualizarCampo(
                                    'activo',
                                    event.target.checked
                                )
                            }
                        />

                        <span />

                        Publicar en tienda
                    </label>

                    {/* CATEGORÍA: SOLO SI EL PRODUCTO ESTÁ PUBLICADO */}
                    {formulario.activo && (
                        <div className="agregarProductoCampo agregarProductoCampo--doble">
                            <label htmlFor="productoCategoria">
                                Categoría
                            </label>

                            <select
                                id="productoCategoria"
                                value={formulario.categoria}
                                onChange={(event) =>
                                    actualizarCampo(
                                        'categoria',
                                        event.target.value
                                    )
                                }
                                disabled={categorias.length === 0}
                            >
                                {categorias.length === 0 ? (
                                    <option value="">
                                        No hay categorías disponibles
                                    </option>
                                ) : (
                                    categorias.map(categoria => (
                                        <option
                                            key={categoria.id_categoria}
                                            value={categoria.id_categoria}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))
                                )}
                            </select>

                            {errores.categoria && (
                                <span className="agregarProductoError">
                                    {errores.categoria}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="agregarProductoResumen">
                        <span>Vista rápida</span>

                        <strong>
                            {formulario.nombre || 'Nuevo producto'}
                        </strong>

                        <p>
                            {formulario.tipo || 'Tipo'} · Stock:{' '}
                            {formulario.stock || 0} uds. ·{' '}
                            {precioPreview}
                        </p>
                    </div>
                </div>

                <div className="agregarProductoAcciones">
                    <button
                        type="button"
                        className="agregarProductoBtnSecundario"
                        onClick={onCancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="agregarProductoBtnPrincipal"
                    >
                        Guardar producto
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AgregarProducto;

