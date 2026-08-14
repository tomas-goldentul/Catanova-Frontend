import { useState } from 'react';
import './Login.css';
import { login as apiLogin, registerUsuario as apiRegisterUsuario } from '../../api/auth';

const emptyRegisterForm = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  telefono: '',
  foto_perfil: '',
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [user, setUserLocal] = useState(null);
  const [mode, setMode] = useState('login');
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);

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

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-card">
          <div className="login-mode-switch">
            <button
              type="button"
              className={mode === 'login' ? 'mode-tab active' : 'mode-tab'}
              onClick={() => switchMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'mode-tab active' : 'mode-tab'}
              onClick={() => switchMode('register')}
            >
              Registrarse
            </button>
          </div>

          <h1 className="login-title">{title}</h1>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <button
                className="primary"
                type="submit"
                disabled={loading || messageType === 'success'}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: (loading || messageType === 'success') ? 'not-allowed' : 'pointer',
                  backgroundColor: messageType === 'success' ? '#2ecc71' : '',
                  transition: 'all 0.3s ease',
                }}
              >
                {submitLabel}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="login-form register-form">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="juan@correo.com"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <div className="field-row">
                <label className="field half">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Juan"
                    value={registerForm.nombre}
                    onChange={handleRegisterChange}
                    required
                  />
                </label>

                <label className="field half">
                  <span>Apellido</span>
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Pérez"
                    value={registerForm.apellido}
                    onChange={handleRegisterChange}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Teléfono</span>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="1122334455"
                  value={registerForm.telefono}
                  onChange={handleRegisterChange}
                />
              </label>

              <label className="field">
                <span>Foto de perfil (URL)</span>
                <input
                  type="url"
                  name="foto_perfil"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={registerForm.foto_perfil}
                  onChange={handleRegisterChange}
                />
              </label>

              <button className="primary" type="submit" disabled={loading}>
                {submitLabel}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <>
              <div className="divider"><span>o</span></div>

              <div className="socials">
                <button className="social google" type="button">Usar Google</button>
                <button className="social apple" type="button">Usar Apple</button>
              </div>

              <p className="small">
                ¿No tenés cuenta? <button type="button" className="inline-link" onClick={() => switchMode('register')}>Registrate</button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="small">
              ¿Ya tenés cuenta? <button type="button" className="inline-link" onClick={() => switchMode('login')}>Iniciá sesión</button>
            </p>
          )}

          {message && (
            <p
              className="login-message"
              style={{
                color: messageType === 'success' ? '#2ecc71' : '#e74c3c',
                fontWeight: '600',
                padding: '10px',
                backgroundColor: messageType === 'success' ? '#eafaf1' : '#fdedec',
                borderRadius: '5px',
                textAlign: 'center',
                marginTop: '15px',
              }}
            >
              {message}
            </p>
          )}

          {user && (
            <div className="login-user">
              <h3>Usuario</h3>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="login-right">
        <img
          src="https://fashionboard.dk/wp-content/uploads/2024/01/replenishment-1.png"
          alt="E-commerce store warehouse"
          className="ecommerce-image"
        />
      </div>
    </div>
  );
}