import { useEffect, useState } from 'react';
import { getCategorias, crearCategoria } from '../../api/categorias';
import './GestionCategorias.css';

function interpretarError(mensaje) {
    if (!mensaje) return 'No se pudo crear la categoría. Intentá de nuevo.';
    if (/ya existe/i.test(mensaje)) return 'Ya existe una categoría con ese nombre.';
    if (/ingresa un nombre/i.test(mensaje)) return 'Ingresá un nombre para la categoría.';
    if (/failed to fetch|network/i.test(mensaje)) return 'No se pudo conectar con el servidor.';
    return mensaje;
}

function PanelCrear({ existentes, onCrear, onCancelar }) {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleSubmit = async () => {
        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) {
            setError('Ingresá un nombre para la categoría.');
            return;
        }

        // El backend compara nombres exactos (case-sensitive, sin trim ni normalización),
        // así que replicamos esa misma comparación acá para avisar antes de pegarle a la API.
        if (existentes.some(cat => cat.nombre === nombreLimpio)) {
            setError('Ya existe una categoría con ese nombre.');
            return;
        }

        setError('');
        setGuardando(true);
        try {
            const categoriaCreada = await crearCategoria(nombreLimpio);
            onCrear(categoriaCreada);
        } catch (err) {
            setError(interpretarError(err.message));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="gc-panel">
            <h2 className="gc-panel__titulo">Crear Categoría</h2>

            <div className="gc-campo gc-campo--nombre">
                <label className="gc-campo__label gc-campo__label--destacado" htmlFor="gc-nombre">
                    Nombre:
                </label>
                <input
                    id="gc-nombre"
                    className="gc-input"
                    type="text"
                    placeholder="Ej: Bebidas"
                    value={nombre}
                    onChange={e => { setNombre(e.target.value); setError(''); }}
                    disabled={guardando}
                />
            </div>

            {error && <p className="gc-error">{error}</p>}

            <div className="gc-acciones gc-acciones--derecha">
                <button className="gc-btn gc-btn--secundario" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                <button className="gc-btn gc-btn--principal" onClick={handleSubmit} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Agregar'}
                </button>
            </div>
        </div>
    );
}

function GestionCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [vista, setVista] = useState('lista');
    const [cargando, setCargando] = useState(true);
    const [errorLista, setErrorLista] = useState('');

    useEffect(() => {
        let cancelado = false;

        (async () => {
            setCargando(true);
            setErrorLista('');
            try {
                const data = await getCategorias();
                const lista = Array.isArray(data) ? data : data?.categorias ?? [];
                if (!cancelado) setCategorias(lista);
            } catch {
                if (!cancelado) setErrorLista('No se pudieron cargar las categorías.');
            } finally {
                if (!cancelado) setCargando(false);
            }
        })();

        return () => { cancelado = true; };
    }, []);

    const volverALista = () => setVista('lista');

    const handleCrear = (nuevaCategoria) => {
        setCategorias(prev => [...prev, nuevaCategoria]);
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

                    {cargando ? (
                        <p className="gc-vacio">Cargando categorías...</p>
                    ) : errorLista ? (
                        <p className="gc-error">{errorLista}</p>
                    ) : categorias.length === 0 ? (
                        <p className="gc-vacio">No hay categorías creadas todavía.</p>
                    ) : (
                        <ul className="gc-categorias-lista">
                            {categorias.map(cat => (
                                <li key={cat.id_categoria ?? cat.id} className="gc-categoria-item">
                                    <div className="gc-categoria-info">
                                        <span className="gc-categoria-nombre">{cat.nombre}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {vista === 'crear' && (
                <PanelCrear existentes={categorias} onCrear={handleCrear} onCancelar={volverALista} />
            )}
        </div>
    );
}

export default GestionCategorias;
