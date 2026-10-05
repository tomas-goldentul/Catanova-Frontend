import { useEffect, useId, useRef, useState } from 'react';
import { FiCheckCircle, FiMapPin } from 'react-icons/fi';
import { buscarDirecciones, formatoDireccionValido, MAX_DIRECCION, normalizarTexto, tieneNumero } from '../../api/direcciones';
import './CampoDireccion.css';

/**
 * Campo de dirección con desplegable de sugerencias (Georef).
 * `onChange(texto, valida)`: valida es true solo si el texto salió de una sugerencia real
 * (o, si el servicio no responde, si al menos tiene calle y número).
 */
function CampoDireccion({ label = 'Dirección', value, valida, onChange, disabled = false, requerida = true }) {
  const inputId = useId();
  const listaId = `${inputId}-lista`;
  // Resultado de la última búsqueda; `consulta` indica para qué texto es (si no coincide, está desactualizado).
  const [resultado, setResultado] = useState({ consulta: '', sugerencias: [], sinServicio: false });
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    const texto = (value ?? '').trim();
    // Una dirección ya validada (elegida de la lista o confirmada) no se vuelve a buscar.
    if (!texto || valida || !tieneNumero(texto)) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const sugerencias = await buscarDirecciones(texto, controller.signal);
        setResultado({ consulta: texto, sugerencias, sinServicio: false });
        setActiva(-1);

        // Direcciones ya guardadas ("Mitre 234, Rosario") se dan por válidas si coinciden con una real.
        // Sin localidad la dirección es ambigua (hay una "Mitre 234" en muchas ciudades): ahí se elige de la lista.
        const normal = normalizarTexto(texto);
        const coincide = texto.includes(',') && sugerencias.some((item) => {
          const candidata = normalizarTexto(item.texto);
          return candidata === normal || candidata.startsWith(`${normal},`);
        });
        if (coincide) {
          setAbierto(false);
          onChangeRef.current(texto, true);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setResultado({ consulta: texto, sugerencias: [], sinServicio: Boolean(err.sinServicio) });
        if (err.sinServicio) onChangeRef.current(texto, formatoDireccionValido(texto));
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, valida]);

  const texto = (value ?? '').trim();
  const actual = resultado.consulta === texto;
  const sugerencias = actual && !valida ? resultado.sugerencias : [];
  const buscando = Boolean(texto) && !valida && tieneNumero(texto) && !actual;
  const sinServicio = actual && resultado.sinServicio;

  const escribir = (event) => {
    setAbierto(true);
    onChange(event.target.value.slice(0, MAX_DIRECCION), false);
  };

  const elegir = (sugerencia) => {
    setAbierto(false);
    onChange(sugerencia.texto, true);
  };

  const teclado = (event) => {
    if (!abierto || !sugerencias.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiva((a) => (a + 1) % sugerencias.length); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiva((a) => (a <= 0 ? sugerencias.length - 1 : a - 1)); }
    else if (event.key === 'Enter' && activa >= 0) { event.preventDefault(); elegir(sugerencias[activa]); }
    else if (event.key === 'Escape') setAbierto(false);
  };

  let mensaje = null;
  if (texto && !valida) {
    if (!tieneNumero(texto)) mensaje = { tipo: 'aviso', texto: 'Escribí la calle y el número (podés sumar la localidad: “Mitre 234, Rosario”).' };
    else if (buscando) mensaje = { tipo: 'info', texto: 'Buscando direcciones…' };
    else if (actual && !sinServicio && !sugerencias.length) mensaje = { tipo: 'error', texto: 'No encontramos esa dirección. Revisá la calle, el número o agregá la localidad.' };
    else if (sugerencias.length) mensaje = { tipo: 'aviso', texto: 'Elegí una de las direcciones sugeridas para validarla.' };
  } else if (valida && sinServicio) {
    mensaje = { tipo: 'aviso', texto: 'No pudimos verificar la dirección (servicio no disponible). Se usará tal como la escribiste.' };
  }

  return (
    <div className="campo-direccion">
      <label htmlFor={inputId}>{label}{requerida ? '' : ' (opcional)'}</label>
      <div className="campo-direccion-control">
        <FiMapPin aria-hidden="true" className="campo-direccion-icono" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={abierto && sugerencias.length > 0}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-invalid={Boolean(texto) && !valida}
          value={value}
          onChange={escribir}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={teclado}
          placeholder="Calle y número, Localidad"
          autoComplete="off"
          maxLength={MAX_DIRECCION}
          disabled={disabled}
          className={valida ? 'campo-direccion-input is-valida' : 'campo-direccion-input'}
        />
        {valida && <FiCheckCircle aria-label="Dirección válida" className="campo-direccion-ok" />}
        {abierto && sugerencias.length > 0 && (
          <ul id={listaId} role="listbox" className="campo-direccion-lista">
            {sugerencias.map((sugerencia, index) => (
              <li
                key={sugerencia.texto}
                role="option"
                aria-selected={index === activa}
                className={index === activa ? 'activa' : ''}
                onMouseDown={(event) => { event.preventDefault(); elegir(sugerencia); }}
                onMouseEnter={() => setActiva(index)}
              >
                <FiMapPin aria-hidden="true" />
                <span>{sugerencia.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {mensaje && <p className={`campo-direccion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
    </div>
  );
}

export default CampoDireccion;
