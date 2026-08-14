import { useState } from 'react';
import './Login.css';
import { FaGoogle, FaApple, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import { login as apiLogin, registerUsuario as apiRegisterUsuario } from '../../api/auth';

const emptyRegisterForm = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  telefono: '',
  foto_perfil: '',
};

const FEATURES = [
  'Gestioná tu catálogo de productos en un solo lugar',
  'Seguí tus pedidos y ventas al instante',
  'Mostrá tu tienda como un profesional',
];

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

        const finalUser = result.usuario || result.user || {
          email: result.email,
          tipo: result.tipo,
          id_tienda: result.id_tienda,
        };

        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {
          // Ignorar errores de almacenamiento local.
        }

        setUserLocal(finalUser);
        if (onLogin) onLogin(result);
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

    if (!registerForm.apellido.trim()) {
      return 'El apellido es obligatorio.';
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
      const payload = {
        email: registerForm.email.trim(),
        password: registerForm.password,
        nombre: registerForm.nombre.trim(),
        apellido: registerForm.apellido.trim(),
        ...(registerForm.telefono.trim() ? { telefono: registerForm.telefono.trim() } : {}),
        ...(registerForm.foto_perfil.trim() ? { foto_perfil: registerForm.foto_perfil.trim() } : {}),
      };

      const result = await apiRegisterUsuario(payload);

      setMessageType('success');
      setMessage(result?.message || 'Usuario registrado correctamente.');
      setRegisterForm(emptyRegisterForm);
      setEmail(registerForm.email.trim());
      setTimeout(() => {
        setMode('login');
      }, 1200);
    } catch (err) {
      console.error('Register error', err);
      setMessageType('error');

      let friendlyMessage = 'No se pudo registrar el usuario. Verificá los datos e intentá nuevamente.';

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
  };

  const title = mode === 'login' ? 'Preparado para gestionar tu negocio' : 'Crear tu cuenta';
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
          ) : (
            <form onSubmit={handleRegisterSubmit} className="login-form register-form">
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

              <div className="field-row">
                <div className="field half">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Juan"
                    value={registerForm.nombre}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>

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
              </div>

              <div className="field">
                <span>Teléfono</span>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="1122334455"
                  value={registerForm.telefono}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="field">
                <span>Foto de perfil (URL)</span>
                <input
                  type="url"
                  name="foto_perfil"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={registerForm.foto_perfil}
                  onChange={handleRegisterChange}
                />
              </div>

              <button className="primary" type="submit" disabled={loading}>
                {submitLabel}
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
