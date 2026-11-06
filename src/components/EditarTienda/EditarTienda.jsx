import { useEffect, useRef, useState } from 'react';
import {
  getNombre,
  getSlogan,
  getTodasLasTiendas,
} from '../../api/tiendas';
import { useTemaTienda } from '../../tema/temaTiendaContexto';
import { PALETA_DEFAULT } from '../../tema/paleta';
import './EditarTienda.css';

const PRESETS_TIENDA = [
  {
    id: 'original',
    nombre: 'Original',
    primario: PALETA_DEFAULT.primario,
    secundario: PALETA_DEFAULT.secundario,
    fondo: PALETA_DEFAULT.fondo,
  },
  {
    id: 'azul',
    nombre: 'Azul premium',
    primario: '#082567',
    secundario: '#14B8A6',
    fondo: '#F8FBFF',
  },
  {
    id: 'verde',
    nombre: 'Verde bosque',
    primario: '#1F6F4D',
    secundario: '#F0B429',
    fondo: '#F4FBF6',
  },
  {
    id: 'rojo',
    nombre: 'Rojo fuego',
    primario: '#A52A2A',
    secundario: '#F97316',
    fondo: '#FFF7F3',
  },
  {
    id: 'morado',
    nombre: 'Morado nocturno',
    primario: '#4C1D95',
    secundario: '#A78BFA',
    fondo: '#F5F3FF',
  },
  {
    id: 'gris',
    nombre: 'Minimalista',
    primario: '#1F2937',
    secundario: '#8B5CF6',
    fondo: '#F9FAFB',
  },
];

function EditarTienda({ idTienda, onGuardar, onCancelar }) {
  const { previsualizar, confirmar, restaurar } = useTemaTienda();
  const guardadoRef = useRef(false);

  const [formulario, setFormulario] = useState({
    nombre: '',
    slogan: '',
    telefono: '',
    direccion: '',
    fechaCreacion: '',
    rating: '',
    colorPrincipal: PALETA_DEFAULT.primario,
    colorSecundario: PALETA_DEFAULT.secundario,
    colorFondo: PALETA_DEFAULT.fondo,
  });

  const [cargando, setCargando] = useState(Boolean(idTienda));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const errorVisible = idTienda ? error : 'No se encontró una tienda válida.';
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    return () => {
      if (!guardadoRef.current) restaurar();
    };
  }, [restaurar]);

  useEffect(() => {
    async function cargarTienda() {
      try {
        setCargando(true);
        setError('');

        const [nombreData, sloganData, tiendas] = await Promise.all([
          getNombre(idTienda),
          getSlogan(idTienda),
          getTodasLasTiendas(),
        ]);

        const tienda = tiendas.find(
          (t) => Number(t.id_tienda ?? t.id) === Number(idTienda)
        );

        setFormulario({
          nombre: nombreData?.nombre ?? '',
          slogan: sloganData?.slogan ?? '',
          telefono: tienda?.telefono ?? '',
          direccion: tienda?.direccion ?? '',
          fechaCreacion: tienda?.establecimiento ?? '',
          rating: tienda?.rating ?? null,
          colorPrincipal: tienda?.color_primario ?? PALETA_DEFAULT.primario,
          colorSecundario: tienda?.color_secundario ?? PALETA_DEFAULT.secundario,
          colorFondo: tienda?.color_terciario ?? PALETA_DEFAULT.fondo,
        });
      } catch (e) {
        setError('No se pudieron cargar los datos de la tienda.');
        console.error(e);
      } finally {
        setCargando(false);
      }
    }

    if (!idTienda) return;

    cargarTienda();
  }, [idTienda]);

  useEffect(() => {
    if (cargando) return;
    previsualizar({
      primario: formulario.colorPrincipal,
      secundario: formulario.colorSecundario,
      fondo: formulario.colorFondo,
    });
  }, [
    cargando,
    formulario.colorPrincipal,
    formulario.colorSecundario,
    formulario.colorFondo,
    previsualizar,
  ]);

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const aplicarPreset = (preset) => {
    const siguiente = {
      colorPrincipal: preset.primario,
      colorSecundario: preset.secundario,
      colorFondo: preset.fondo,
    };

    setFormulario((actual) => ({
      ...actual,
      ...siguiente,
    }));

    previsualizar({
      primario: siguiente.colorPrincipal,
      secundario: siguiente.colorSecundario,
      fondo: siguiente.colorFondo,
    });
  };

  const volver = () => {
    restaurar();
    onCancelar?.();
  };

  async function guardarCambios(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!formulario.nombre.trim()) {
      setError('El nombre de la tienda es obligatorio.');
      return;
    }

    if (!formulario.slogan.trim()) {
      setError('El slogan es obligatorio.');
      return;
    }

    const anio = Number(formulario.fechaCreacion);

    if (
      !Number.isInteger(anio) ||
      anio < 1800 ||
      anio > new Date().getFullYear()
    ) {
      setError('Ingresá un año de establecimiento válido.');
      return;
    }

    try {
      setGuardando(true);

      if (!onGuardar) {
        setError(
          'La vista está lista, pero falta conectar el endpoint para guardar los cambios.'
        );
        return;
      }

      const datos = {
        id_tienda: Number(idTienda),
        nombre: formulario.nombre.trim(),
        slogan: formulario.slogan.trim(),
        telefono: formulario.telefono.trim(),
        direccion: formulario.direccion.trim(),
        establecimiento: anio,
        color_primario: formulario.colorPrincipal,
        color_secundario: formulario.colorSecundario,
        color_terciario: formulario.colorFondo,
      };

      await onGuardar(datos);

      guardadoRef.current = true;
      confirmar({
        primario: datos.color_primario,
        secundario: datos.color_secundario,
        fondo: datos.color_terciario,
      });

      setMensaje('Cambios guardados correctamente.');
    } catch (e) {
      setError(e.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="editar-tienda-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) volver();
      }}
    >
      <main
        className="editar-tienda"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-tienda-titulo"
      >
        {cargando ? (
          <p className="editar-tienda__estado">Cargando datos de la tienda...</p>
        ) : (
          <form className="editar-tienda__form" onSubmit={guardarCambios}>
            <header className="editar-tienda__header">
              <p className="editar-tienda__kicker">Tu tienda</p>
              <h1 id="editar-tienda-titulo">Editar tienda</h1>
              <p className="editar-tienda__ayuda">
                El nombre, el slogan y la paleta se ven en todo el sitio. Los colores cambian al instante y se guardan con Aceptar.
              </p>
            </header>

            <div className="editar-tienda__campo">
              <label htmlFor="nombreTienda">Nombre tienda</label>
              <input
                id="nombreTienda"
                value={formulario.nombre}
                onChange={(e) => cambiarCampo('nombre', e.target.value)}
                required
              />
            </div>

            <div className="editar-tienda__campo">
              <label htmlFor="sloganTienda">Slogan</label>
              <input
                id="sloganTienda"
                value={formulario.slogan}
                onChange={(e) => cambiarCampo('slogan', e.target.value)}
                required
              />
            </div>

            <div className="editar-tienda__fila">
              <div className="editar-tienda__campo">
                <label htmlFor="fechaTienda">Año de establecimiento</label>
                <input
                  id="fechaTienda"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formulario.fechaCreacion}
                  onChange={(e) => cambiarCampo('fechaCreacion', e.target.value)}
                />
              </div>

              <div className="editar-tienda__campo">
                <label htmlFor="ratingTienda">Rating</label>
                <input
                  id="ratingTienda"
                  type="text"
                  value={
                    formulario.rating != null
                      ? `${Number(formulario.rating).toFixed(1)} / 5`
                      : 'Sin valoraciones'
                  }
                  readOnly
                />
              </div>
            </div>

            <fieldset className="editar-tienda__colores">
              <legend>Paleta de colores</legend>

              { [
                ['colorPrincipal', 'Color principal'],
                ['colorSecundario', 'Color secundario'],
                ['colorFondo', 'Color de fondo'],
              ].map(([campo, etiqueta]) => (
                <label className="editar-tienda__color" key={campo}>
                  <input
                    type="color"
                    aria-label={etiqueta}
                    value={formulario[campo]}
                    onChange={(e) => cambiarCampo(campo, e.target.value)}
                  />

                  <span>
                    <strong>{etiqueta}</strong>
                    {formulario[campo].replace('#', '').toUpperCase()}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="editar-tienda__presets">
              <div className="editar-tienda__presets-header">
                <span>Presets</span>
                <button
                  type="button"
                  className="editar-tienda__preset-original"
                  onClick={() => aplicarPreset(PRESETS_TIENDA[0])}
                >
                  Preset original
                </button>
              </div>

              <div className="editar-tienda__preset-list">
                {PRESETS_TIENDA.map((preset) => {
                  const activo =
                    preset.primario === formulario.colorPrincipal &&
                    preset.secundario === formulario.colorSecundario &&
                    preset.fondo === formulario.colorFondo;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`editar-tienda__preset ${activo ? 'editar-tienda__preset--activo' : ''}`}
                      onClick={() => aplicarPreset(preset)}
                      aria-pressed={activo}
                    >
                      <span className="editar-tienda__preset-swatches" aria-hidden="true">
                        <i style={{ background: preset.primario }} />
                        <i style={{ background: preset.secundario }} />
                        <i style={{ background: preset.fondo }} />
                      </span>
                      <span>{preset.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorVisible && <p className="editar-tienda__error">{errorVisible}</p>}
            {mensaje && <p className="editar-tienda__mensaje">{mensaje}</p>}

            <div className="editar-tienda__acciones">
              <button
                type="button"
                className="editar-tienda__btn editar-tienda__btn--secundario"
                onClick={volver}
                disabled={guardando}
              >
                Volver
              </button>
              <button
                type="submit"
                className="editar-tienda__btn editar-tienda__btn--primario"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Aceptar cambios'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default EditarTienda;
