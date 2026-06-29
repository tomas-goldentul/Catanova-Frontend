import { useState } from 'react';
import './Login.css';
import { login as apiLogin } from '../../api/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [user, setUserLocal] = useState(null);

  const handleSubmit = async (e) => {
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
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
        setUserLocal(finalUser);
        
        setMessageType('success');
        setMessage('Contraseña correcta');
      } else {
        const finalUser = result.usuario || result.user || null;
        try {
          if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
        } catch (e) {}
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

      // Mostramos el mensaje limpio
      setMessage(friendlyMessage);
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

            <button 
              className="primary" 
              type="submit" 
              disabled={loading || messageType === 'success'}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: (loading || messageType === 'success') ? 'not-allowed' : 'pointer',
                backgroundColor: messageType === 'success' ? '#2ecc71' : '',
                transition: 'all 0.3s ease'
              }}
            >
              {loading 
                ? 'Ingresando...' 
                : messageType === 'success' 
                  ? '¡Ingreso exitoso!' 
                  : 'Ingresar'}
            </button>
          </form>

          <div className="divider"><span>o</span></div>

          <div className="socials">
            <button className="social google">Usar Google</button>
            <button className="social apple">Usar Apple</button>
          </div>

          <p className="small">¿No tenés cuenta? <a href="#">Registrate</a></p>

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
                marginTop: '15px'
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