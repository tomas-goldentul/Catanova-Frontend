import { useMemo, useState } from 'react';
import './AgregarProducto.css';

const TALLES = ['Talle XS', 'Talle S', 'Talle M', 'Talle L', 'Talle XL', 'Talle 40', 'Único'];
const CATEGORIAS = ['Remeras', 'Pantalones', 'Calzado', 'Abrigos', 'Accesorios'];

const IconoImagen = () => (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 16l5-5 4 4 3-3 6 6" />
        <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
);

const IconoCerrar = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function AgregarProducto({ onCrear, onCancelar }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        categoria: CATEGORIAS[0],
        talle: TALLES[2],
        stock: '',
        precio: '',
        activo: true,
        descripcion: '',
    });
    const [imagenNombre, setImagenNombre] = useState('');
    const [errores, setErrores] = useState({});

    const precioPreview = useMemo(() => {
        const precioNumerico = Number(formulario.precio);
        if (!precioNumerico) return '$0';
        return `$${precioNumerico.toLocaleString('es-AR')}`;
    }, [formulario.precio]);

    const actualizarCampo = (campo, valor) => {
        setFormulario(datosPrevios => ({ ...datosPrevios, [campo]: valor }));
        setErrores(erroresPrevios => ({ ...erroresPrevios, [campo]: '' }));
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Ingresá el nombre del producto.';
        if (!formulario.stock || Number(formulario.stock) < 0) nuevosErrores.stock = 'Ingresá un stock válido.';
        if (!formulario.precio || Number(formulario.precio) <= 0) nuevosErrores.precio = 'Ingresá un precio mayor a cero.';

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const crearProducto = (event) => {
        event.preventDefault();
        if (!validarFormulario()) return;

        onCrear({
            id: Date.now(),
            nombre: formulario.nombre.trim(),
            talle: formulario.talle,
            stock: Number(formulario.stock),
            precio: precioPreview,
            activo: formulario.activo,
            categoria: formulario.categoria,
            descripcion: formulario.descripcion.trim(),
            imagenNombre,
        });
    };

    return (
        <section className="agregarProducto" aria-labelledby="agregarProductoTitulo">
            <div className="agregarProductoHeader">
                <div>
                    <span className="agregarProductoEyebrow">Inventario</span>
                    <h2 id="agregarProductoTitulo">Agregar producto</h2>
                    <p>Cargá la información principal para dejarlo listo en tu galería.</p>
                </div>
                <button className="agregarProductoCerrar" onClick={onCancelar} aria-label="Cerrar formulario">
                    <IconoCerrar />
                </button>
            </div>

            <form className="agregarProductoContenido" onSubmit={crearProducto}>
                <label className="agregarProductoImagen">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setImagenNombre(event.target.files?.[0]?.name || '')}
                    />
                    <IconoImagen />
                    <strong>{imagenNombre || 'Foto del producto'}</strong>
                    <span>{imagenNombre ? 'Imagen lista para previsualizar' : 'PNG o JPG, ideal fondo claro'}</span>
                </label>

                <div className="agregarProductoCampos">
                    <div className="agregarProductoCampo agregarProductoCampo--doble">
                        <label htmlFor="productoNombre">Nombre del producto</label>
                        <input
                            id="productoNombre"
                            type="text"
                            placeholder="Ej: Remera oversize negra"
                            value={formulario.nombre}
                            onChange={(event) => actualizarCampo('nombre', event.target.value)}
                        />
                        {errores.nombre && <span className="agregarProductoError">{errores.nombre}</span>}
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoCategoria">Categoría</label>
                        <select
                            id="productoCategoria"
                            value={formulario.categoria}
                            onChange={(event) => actualizarCampo('categoria', event.target.value)}
                        >
                            {CATEGORIAS.map(categoria => (
                                <option key={categoria} value={categoria}>{categoria}</option>
                            ))}
                        </select>
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoTalle">Talle</label>
                        <select
                            id="productoTalle"
                            value={formulario.talle}
                            onChange={(event) => actualizarCampo('talle', event.target.value)}
                        >
                            {TALLES.map(talle => (
                                <option key={talle} value={talle}>{talle}</option>
                            ))}
                        </select>
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoStock">Stock</label>
                        <input
                            id="productoStock"
                            type="number"
                            min="0"
                            placeholder="12"
                            value={formulario.stock}
                            onChange={(event) => actualizarCampo('stock', event.target.value)}
                        />
                        {errores.stock && <span className="agregarProductoError">{errores.stock}</span>}
                    </div>

                    <div className="agregarProductoCampo">
                        <label htmlFor="productoPrecio">Precio</label>
                        <input
                            id="productoPrecio"
                            type="number"
                            min="0"
                            placeholder="28500"
                            value={formulario.precio}
                            onChange={(event) => actualizarCampo('precio', event.target.value)}
                        />
                        {errores.precio && <span className="agregarProductoError">{errores.precio}</span>}
                    </div>

                    <div className="agregarProductoCampo agregarProductoCampo--doble">
                        <label htmlFor="productoDescripcion">Descripción breve</label>
                        <textarea
                            id="productoDescripcion"
                            rows="3"
                            placeholder="Material, estilo, colores disponibles o cualquier dato útil."
                            value={formulario.descripcion}
                            onChange={(event) => actualizarCampo('descripcion', event.target.value)}
                        />
                    </div>

                    <label className="agregarProductoSwitch">
                        <input
                            type="checkbox"
                            checked={formulario.activo}
                            onChange={(event) => actualizarCampo('activo', event.target.checked)}
                        />
                        <span />
                        Publicar en tienda
                    </label>

                    <div className="agregarProductoResumen">
                        <span>Vista rápida</span>
                        <strong>{formulario.nombre || 'Nuevo producto'}</strong>
                        <p>{formulario.talle} · Stock: {formulario.stock || 0} uds. · {precioPreview}</p>
                    </div>
                </div>

                <div className="agregarProductoAcciones">
                    <button type="button" className="agregarProductoBtnSecundario" onClick={onCancelar}>
                        Cancelar
                    </button>
                    <button type="submit" className="agregarProductoBtnPrincipal">
                        Guardar producto
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AgregarProducto;
