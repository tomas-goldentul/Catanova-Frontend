import { useEffect, useMemo, useState } from 'react';
import { insertProducto, subirImagen } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import { IconoImagen, IconoCerrar } from '../Icons/Icons';
import './AgregarProducto.css';

const IconoCheck = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

function AgregarProducto({ onCrear, onCancelar }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        categoria: '',
        tipo: '',
        stock: '',
        precio: '',
        activo: true,
        descripcion: '',
    });

    const [categorias, setCategorias] = useState([]);
    const [imagenArchivo, setImagenArchivo] = useState(null);
    const [imagenNombre, setImagenNombre] = useState('');
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [errores, setErrores] = useState({});

    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const data = await getCategorias();

                const categoriasDB = Array.isArray(data)
                    ? data
                    : data?.categorias ?? [];

                setCategorias(categoriasDB);

                if (categoriasDB.length > 0) {
                    setFormulario(datosPrevios => ({
                        ...datosPrevios,
                        categoria:
                            datosPrevios.categoria ||
                            String(categoriasDB[0].id_categoria)
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

        try {
            let imagenPath = '';
            if (imagenArchivo) {
                setSubiendoImagen(true);
                try {
                    const datosImagen = await subirImagen(imagenArchivo);
                    imagenPath = datosImagen?.path ?? '';
                } finally {
                    setSubiendoImagen(false);
                }
            }

            const payload = {
                nombre: formulario.nombre.trim(),
                tipo: formulario.tipo.trim(),
                stock: Number(formulario.stock),
                precio: Number(formulario.precio),
                activo: formulario.activo,
                estado: formulario.activo,
                id_categoria: Number(formulario.categoria) || null,
                descripcion: formulario.descripcion.trim(),
                imagen: imagenPath,
                id_tienda: tiendaIdFinal,
            };

            const data = await insertProducto(payload);

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
                        <IconoCheck /> Nuevo producto
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
                        onChange={(event) => {
                            const archivo = event.target.files?.[0] || null;
                            setImagenArchivo(archivo);
                            setImagenNombre(archivo?.name || '');
                        }}
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
                        disabled={subiendoImagen}
                    >
                        {subiendoImagen
                            ? 'Subiendo imagen…'
                            : 'Guardar producto'}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AgregarProducto;
