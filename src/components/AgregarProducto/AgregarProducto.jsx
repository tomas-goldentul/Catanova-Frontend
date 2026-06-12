import { useMemo, useState } from 'react';
import { insertProducto } from '../../api/productos';
import { IconoImagen, IconoCerrar } from '../Icons/Icons';
import './AgregarProducto.css';

const TALLES = ['Talle XS', 'Talle S', 'Talle M', 'Talle L', 'Talle XL', 'Talle 40', 'Único'];
const CATEGORIAS = ['Remeras', 'Pantalones', 'Calzado', 'Abrigos', 'Accesorios'];

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

    const crearProducto = async (event) => {
        event.preventDefault();
        if (!validarFormulario()) return;

        const payload = {
            nombre: formulario.nombre.trim(),
            talle: formulario.talle,
            stock: Number(formulario.stock),
            precio: Number(formulario.precio), // enviar número, no string formateada
            activo: formulario.activo,
            categoria: formulario.categoria,
            descripcion: formulario.descripcion.trim(),
            id_tienda: 1, // ID de tienda fijo por ahora; ajustá según tu lógica
            imagen: imagenNombre,
        };

        try {
            const data = await insertProducto(payload);
            // Asumo que el backend retorna el producto creado; ajustá según tu API:
            const productoCreado = data.producto ?? data.data ?? data;
            onCrear(productoCreado);
            // opcional: limpiar formulario o cerrar
        } catch (err) {
            // Mostrar error; el componente no tiene setMensaje global,
            // podés pasar un prop onError desde el padre o usar alert:
            const mensaje = err.message || 'No se pudo crear el producto.';
            alert(mensaje);
        }
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
