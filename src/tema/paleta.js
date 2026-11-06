export const PALETA_DEFAULT = {
  primario: '#082567',
  secundario: '#14B8A6',
  fondo: '#FFFFFF',
};

export function normalizarHex(valor, fallback) {
  if (typeof valor !== 'string') return fallback;
  let h = valor.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return h.toUpperCase();
}

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function canal(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex) {
  const { r, g, b } = hexARgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function mezclar(a, b, pesoB) {
  const A = hexARgb(a);
  const B = hexARgb(b);
  const v = (x, y) => Math.round(x + (y - x) * pesoB);
  const to = (n) => n.toString(16).padStart(2, '0');
  return `#${to(v(A.r, B.r))}${to(v(A.g, B.g))}${to(v(A.b, B.b))}`.toUpperCase();
}

/** Texto blanco sobre fondos oscuros; texto oscuro si el color es claro. */
function textoSobre(hex) {
  return luminancia(hex) > 0.62 ? '#0F172A' : '#FFFFFF';
}

export function paletaDesdeTienda(tienda) {
  if (!tienda || typeof tienda !== 'object') return { ...PALETA_DEFAULT };
  return {
    primario: normalizarHex(tienda.color_primario ?? tienda.colorPrimario, PALETA_DEFAULT.primario),
    secundario: normalizarHex(tienda.color_secundario ?? tienda.colorSecundario, PALETA_DEFAULT.secundario),
    fondo: normalizarHex(tienda.color_terciario ?? tienda.colorFondo ?? tienda.color_fondo, PALETA_DEFAULT.fondo),
  };
}

/**
 * Deriva superficies, texto y bordes a partir de los 3 colores de la tienda.
 * Los tonos claro/oscuro del primario y del secundario se resuelven en CSS
 * con color-mix, para que alcancen a todo el sitio al cambiar la base.
 */
export function derivarTokens(paleta) {
  const primario = normalizarHex(paleta.primario, PALETA_DEFAULT.primario);
  const secundario = normalizarHex(paleta.secundario, PALETA_DEFAULT.secundario);
  const fondo = normalizarHex(paleta.fondo, PALETA_DEFAULT.fondo);
  const fondoClaro = luminancia(fondo) > 0.55;

  const fondoPagina = fondoClaro ? mezclar(fondo, primario, 0.045) : mezclar(fondo, '#000000', 0.14);
  const superficie = fondoClaro ? mezclar(fondo, '#FFFFFF', 0.62) : mezclar(fondo, '#FFFFFF', 0.12);
  const fondoSuave = fondoClaro ? mezclar(superficie, primario, 0.04) : mezclar(superficie, '#FFFFFF', 0.07);
  const texto = fondoClaro ? mezclar(primario, '#0F172A', 0.3) : mezclar(fondo, '#FFFFFF', 0.92);
  const textoSuave = mezclar(texto, fondoClaro ? superficie : fondoPagina, 0.48);
  const borde = mezclar(texto, superficie, 0.84);
  const bordeFuerte = mezclar(texto, superficie, 0.7);

  return {
    primario,
    secundario,
    fondo,
    fondoPagina,
    superficie,
    fondoSuave,
    texto,
    textoSuave,
    borde,
    bordeFuerte,
    sobrePrimario: textoSobre(primario),
    sobreSecundario: textoSobre(secundario),
  };
}

export function aplicarTokens(tokens) {
  const root = document.documentElement;
  const mapa = {
    '--color-primario': tokens.primario,
    '--color-secundario': tokens.secundario,
    '--color-fondo': tokens.fondo,
    '--color-fondo-pagina': tokens.fondoPagina,
    '--color-superficie': tokens.superficie,
    '--color-fondo-suave': tokens.fondoSuave,
    '--color-texto': tokens.texto,
    '--color-texto-suave': tokens.textoSuave,
    '--color-borde': tokens.borde,
    '--color-borde-fuerte': tokens.bordeFuerte,
    '--color-sobre-primario': tokens.sobrePrimario,
    '--color-sobre-secundario': tokens.sobreSecundario,
  };

  Object.entries(mapa).forEach(([nombre, valor]) => {
    root.style.setProperty(nombre, valor);
  });
}
