import { useEffect, useMemo, useState } from 'react';
import { crearUsuarioParaTienda, getUsuariosPorTienda } from '../../api/usuarios';

function normalizarTexto(valor = '') {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function ClienteSelect({ value = '', onChange, label = 'Cliente', disabled = false, idTienda = null, className = '' }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [consulta, setConsulta] = useState(String(value ?? ''));

  useEffect(() => {
    setConsulta(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (!idTienda) {
      setUsuarios([]);
      return undefined;
    }

    const controller = new AbortController();
    let vivo = true;

    async function cargar() {
      try {
        setCargando(true);
        const data = await getUsuariosPorTienda(idTienda, controller.signal);
        if (!vivo) return;
        const lista = Array.isArray(data) ? data : (data?.data ?? data?.usuarios ?? []);
        setUsuarios(lista.filter((u) => {
          const nombre = [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim();
          return Boolean(nombre || u?.telefono || u?.id_usuario);
        }));
      } catch (err) {
        if (!vivo && err?.name === 'AbortError') return;
        if (!vivo) return;
        setError(err.message || 'No se pudo cargar la lista de clientes.');
      } finally {
        if (vivo) setCargando(false);
      }
    }

    cargar();
    return () => {
      vivo = false;
      controller.abort();
    };
  }, [idTienda]);

  const opciones = useMemo(() => {
    const texto = normalizarTexto(consulta);
    const base = usuarios.map((usuario) => {
      const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim();
      const telefono = usuario?.telefono || '';
      return {
        id: usuario?.id_usuario ?? usuario?.id ?? usuario?.idUsuario ?? null,
        nombre: nombreCompleto || 'Cliente sin nombre',
        telefono,
        etiqueta: [nombreCompleto, telefono].filter(Boolean).join(' · '),
      };
    });

    if (!texto) return base.slice(0, 12);
    return base.filter((item) => normalizarTexto(item.etiqueta).includes(texto)).slice(0, 12);
  }, [consulta, usuarios]);

  const coincide = useMemo(() => {
    const texto = normalizarTexto(consulta);
    if (!texto) return false;
    return opciones.some((item) => normalizarTexto(item.nombre) === texto || normalizarTexto(item.etiqueta) === texto);
  }, [consulta, opciones]);

  const guardarNuevo = async () => {
    const nombre = consulta.trim();
    if (!nombre || !idTienda || coincide) return;

    const partes = nombre.split(/\s+/);
    const nombrePrimero = partes.shift() || nombre;
    const apellido = partes.join(' ');

    try {
      setGuardando(true);
      setError('');
      const creado = await crearUsuarioParaTienda({
        nombre: nombrePrimero,
        apellido,
        telefono: '',
        direccion: '',
        id_tienda: idTienda,
      });

      const nombreFinal = [creado?.nombre || nombrePrimero, creado?.apellido || apellido].filter(Boolean).join(' ').trim() || nombre;
      setUsuarios((actuales) => [{ ...creado, nombre: creado?.nombre || nombrePrimero, apellido: creado?.apellido || apellido }, ...actuales]);
      setConsulta(nombreFinal);
      onChange?.(nombreFinal);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  const seleccionar = (texto) => {
    setConsulta(texto);
    onChange?.(texto);
  };

  return (
    <label className={`cliente-field ${className}`.trim()}>
      <span>{label}</span>
      <div className="cliente-input-row">
        <input
          type="text"
          list="clientes-sugerencias"
          value={consulta}
          onChange={(event) => setConsulta(event.target.value)}
          onBlur={() => {
            const texto = consulta.trim();
            if (texto) onChange?.(texto);
          }}
          disabled={disabled}
          placeholder="Buscar o escribir un cliente"
          autoComplete="off"
        />
        {!cargando && consulta.trim() && !coincide && !guardando && (
          <button type="button" className="cliente-crear" onClick={guardarNuevo} disabled={disabled}>
            Guardar cliente
          </button>
        )}
      </div>
      <datalist id="clientes-sugerencias">
        {opciones.map((item) => (
          <option key={item.id ?? item.nombre} value={item.nombre} />
        ))}
      </datalist>
      {cargando && <small>Cargando clientes…</small>}
      {guardando && <small>Guardando cliente…</small>}
      {error && <small className="cliente-error">{error}</small>}
    </label>
  );
}

export default ClienteSelect;
