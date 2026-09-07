import { useEffect, useRef, useState } from 'react';
import { FiSend, FiX, FiMessageCircle, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import './Chatbot.css';
import { enviarMensajeAsistente } from '../../api/asistente';

const leerSesion = () => {
  let usuario = null;
  try {
    const crudo = localStorage.getItem('user');
    usuario = crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    usuario = null;
  }
  return {
    logueado: Boolean(localStorage.getItem('token')),
    tipo: localStorage.getItem('tipo') || null,
    usuario,
  };
};

const modoDeSesion = (sesion) => (
  sesion.tipo === 'tienda' || sesion.tipo === 'vendedor' || sesion.tipo === 'vendedora'
    ? 'vendedor'
    : 'comprador'
);

const saludoDe = (modo, nombre, logueado) => {
  const parteNombre = nombre ? `, ${nombre}` : '';
  if (modo === 'vendedor') {
    return `¡Hola${parteNombre}! Soy el asistente de Catanova para vendedores. Te ayudo a gestionar tus productos, stock, precios, pedidos y ventas. ¿En qué trabajamos hoy?`;
  }
  if (!logueado) {
    return `¡Hola${parteNombre}! Soy el asistente de Catanova. Iniciá sesión para ver tus pedidos, pero mientras tanto te ayudo a explorar la tienda y a elegir tus prendas.`;
  }
  return `¡Hola${parteNombre}! Soy el asistente de Catanova. Te ayudo a encontrar productos, consultar tus pedidos y seguir tus envíos. ¿En qué te ayudo?`;
};

const SUGERENCIAS = {
  vendedor: [
    '¿Cómo puedo mejorar mi catálogo?',
    'Consejos para fijar precios',
    '¿Cómo manejar el stock?',
    'Ideas para promociones',
  ],
  comprador: [
    '¿Qué productos están disponibles?',
    'Consultar el estado de mi pedido',
    '¿Cómo hago un seguimiento de envío?',
    'Recomendáme una prenda',
  ],
};

const MODALES = { vendedor: 'Vendedor', comprador: 'Comprador' };

function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [sesion, setSesion] = useState(leerSesion);
  const [modo, setModo] = useState(() => modoDeSesion(leerSesion()));
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(null);
  const finListaRef = useRef(null);
  const entradaRef = useRef(null);

  useEffect(() => {
    const sincronizar = () => {
      const nueva = leerSesion();
      const nuevoModo = modoDeSesion(nueva);
      setSesion(nueva);
      setModo((actual) => {
        if (actual !== nuevoModo) {
          setMensajes([]);
          return nuevoModo;
        }
        return actual;
      });
    };
    window.addEventListener('catanova:auth', sincronizar);
    window.addEventListener('storage', sincronizar);
    return () => {
      window.removeEventListener('catanova:auth', sincronizar);
      window.removeEventListener('storage', sincronizar);
    };
  }, []);

  useEffect(() => {
    if (mensajes.length === 0) {
      const nombre = sesion.usuario?.nombre?.trim() || sesion.usuario?.name?.trim() || '';
      setMensajes([
        { rol: 'asistente', texto: saludoDe(modo, nombre, sesion.logueado) },
      ]);
    }
  }, [modo, sesion]);

  useEffect(() => {
    finListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando, abierto]);

  const toggleAbierto = () => {
    setAbierto((valor) => !valor);
    setError('');
  };

  const enviar = async (textoIngresado) => {
    const contenido = (textoIngresado ?? entrada).trim();
    if (!contenido || cargando) return;

    const historial = mensajes
      .filter((item) => item.rol !== 'sistema')
      .map((item) => ({
        rol: item.rol === 'yo' ? 'usuario' : 'assistant',
        contenido: item.texto,
      }));

    const contexto = {
      modo,
      nombre: sesion.usuario?.nombre?.trim() || sesion.usuario?.name?.trim() || '',
      tipo: sesion.tipo,
      logueado: sesion.logueado,
    };

    setMensajes((previos) => [...previos, { rol: 'yo', texto: contenido }]);
    setEntrada('');
    setError('');
    setCargando(true);
    setReintento(null);

    await responder(contenido, historial, contexto);
  };

  const responder = async (contenido, historial, contexto) => {
    try {
      const respuesta = await enviarMensajeAsistente({ mensaje: contenido, modo, historial, contexto });
      setMensajes((previos) => [...previos, { rol: 'asistente', texto: respuesta }]);
      setError('');
      setReintento(null);
    } catch (e) {
      setError(e.message || 'No se pudo conectar con el asistente.');
      setReintento({ mensaje: contenido });
    } finally {
      setCargando(false);
    }
  };

  const reintentar = () => {
    if (!reintento || cargando) return;
    const contenido = reintento.mensaje;

    const historial = mensajes
      .filter((item) => item.rol !== 'yo' && item.rol !== 'sistema')
      .map((item) => ({ rol: 'assistant', contenido: item.texto }));

    setError('');
    setCargando(true);
    setReintento(null);

    responder(contenido, historial, {
      modo,
      nombre: sesion.usuario?.nombre?.trim() || sesion.usuario?.name?.trim() || '',
      tipo: sesion.tipo,
      logueado: sesion.logueado,
    });
  };

  const limpiar = () => {
    setMensajes([]);
    setError('');
    setReintento(null);
    const nombre = sesion.usuario?.nombre?.trim() || sesion.usuario?.name?.trim() || '';
    setMensajes([{ rol: 'asistente', texto: saludoDe(modo, nombre, sesion.logueado) }]);
  };

  const nombre = sesion.usuario?.nombre?.trim() || sesion.usuario?.name?.trim() || sesion.usuario?.email?.trim() || '';

  return (
    <div className="chatbot">
      {abierto && (
        <div className="chatbot-panel" role="dialog" aria-label="Asistente Catanova">
          <header className="chatbot-header">
            <div className="chatbot-headerC">
              <span className="chatbot-c">C</span>
            </div>
            <div className="chatbot-headerInfo">
              <p className="chatbot-titulo">Asistente Catanova</p>
              <span className="chatbot-modo">
                <span className="chatbot-modoDot" />
                Modo {MODALES[modo]}
              </span>
            </div>
            <div className="chatbot-headerAcciones">
              <button
                type="button"
                className="chatbot-btnIcono"
                onClick={limpiar}
                aria-label="Nueva conversación"
                title="Nueva conversación"
              >
                <FiRefreshCw />
              </button>
              <button
                type="button"
                className="chatbot-btnIcono"
                onClick={toggleAbierto}
                aria-label="Cerrar chat"
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>
          </header>

          <div className="chatbot-mensajes">
            {mensajes.map((mensaje, indice) => (
              <div
                key={indice}
                className={`chatbot-burbuja ${mensaje.rol === 'yo' ? 'chatbot-burbuja--yo' : 'chatbot-burbuja--asistente'}`}
              >
                {mensaje.rol === 'asistente' && (
                  <span className="chatbot-avatar">C</span>
                )}
                <div className="chatbot-texto">{mensaje.texto}</div>
              </div>
            ))}

            {cargando && (
              <div className="chatbot-burbuja chatbot-burbuja--asistente">
                <span className="chatbot-avatar">C</span>
                <div className="chatbot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {error && (
              <div className="chatbot-error">
                <FiAlertCircle />
                <span>{error}</span>
                {reintento && (
                  <button type="button" className="chatbot-reintentar" onClick={reintentar}>
                    Reintentar
                  </button>
                )}
              </div>
            )}

            {mensajes.length <= 1 && !cargando && (
              <div className="chatbot-sugerencias">
                {SUGERENCIAS[modo].map((sugerencia) => (
                  <button
                    type="button"
                    key={sugerencia}
                    className="chatbot-chip"
                    onClick={() => enviar(sugerencia)}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}

            <div ref={finListaRef} />
          </div>

          <footer className="chatbot-entrada">
            <input
              ref={entradaRef}
              type="text"
              className="chatbot-input"
              placeholder={modo === 'vendedor' ? 'Escribí tu consulta sobre tu tienda…' : 'Escribí tu consulta…'}
              value={entrada}
              onChange={(evento) => setEntrada(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' && !evento.shiftKey) {
                  evento.preventDefault();
                  enviar();
                }
              }}
              disabled={cargando}
            />
            <button
              type="button"
              className="chatbot-enviar"
              onClick={() => enviar()}
              disabled={cargando || !entrada.trim()}
              aria-label="Enviar mensaje"
            >
              <FiSend />
            </button>
          </footer>
        </div>
      )}

      <button
        type="button"
        className="chatbot-burbuja"
        onClick={toggleAbierto}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={abierto}
      >
        {abierto ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}

export default Chatbot;