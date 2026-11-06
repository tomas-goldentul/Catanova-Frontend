import fs from 'fs';
import path from 'path';

const root = path.resolve('src');
const excluir = new Set([
  path.normalize('src/App.css'),
  path.normalize('src/components/EditarTienda/EditarTienda.css'),
]);

const PRIMARIO = new Set(['0d1b38', '082567']);
const PRIMARIO_OSCURO = new Set(['162544', '1a2d50', '0f2a5e', '1a2f5a']);
const SECUNDARIO = new Set([
  '00b894', '14b8a6', '0ea5a0', '059669', '10b981', '00a884', '0f766e', '0d9e91', '12b76a',
]);
const SECUNDARIO_CLARO = new Set(['00c9a7', '00d2a8']);
const SECUNDARIO_OSCURO = new Set([
  '00a88c', '008f78', '009e7e', '047857', '087f75', '0aa07f', '0d9c74', '0d7a75',
]);
const SECUNDARIO_MAS_OSCURO = new Set(['007d69', '065f46', '134e4a']);
const SUAVE_SECUNDARIO = new Set([
  'ecfdf5', 'f0fdf4', 'd1fae5', 'e7f9f2', 'ccfbf1', 'f0fdfa', 'f7fefc', 'bfecdd', 'a7f3d0', 'bbf7d0',
]);
const TEXTO = new Set(['0f172a', '111827', '1e293b', '080808', '111111', '344054', '374151']);
const TEXTO_SUAVE = new Set([
  '64748b', '6b7280', '94a3b8', '9aa3b8', '7b849d', '5b6b85', '667085', '98a2b3',
  '94a3c3', '7b8aac', '8a95a8', 'a5b0c0', '9ca3af', '475467', '475569', '39415c',
]);
const FONDO_PAGINA = new Set(['f5f7fa', 'f7f8fa']);
const FONDO_SUAVE = new Set([
  'f8fafc', 'f7f8fb', 'f0f3f8', 'fbfcfe', 'f9fafb', 'f0f1f5', 'f2f4f7', 'f1f5f9',
  'fbfcfd', 'f3f4f6', 'eeeeee', 'f8fafc',
]);
const BORDE = new Set([
  'e5e7eb', 'e2e8f0', 'eef1f6', 'ececee', 'e7ebf3', 'e8ecf2', 'e3e8f0', 'e0e5f0',
  'd8dde8', 'eef2f6', 'e6e9ee', 'f0f0f0', 'f1f2f4', 'c5c5c5', 'ccd3dc', 'd1d5db', 'e8ecf1',
]);
const BORDE_FUERTE = new Set(['d0d5dd', '999999']);
const RGBA = {
  '0,184,148': '--color-secundario',
  '0,201,167': '--color-secundario',
  '0,210,168': '--color-secundario-claro',
  '13,27,56': '--color-primario',
  '20,184,166': '--color-secundario',
  '5,150,105': '--color-secundario',
  '15,118,110': '--color-secundario',
  '8,127,117': '--color-secundario-oscuro',
};

function expand(hex) {
  let h = hex.toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return h;
}

function tokenDeHex(hex) {
  if (PRIMARIO.has(hex)) return 'var(--color-primario)';
  if (PRIMARIO_OSCURO.has(hex)) return 'var(--color-primario-oscuro)';
  if (SECUNDARIO.has(hex)) return 'var(--color-secundario)';
  if (SECUNDARIO_CLARO.has(hex)) return 'var(--color-secundario-claro)';
  if (SECUNDARIO_OSCURO.has(hex)) return 'var(--color-secundario-oscuro)';
  if (SECUNDARIO_MAS_OSCURO.has(hex)) return 'var(--color-secundario-mas-oscuro)';
  if (SUAVE_SECUNDARIO.has(hex)) return 'var(--color-secundario-suave)';
  if (TEXTO.has(hex)) return 'var(--color-texto)';
  if (TEXTO_SUAVE.has(hex)) return 'var(--color-texto-suave)';
  if (FONDO_PAGINA.has(hex)) return 'var(--color-fondo-pagina)';
  if (FONDO_SUAVE.has(hex)) return 'var(--color-fondo-suave)';
  if (BORDE.has(hex)) return 'var(--color-borde)';
  if (BORDE_FUERTE.has(hex)) return 'var(--color-borde-fuerte)';
  if (hex === '1f2937') return 'var(--color-primario)';
  return null;
}

function esColor(prop) {
  return prop === 'color' || prop === 'fill' || prop === 'stroke' || prop === 'caret-color' || prop === 'accent-color';
}

function blanco(prop, block) {
  if (!esColor(prop)) return 'var(--color-superficie)';
  const fondo = (block.match(/background(?:-color)?\s*:[^;]*/i) || [''])[0].toLowerCase();
  const muestra = fondo || block.toLowerCase();
  const tiene = (set) => [...set].some((h) => muestra.includes(h));
  if (tiene(SECUNDARIO) || tiene(SECUNDARIO_CLARO) || tiene(SECUNDARIO_OSCURO) || tiene(SECUNDARIO_MAS_OSCURO) || muestra.includes('14b8a6') || muestra.includes('--color-secundario')) {
    return 'var(--color-sobre-secundario)';
  }
  if (tiene(PRIMARIO) || tiene(PRIMARIO_OSCURO) || muestra.includes('--color-primario')) {
    return 'var(--color-sobre-primario)';
  }
  return null;
}

function reemplazar(css) {
  let cambios = 0;
  css = css.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/gi, (m, r, g, b, a) => {
    const clave = `${+r},${+g},${+b}`;
    const variable = RGBA[clave];
    if (!variable) return m;
    cambios += 1;
    const pct = Math.max(0, Math.min(100, Math.round(parseFloat(a) * 100)));
    return `color-mix(in srgb, var(${variable}) ${pct}%, transparent)`;
  });

  css = css.replace(/#([0-9a-fA-F]{3,8})\b/g, (m, raw, offset, str) => {
    const full = expand(raw);
    const alpha = raw.length === 8 || full.length === 8 ? full.slice(6) : null;
    const hex = alpha ? full.slice(0, 6) : full.length === 6 ? full : null;
    if (!hex) return m;

    const antes = str.slice(Math.max(0, offset - 120), offset);
    const propMatch = antes.match(/([a-zA-Z-]+)\s*:\s*[^;{}]*$/);
    const prop = propMatch ? propMatch[1].toLowerCase() : '';
    const inicio = str.lastIndexOf('{', offset);
    const fin = str.indexOf('}', offset);
    const block = inicio >= 0 && fin > inicio ? str.slice(inicio, fin) : '';

    let token = null;
    if (hex === 'ffffff') token = blanco(prop, block);
    else token = tokenDeHex(hex);

    if (!token) return m;
    if (esColor(prop) && (FONDO_PAGINA.has(hex) || FONDO_SUAVE.has(hex) || BORDE.has(hex) || SUAVE_SECUNDARIO.has(hex))) {
      return m;
    }
    if ((prop.includes('background') || prop === 'background') && (TEXTO.has(hex) || TEXTO_SUAVE.has(hex))) {
      return m;
    }

    cambios += 1;
    if (alpha) {
      const pct = Math.round((parseInt(alpha, 16) / 255) * 100);
      return `color-mix(in srgb, ${token} ${pct}%, transparent)`;
    }
    return token;
  });

  css = css.replace(/\bwhite\b/g, (m, offset, str) => {
    const antes = str.slice(Math.max(0, offset - 80), offset);
    const propMatch = antes.match(/([a-zA-Z-]+)\s*:\s*[^;{}]*$/);
    const prop = propMatch ? propMatch[1].toLowerCase() : '';
    if (!prop) return m;
    const inicio = str.lastIndexOf('{', offset);
    const fin = str.indexOf('}', offset);
    const block = inicio >= 0 && fin > inicio ? str.slice(inicio, fin) : '';
    const token = blanco(prop, block);
    if (!token) return m;
    cambios += 1;
    return token;
  });

  return { css, cambios };
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.css')) acc.push(full);
  }
  return acc;
}

let total = 0;
for (const file of walk(root)) {
  const rel = path.normalize(path.relative(process.cwd(), file));
  if (excluir.has(rel)) continue;
  const original = fs.readFileSync(file, 'utf8');
  const { css, cambios } = reemplazar(original);
  if (css !== original) {
    fs.writeFileSync(file, css);
    total += cambios;
    console.log(`${cambios}\t${rel}`);
  }
}
console.log('total', total);
