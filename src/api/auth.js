const base = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const url = base + path;
  // Attach Authorization header automatically if token exists
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = Object.assign({}, options.headers || {});
  if (token && !headers.Authorization && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, Object.assign({}, options, { headers }));
  const text = await res.text().catch(() => '');
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { raw: text };
  }

  if (!res.ok) {
    const message = json.message || json.error || res.statusText || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

export function login(body) {
  // Try several common login endpoints in case backend uses a prefix
  const candidates = ['/login', '/auth/login', '/api/login', '/api/auth/login'];
  let lastErr;
  return (async () => {
    for (const path of candidates) {
      try {
        return await request(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (err) {
        lastErr = err;
        console.warn('login attempt failed for', path, err.message || err);
      }
    }
    throw lastErr || new Error('No login endpoint responded');
  })();
}

export function registerUsuario(body) {
  return request('/register/usuario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function registerTienda(body) {
  return request('/register/tienda', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getPerfil() {
  return request('/perfil', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

export default { login, registerUsuario, registerTienda };
