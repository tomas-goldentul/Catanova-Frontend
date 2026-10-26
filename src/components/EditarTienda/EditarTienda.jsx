```
import { useEffect, useState } from 'react';
import {
  getNombre,
  getSlogan,
  getTodasLasTiendas,
} from '../../api/tiendas';
import './EditarTienda.css';

function EditarTienda({ idTienda, onGuardar }) {
  const [formulario, setFormulario] = useState({
    nombre: '',
    slogan: '',
    fechaCreacion: '',
    colorPrincipal: '#082567',
    colorSecundario: '#14B8A6',
    colorFondo: '#FFFFFF',
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

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
          fechaCreacion: tienda?.fecha_creacion
            ? String(tienda.fecha_creacion).slice(0, 10)
            : '',
          colorPrincipal: tienda?.color_principal ?? '#082567',
          colorSecundario: tienda?.color_secundario ?? '#14B8A6',
          colorFondo: tienda?.color_fondo ?? '#FFFFFF',
        });
      } catch (e) {
        setError('No se pudieron cargar los datos de la tienda.');
        console.error(e);
      } finally {
        setCargando(false);
      }
    }

    if (idTienda) cargarTienda();
  }, [idTienda]);

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
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

    try {
      setGuardando(true);

      if (!onGuardar) {
        setError(
          'La vista está lista, pero falta conectar el endpoint para guardar los cambios.'
        );
        return;
      }

      await onGuardar({
        id_tienda: Number(idTienda),
        nombre: formulario.nombre.trim(),
        slogan: formulario.slogan.trim(),
        color_principal: formulario.colorPrincipal,
        color_secundario: formulario.colorSecundario,
        color_fondo: formulario.colorFondo,
      });

      setMensaje('Cambios guardados correctamente.');
    } catch (e) {
      setError(e.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p>Cargando datos de la tienda...</p>;

  return (
    <main className="editar-tienda">
      <form className="editar-tienda__form" onSubmit={guardarCambios}>
        <h1>Editar Tienda</h1>

        <div className="editar-tienda__campo">
          <label htmlFor="nombreTienda">Nombre Tienda:</label>
          <input
            id="nombreTienda"
            value={formulario.nombre}
            onChange={(e) => cambiarCampo('nombre', e.target.value)}
            required
          />
        </div>

        <div className="editar-tienda__campo">
          <label htmlFor="sloganTienda">Slogan:</label>
          <input
            id="sloganTienda"
            value={formulario.slogan}
            onChange={(e) => cambiarCampo('slogan', e.target.value)}
            required
          />
        </div>

        <div className="editar-tienda__campo">
          <label htmlFor="fechaTienda">Fecha de creación:</label>
          <input
            id="fechaTienda"
            type="date"
            value={formulario.fechaCreacion}
            readOnly
          />
        </div>

        <fieldset className="editar-tienda__colores">
          <legend>Paleta de colores:</legend>

          {[
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
              <span>{formulario[campo].replace('#', '').toUpperCase()}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="editar-tienda__error">{error}</p>}
        {mensaje && <p className="editar-tienda__mensaje">{mensaje}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Aceptar Cambios'}
        </button>
      </form>
    </main>
  );
}

export default EditarTienda;
```