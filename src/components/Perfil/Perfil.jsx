import { useEffect, useMemo, useState } from 'react';
import './Perfil.css';
import { getPerfil } from '../../api/auth';
import { IconoCerrar } from '../Icons/Icons';

const ETIQUETAS = {
  email: 'Email',
  correo: 'Email',
  correo_electronico: 'Email',
  telefono: 'Teléfono',
  phone: 'Teléfono',
  celular: 'Teléfono',
  movil: 'Teléfono',
  tipo: 'Rol',
  rol: 'Rol',
  role: 'Rol',
  id_usuario: 'ID Usuario',
  id_tienda: 'ID Tienda',
  nombre_tienda: 'Tienda',
  marca: 'Marca',
  direccion: 'Dirección',
  localidad: 'Localidad',
  ciudad: 'Ciudad',
  provincia: 'Provincia',
  departamento: 'Departamento',
  pais: 'País',
  codigo_postal: 'Código Postal',
  fecha_nacimiento: 'Fecha de nacimiento',
  nacimiento: 'Fecha de nacimiento',
  documento: 'Documento',
  dni: 'DNI',
  cuit: 'CUIT',
  bio: 'Bio',
  descripcion: 'Descripción',
  creado_en: 'Miembro desde',
  created_at: 'Miembro desde',
  fecha_creacion: 'Miembro desde',
  updated_at: 'Actualizado',
  estado: 'Estado',
  activo: 'Activo',
};

const CAMPOS_OMITIDOS = new Set([
  'password',
  'contraseña',
  'contrasena',
  'pass',
  'token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'foto_perfil',
  'foto',
  'avatar',
  'imagen',
  'imagen_url',
  'imagen_perfil',
  'nombre',
  'apellido',
  'first_name',
  'last_name',
  'name',
  'full_name',
]);

const armarEtiqueta = (clave) =>
  clave.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase()).trim();

const valorDe = (usuario = {}, ...claves) => {
  for (const clave of claves) {
    const valor = usuario[clave];
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') return valor;
  }
  return '';
};

const normalizarPerfil = (datos) => {
  const usuario = datos?.usuario ?? datos?.user ?? datos?.profile ?? datos?.data ?? datos ?? {};
  const nombre = String(valorDe(usuario, 'nombre', 'first_name', 'name') || '').trim();
  const apellido = String(valorDe(usuario, 'apellido', 'last_name') || '').trim();
  const email = String(valorDe(usuario, 'email', 'correo', 'correo_electronico') || '').trim();
  const telefono = String(valorDe(usuario, 'telefono', 'phone', 'celular', 'movil') || '').trim();
  const foto = String(valorDe(usuario, 'foto_perfil', 'foto', 'avatar', 'imagen', 'imagen_url') || '');
  const tipo = String(valorDe(usuario, 'tipo', 'rol', 'role') || '').toLowerCase();

  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').trim() || email || 'Cuenta';
  const iniciales = (
    [nombre, apellido].filter(Boolean).map((texto) => texto[0]).join('') ||
    email.charAt(0) ||
    '?'
  ).toUpperCase();

  const campos = Object.entries(usuario)
    .filter(([clave, valor]) => {
      const claveBaja = clave.toLowerCase();
      return (
        !CAMPOS_OMITIDOS.has(claveBaja) &&
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ''
      );
    })
    .map(([clave, valor]) => ({
      clave,
      etiqueta: ETIQUETAS[clave.toLowerCase()] ?? armarEtiqueta(clave),
      valor: typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
    }));

  return { nombreCompleto, nombre, apellido, email, telefono, foto, tipo, iniciales, campos };
};

const leerUsuarioLocal = () => {
  try {
    const crudo = localStorage.getItem('user');
    return crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    return null;
  }
};

const ROLES = {
  tienda: 'Tienda',
  vendedor: 'Vendedor',
  vendedora: 'Vendedora',
  usuario: 'Comprador',
  cliente: 'Cliente',
  admin: 'Administrador',
  proveedor: 'Proveedor',
};

function Perfil({ abierto, onCerrar }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    if (!abierto) return undefined;
    let activo = true;
    setCargando(true);
    setError('');
    setPerfil(null);

    const cargar = async () => {
      try {
        const datos = await getPerfil();
        if (!activo) return;
        setPerfil(normalizarPerfil(datos));
      } catch (e) {
        console.warn('No se pudo obtener el perfil desde el back:', e.message);
        const local = leerUsuarioLocal();
        if (local) {
          if (!activo) return;
          setPerfil(normalizarPerfil(local));
        } else if (activo) {
          setError(e.message || 'No se pudo cargar el perfil.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => { activo = false; };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', cerrarConEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', cerrarConEscape);
      document.body.style.overflow = '';
    };
  }, [abierto, onCerrar]);

  const rol = useMemo(
    () => (perfil ? ROLES[perfil.tipo] ?? null : null),
    [perfil]
  );

  if (!abierto) return null;

  return (
    <div className="perfil-modal" onClick={onCerrar} role="dialog" aria-modal="true" aria-label="Perfil del usuario">
      <div className="perfil-card" onClick={(evento) => evento.stopPropagation()}>
        <button type="button" className="perfil-cerrar" onClick={onCerrar} aria-label="Cerrar perfil">
          <IconoCerrar />
        </button>

        {cargando ? (
          <div className="perfil-cargando">
            <span className="perfil-spinner" />
            <p>Cargando tu perfil…</p>
          </div>
        ) : error ? (
          <div className="perfil-error">
            <p>{error}</p>
            <button type="button" className="perfil-errorBtn" onClick={onCerrar}>Cerrar</button>
          </div>
        ) : perfil ? (
          <>
            <div className="perfil-banner" />

            <div className="perfil-cabecera">
              <div className="perfil-foto">
                {perfil.foto ? (
                  <img src={perfil.foto} alt={perfil.nombreCompleto} className="perfil-fotoImg" />
                ) : (
                  <span className="perfil-fotoIniciales">{perfil.iniciales}</span>
                )}
              </div>

              <h2 className="perfil-nombre">{perfil.nombreCompleto}</h2>
              {rol && <span className="perfil-rol">{rol}</span>}
              {perfil.email && <p className="perfil-email">{perfil.email}</p>}
            </div>

            <div className="perfil-datos">
              {perfil.telefono && (
                <div className="perfil-fila">
                  <span className="perfil-filaEtiqueta">Teléfono</span>
                  <span className="perfil-filaValor">{perfil.telefono}</span>
                </div>
              )}

              {perfil.campos.map((campo) => (
                <div className="perfil-fila" key={campo.clave}>
                  <span className="perfil-filaEtiqueta">{campo.etiqueta}</span>
                  <span className="perfil-filaValor">{campo.valor}</span>
                </div>
              ))}

              {perfil.campos.length === 0 && !perfil.telefono && (
                <p className="perfil-sinDatos">No hay más información disponible.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default Perfil;