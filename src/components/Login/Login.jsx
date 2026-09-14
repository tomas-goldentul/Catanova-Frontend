import { useState } from 'react';
import './Login.css';
import { FaGoogle, FaApple, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import { login as apiLogin, registerUsuario as apiRegisterUsuario, registerTienda as apiRegisterTienda } from '../../api/auth';
import { obtenerUsuarioPorCuenta } from '../../api/usuarios';

const emptyRegisterForm = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  telefono: '',
  foto_perfil: '',
  nombre_tienda: '',
  descripcion_tienda: '',
  direccion_tienda: '',
};

const FEATURES = [
  'Gestioná tu catálogo de productos en un solo lugar',
  'Seguí tus pedidos y ventas al instante',
  'Mostrá tu tienda como un profesional',
];

function decodificarJwtLocal(token) {
  if (!token || !token.includes('.')) return null;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [user, setUserLocal] = useState(null);
  const [mode, setMode] = useState('login');
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const payload = {
        email,
        password,
        correo: email,
        contrasena: password,
        username: email,
      };

      const result = await apiLogin(payload);

      if (result.token) {
        localStorage.setItem('token', result.token);
        if (result.tipo) {
          localStorage.setItem('tipo', result.tipo);
        }
        if (result.id_tienda) {
          localStorage.setItem('id_tienda', String(result.id_tienda));
        } else if (result.tipo !== 'tienda') {
          localStorage.removeItem('id_tienda');
        }

        // El JWT suele traer el id del usuario aunque el backend no devuelva un
        // objeto usuario/user completo; se combina para no perder el id.
        const desdeJwt = decodificarJwtLocal(result.token) || {};
        const finalUser = {
          ...desdeJwt,
          email: result.email,
          tipo: result.tipo,
          id_tienda: result.id_tienda,
          ...(result.usuario || result.user || {}),
        };

        // El login solo devuelve id_cuenta (tabla cuentas), pero /pedidos filtra por
        // id_usuario (tabla usuarios, distinta). Para compradores hay que resolverlo aparte.
        if (finalUser.tipo === 'usuario' && !finalUser.id_usuario && finalUser.id_cuenta) {
          try {
            const usuario = await obtenerUsuarioPorCuenta(finalUser.id_cuenta);
            if (usuario?.id_usuario) {
              finalUser.id_usuario = usuario.id_usuario;
            }
          } catch (lookupErr) {
            console.warn('No se pudo resolver id_usuario a partir de id_cuenta', lookupErr);
          }
        }

        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {
          // Ignorar errores de almacenamiento local.
        }

        setUserLocal(finalUser);
        if (onLogin) onLogin(result);
        window.dispatchEvent(new Event('catanova:auth'));
        setMessageType('success');
        setMessage('Contraseña correcta');
      } else {
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {
          // Ignorar errores de almacenamiento local.
        }
        setUserLocal(finalUser);
      }

      if (!message) {
        setMessageType('success');
        setMessage('Contraseña correcta');
      }
    } catch (err) {
      console.error('Login error', err);
      setMessageType('error');

      let friendlyMessage = 'Ocurrió un error al iniciar sesión. Por favor, intentá de nuevo.';

      if (err.body && err.body.message) {
        friendlyMessage = err.body.message;
      } else if (err.message) {
        friendlyMessage = err.message;
      }

      if (err.status === 401) {
        friendlyMessage = 'Los datos ingresados son incorrectos';
      } else if (err.status === 404) {
        friendlyMessage = 'No encontramos ninguna cuenta asociada a este email.';
      }

      setMessage(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateRegisterForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!registerForm.email.trim() || !emailPattern.test(registerForm.email.trim())) {
      return 'Ingresá un email válido.';
    }

    if (!registerForm.password || registerForm.password.trim().length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (!registerForm.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }

    if (registerRole === 'usuario' && !registerForm.apellido.trim()) {
      return 'El apellido es obligatorio.';
    }

    if (registerRole === 'tienda' && !registerForm.nombre_tienda.trim()) {
      return 'El nombre de la tienda es obligatorio.';
    }

    if (registerForm.telefono.trim() && registerForm.telefono.trim().length < 6) {
      return 'El teléfono debe tener al menos 6 dígitos si se completa.';
    }

    if (registerForm.foto_perfil.trim()) {
      const url = registerForm.foto_perfil.trim();
      const isValidUrl = /^https?:\/\/.+/i.test(url) || /^data:image\//i.test(url);
      if (!isValidUrl) {
        return 'La foto de perfil debe ser una URL válida.';
      }
    }

    return '';
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateRegisterForm();

    if (validationError) {
      setMessageType('error');
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const basePayload = {
        email: registerForm.email.trim(),
        password: registerForm.password,
        nombre: registerForm.nombre.trim(),
        ...(registerForm.telefono.trim() ? { telefono: registerForm.telefono.trim() } : {}),
        ...(registerForm.foto_perfil.trim() ? { foto_perfil: registerForm.foto_perfil.trim() } : {}),
      };

      let result;
      let successMessage;

      if (registerRole === 'tienda') {
        const tiendaPayload = {
          ...basePayload,
          nombre_tienda: registerForm.nombre_tienda.trim(),
          ...(registerForm.descripcion_tienda.trim()
            ? { descripcion_tienda: registerForm.descripcion_tienda.trim() }
            : {}),
          ...(registerForm.direccion_tienda.trim()
            ? { direccion_tienda: registerForm.direccion_tienda.trim() }
            : {}),
        };
        result = await apiRegisterTienda(tiendaPayload);
        successMessage = result?.message || 'Tienda registrada correctamente.';
      } else {
        result = await apiRegisterUsuario({
          ...basePayload,
          apellido: registerForm.apellido.trim(),
        });
        successMessage = result?.message || 'Usuario registrado correctamente.';
      }

      setMessageType('success');
      setMessage(successMessage);
      setRegisterForm(emptyRegisterForm);
      setRegisterRole(null);
      setEmail(registerForm.email.trim());
      setTimeout(() => {
        setMode('login');
      }, 1200);
    } catch (err) {
      console.error('Register error', err);
      setMessageType('error');

      let friendlyMessage = 'No se pudo completar el registro. Verificá los datos e intentá nuevamente.';

      if (err.body && err.body.message) {
        friendlyMessage = err.body.message;
      } else if (err.message) {
        friendlyMessage = err.message;
      }

      setMessage(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage(null);
    setMessageType(null);
    if (nextMode === 'register') {
      setRegisterRole(null);
      setRegisterForm(emptyRegisterForm);
    }
  };

  const title =
    mode === 'login'
      ? 'Preparado para gestionar tu negocio'
      : registerRole
        ? registerRole === 'tienda'
          ? 'Crear tu cuenta de tienda'
          : 'Crear tu cuenta de usuario'
        : 'Crear tu cuenta';
  const submitLabel = mode === 'login' ? (loading ? 'Ingresando...' : 'Ingresar') : (loading ? 'Registrando...' : 'Registrarme');

  const inputClass = (showState, setShowState, value, setValue) => (
    <>
      <input
        type={showState ? 'text' : 'password'}
        placeholder={mode === 'login' ? 'Ingresa tu contraseña' : 'Mínimo 6 caracteres'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        name={mode === 'register' ? 'password' : undefined}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={showState ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShowState((v) => !v)}
      >
        {showState ? <FaEyeSlash /> : <FaEye />}
      </button>
    </>
  );

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-card">
          <div className="login-brand">
            <img src={logo} alt="Catanova" className="login-logo" />
            <span className="login-brand-name">Catanova</span>
          </div>

          <div className="login-mode-switch">
            <button
              type="button"
              className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Registrarse
            </button>
          </div>

          <h1 className="login-title">{title}</h1>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span>Contraseña</span>
                <div className="password-wrap">
                  {inputClass(showPassword, setShowPassword, password, setPassword)}
                </div>
              </div>

              <div className="login-extra">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="forgot">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button className="primary" type="submit" disabled={loading || messageType === 'success'}>
                {submitLabel}
              </button>
            </form>
          ) : registerRole === null ? (
            <div className="register-role-step" key="role-step">
              <p className="register-role-intro">Elegí cómo querés usar Catanova</p>
              <div className="register-role-grid">
                <button
                  type="button"
                  className="register-role-card"
                  onClick={() => setRegisterRole('usuario')}
                >
                  <span className="register-role-icon" aria-hidden="true">
                    👤
                  </span>
                  <span className="register-role-name">Usuario</span>
                  <span className="register-role-desc">Comprá y seguí tus pedidos como cliente.</span>
                </button>
                <button
                  type="button"
                  className="register-role-card"
                  onClick={() => setRegisterRole('tienda')}
                >
                  <span className="register-role-icon" aria-hidden="true">
                    🏪
                  </span>
                  <span className="register-role-name">Tienda</span>
                  <span className="register-role-desc">Vendé y gestioná tu catálogo de productos.</span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleRegisterSubmit}
              key={registerRole}
              className={`login-form register-form role-${registerRole}`}
            >
              <div className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="juan@correo.com"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="field">
                <span>Contraseña</span>
                <div className="password-wrap">
                  {inputClass(
                    showRegisterPassword,
                    setShowRegisterPassword,
                    registerForm.password,
                    (v) => handleRegisterChange({ target: { name: 'password', value: v } })
                  )}
                </div>
              </div>

              {registerRole === 'tienda' && (
                <div className="field">
                  <span>Nombre de la tienda</span>
                  <input
                    type="text"
                    name="nombre_tienda"
                    placeholder="Mi Tienda Textil"
                    value={registerForm.nombre_tienda}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              )}

              {registerRole === 'tienda' && (
                <div className="field">
                  <span>Descripción</span>
                  <input
                    type="text"
                    name="descripcion_tienda"
                    placeholder="Contanos brevemente sobre tu tienda"
                    value={registerForm.descripcion_tienda}
                    onChange={handleRegisterChange}
                  />
                </div>
              )}

              <div className="field-row">
                <div className="field half">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="nombre"
                    placeholder={registerRole === 'tienda' ? 'Nombre del responsable' : 'Juan'}
                    value={registerForm.nombre}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>

                {registerRole === 'usuario' && (
                  <div className="field half">
                    <span>Apellido</span>
                    <input
                      type="text"
                      name="apellido"
                      placeholder="Pérez"
                      value={registerForm.apellido}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                )}
              </div>

              {registerRole === 'tienda' && (
                <div className="field">
                  <span>Dirección</span>
                  <input
                    type="text"
                    name="direccion_tienda"
                    placeholder="Av. Siempre Viva 123"
                    value={registerForm.direccion_tienda}
                    onChange={handleRegisterChange}
                  />
                </div>
              )}

              <div className="field">
                <span>Teléfono (opcional)</span>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="1122334455"
                  value={registerForm.telefono}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="field">
                <span>Foto de perfil (opcional)</span>
                <input
                  type="url"
                  name="foto_perfil"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={registerForm.foto_perfil}
                  onChange={handleRegisterChange}
                />
              </div>

              <button
                type="button"
                className="register-back"
                onClick={() => {
                  setRegisterRole(null);
                  setMessage(null);
                  setMessageType(null);
                }}
              >
                ← Cambiar tipo de cuenta
              </button>

              <button className="primary" type="submit" disabled={loading}>
                {loading
                  ? 'Registrando...'
                  : registerRole === 'tienda'
                    ? 'Registrar tienda'
                    : 'Registrarme'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <>
              <div className="divider">
                <span>o continuá con</span>
              </div>

              <div className="socials">
                <button type="button" className="social google">
                  <FaGoogle />
                  <span>Google</span>
                </button>
                <button type="button" className="social apple">
                  <FaApple />
                  <span>Apple</span>
                </button>
              </div>

              <p className="small">
                ¿No tenés cuenta?{' '}
                <button type="button" className="inline-link" onClick={() => switchMode('register')}>
                  Registrate
                </button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="small">
              ¿Ya tenés cuenta?{' '}
              <button type="button" className="inline-link" onClick={() => switchMode('login')}>
                Iniciá sesión
              </button>
            </p>
          )}

          {message && (
            <div className={`login-message ${messageType === 'success' ? 'success' : 'error'}`}>{message}</div>
          )}

          {user && (
            <div className="login-user">
              <h3 className="login-user-title">Usuario</h3>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-overlay">
          <div className="login-right-content">
            <img src={logo} alt="Catanova" className="login-right-logo" />
            <h2 className="login-right-title">Tu negocio, en orden.</h2>
            <p className="login-right-subtitle">
              El panel de administración inteligente para emprendedores del rubro textil.
            </p>
            <ul className="login-right-features">
              {FEATURES.map((item) => (
                <li key={item}>
                  <span className="feature-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
