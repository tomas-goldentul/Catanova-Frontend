import { useState } from 'react';
import './Login.css';
import { login as apiLogin } from '../../api/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUserLocal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
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
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
        setUserLocal(finalUser);
        if (typeof onLogin === 'function') onLogin();
      } else {
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
        setUserLocal(finalUser);
      }
      setMessage('Login correcto');
    } catch (err) {
      console.error('Login error', err);
      const status = err.status ? ` (status ${err.status})` : '';
      const body = err.body ? ` — ${JSON.stringify(err.body)}` : '';
      setMessage((err.message || 'Error en el login') + status + body);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-card">
          <h1 className="login-title">Preparado para gestionar tu negocio</h1>

          <form onSubmit={handleSubmit} className="login-form">
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

            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="divider"><span>o</span></div>

          <div className="socials">
            <button className="social google">Usar Google</button>
            <button className="social apple">Usar Apple</button>
          </div>

          <p className="small">No tenés cuenta? <a href="#">Registrate</a></p>

          {message && <p className="login-message">{message}</p>}

          {user && (
            <div className="login-user">
              <h3>Usuario</h3>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="login-right" role="presentation" />
    </div>
  );
}
