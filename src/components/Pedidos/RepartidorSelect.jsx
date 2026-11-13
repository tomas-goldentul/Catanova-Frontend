import { useEffect, useMemo, useState } from 'react';
import { buscarRepartidores, crearRepartidor, normalizarNombre } from '../../api/repartidores';

function RepartidorSelect({ value = '', onChange, label = 'Repartidor', disabled = false, idTienda = null, className = '' }) {
  const [opciones, setOpciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [consulta, setConsulta] = useState(String(value ?? ''));

  useEffect(() => {
    setConsulta(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    const texto = consulta.trim();
    if (!texto) {
      setOpciones([]);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setCargando(true);
        setError('');
        const lista = await buscarRepartidores({ q: texto, id_tienda: idTienda }, controller.signal);
        
        setOpciones(
            lista
            .map((item) => ({
                id: item.id_repartidor ?? item.id ?? null,
                nombre: item.nombre || item.name || item.repartidor || '',
            }))
            .filter((item) => item.id !== null && item.nombre !== '')
        );
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'No se pudo buscar repartidores.');
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [consulta, idTienda]);

  const coincide = useMemo(() => {
    const texto = consulta.trim();
    if (!texto) return false;
    return opciones.some((item) => normalizarNombre(item.nombre) === normalizarNombre(texto));
  }, [consulta, opciones]);

  const guardarNuevo = async () => {
    const nombre = consulta.trim();
    if (!nombre || coincide) return;

    try {
      setGuardando(true);
      setError('');
      const creado = await crearRepartidor({ nombre, id_tienda: idTienda });
      const nombreCreado = creado?.nombre || creado?.name || creado?.repartidor || nombre;
      setOpciones((actuales) => [{ id: creado?.id_repartidor ?? creado?.id ?? Date.now(), nombre: nombreCreado }, ...actuales]);
      onChange?.(nombreCreado);
      setConsulta(nombreCreado);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el repartidor.');
    } finally {
      setGuardando(false);
    }
  };

  const seleccionar = (nombre) => {
    setConsulta(nombre);
    onChange?.(nombre);
  };

  return (
    <label className={`repartidor-field ${className}`.trim()}>
      <span>{label}</span>
      <div className="repartidor-input-row">
        <input
          type="text"
          list="repartidores-sugerencias"
          value={consulta}
          onChange={(event) => setConsulta(event.target.value)}
          onBlur={() => {
            const nombre = consulta.trim();
            if (nombre) onChange?.(nombre);
          }}
          disabled={disabled}
          placeholder="Buscar o escribir un repartidor"
          autoComplete="off"
        />
        {!cargando && consulta.trim() && !coincide && !guardando && (
          <button type="button" className="repartidor-crear" onClick={guardarNuevo} disabled={disabled}>
            Guardar repartidor
          </button>
        )}
      </div>
      <datalist id="repartidores-sugerencias">
        {opciones.map((item) => (
          <option key={item.id ?? item.nombre} value={item.nombre} />
        ))}
      </datalist>
      {cargando && <small>Cargando repartidores…</small>}
      {guardando && <small>Guardando repartidor…</small>}
      {error && <small className="repartidor-error">{error}</small>}
    </label>
  );
}

export default RepartidorSelect;
