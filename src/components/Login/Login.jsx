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
      // Enviamos varias claves por compatibilidad con distintos backends
      const payload = {
        email,
        password,
        correo: email,
        contrasena: password,
        username: email,
      };
      console.log('Login payload', payload);
      const result = await apiLogin(payload);
      // Expect result to contain token and user info
      if (result.token) {
        localStorage.setItem('token', result.token);
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
        setUserLocal(finalUser);
        // notify parent app that login was successful
        if (typeof onLogin === 'function') onLogin();
      } else {
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
        setUserLocal(finalUser);
        // no token received — do not mark as authenticated
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
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {message && <p className="login-message">{message}</p>}

      {user && (
        <div className="login-user">
          <h3>Usuario</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
