// Autocompletado y validación de direcciones con la API pública Georef (datos.gob.ar).
// El back no valida direcciones: guarda un único string varchar(100) con formato "Calle N, Localidad".
const GEOREF_URL = 'https://apis.datos.gob.ar/georef/api/direcciones';

export const MAX_DIRECCION = 100;

const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);

function titulo(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra, index) => (index > 0 && PALABRAS_MENORES.has(palabra) ? palabra : palabra[0].toUpperCase() + palabra.slice(1)))
    .join(' ');
}

// "Mitre 234, Rosario" -> { direccion: "Mitre 234", localidad: "Rosario" }
export function separarConsulta(texto) {
  const [calleYNumero = '', ...resto] = String(texto ?? '').split(',');
  return { direccion: calleYNumero.trim(), localidad: resto.join(',').trim() };
}

export function tieneNumero(texto) {
  return /\d/.test(separarConsulta(texto).direccion);
}

// Control mínimo cuando Georef no está disponible: algo de texto, un número y entra en la columna.
export function formatoDireccionValido(texto) {
  const valor = String(texto ?? '').trim();
  return valor.length >= 5 && valor.length <= MAX_DIRECCION && /[a-zA-ZÀ-ÿ]/.test(valor) && tieneNumero(valor);
}

export function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatearSugerencia(item) {
  const calle = titulo(item?.calle?.nombre);
  const altura = item?.altura?.valor;
  const localidad = item?.localidad_censal?.nombre;
  const provincia = item?.provincia?.nombre;
  if (!calle || altura == null) return null;

  const base = [`${calle} ${altura}`, localidad].filter(Boolean).join(', ');
  const completa = provincia && provincia !== localidad ? `${base}, ${provincia}` : base;
  return (completa.length <= MAX_DIRECCION ? completa : base).slice(0, MAX_DIRECCION);
}

/**
 * Busca direcciones reales. Acepta "Calle N" o "Calle N, Localidad" (la parte después de la
 * coma filtra por localidad). Devuelve [] si no hay número de calle: Georef solo devuelve
 * calles sin altura y esas no sirven para una entrega.
 * Lanza un Error con { sinServicio: true } si Georef no responde.
 */
export async function buscarDirecciones(texto, signal) {
  const { direccion, localidad } = separarConsulta(texto);
  if (direccion.length < 3 || !tieneNumero(direccion)) return [];

  const params = new URLSearchParams({
    direccion,
    max: '8',
    campos: 'calle.nombre,altura.valor,localidad_censal.nombre,provincia.nombre',
  });
  if (localidad) params.set('localidad_censal', localidad);

  let response;
  try {
    response = await fetch(`${GEOREF_URL}?${params}`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const error = new Error('No se pudo conectar con el servicio de direcciones.');
    error.sinServicio = true;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`El servicio de direcciones respondió con error (${response.status}).`);
    error.sinServicio = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  const vistas = new Set();
  const sugerencias = [];

  for (const item of data?.direcciones ?? []) {
    const textoSugerido = formatearSugerencia(item);
    if (!textoSugerido || vistas.has(textoSugerido)) continue;
    vistas.add(textoSugerido);
    sugerencias.push({ texto: textoSugerido, localidad: item.localidad_censal?.nombre ?? '', provincia: item.provincia?.nombre ?? '' });
  }

  return sugerencias;
}
