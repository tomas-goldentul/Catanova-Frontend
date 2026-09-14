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

// Prueba varios endpoints. Solo continúa con el siguiente cuando el servidor
// no respondió (error de red) o la ruta no existe (404). Si el servidor
// responde con un error real (400, 401, ...), ese es el resultado final.
async function tryCandidates(candidates, label, optionsFn) {
  let lastErr;
  for (const path of candidates) {
    try {
      return await request(path, optionsFn(path));
    } catch (err) {
      lastErr = err;
      if (err.status !== undefined && err.status !== 404) {
        throw err;
      }
      console.warn(`${label} falló en`, path, err.message || err);
    }
  }
  throw lastErr || new Error(`No endpoint responded`);
}

export function login(body) {
  return tryCandidates(['/login', '/auth/login', '/api/login', '/api/auth/login'], 'login', () => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export function registerUsuario(body) {
  return tryCandidates(
    ['/api/auth/register/usuario', '/register/usuario', '/auth/register/usuario', '/api/register/usuario'],
    'registerUsuario',
    () => ({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

export function registerTienda(body) {
  return tryCandidates(
    ['/api/auth/register/tienda', '/register/tienda', '/auth/register/tienda'],
    'registerTienda',
    () => ({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

export function getPerfil() {
  return tryCandidates(
    ['/api/auth/perfil', '/perfil'],
    'getPerfil',
    () => ({
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export default { login, registerUsuario, registerTienda };
