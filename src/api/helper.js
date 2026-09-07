const API_URL = 'http://localhost:3000'; // La URL donde corre tu backend Express
const DEFAULT_IMAGE_URL = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22400%22%20height=%22400%22%20viewBox=%220%200%20400%20400%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22g%22%20x1=%220%22%20y1=%220%22%20x2=%221%22%20y2=%221%22%3E%3Cstop%20offset=%220%22%20stop-color=%22%23edf9f6%22/%3E%3Cstop%20offset=%221%22%20stop-color=%22%23e6eef2%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22400%22%20height=%22400%22%20fill=%22url(%23g)%22/%3E%3Cg%20fill=%22none%22%20stroke=%22%2321b89a%22%20stroke-width=%227%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22M118%20168%20h164%20v132%20a10%2010%200%200%201%20-10%2010%20H128%20a10%2010%200%200%201%20-10%20-10%20z%22/%3E%3Cpath%20d=%22M118%20168%20l36%20-52%20h110%20l36%2052%22/%3E%3Cpath%20d=%22M158%20116%20v40%20M206%20116%20v40%20M254%20116%20v40%22/%3E%3Cpath%20d=%22M150%20300%20v26%20M202%20300%20v26%20M254%20300%20v26%22/%3E%3C/g%3E%3Ctext%20x=%22200%22%20y=%22220%22%20text-anchor=%22middle%22%20font-family=%22Inter,%20Arial,%20sans-serif%22%20font-size=%2226%22%20font-weight=%22700%22%20fill=%22%237f9aa0%22%3ECatanova%3C/text%3E%3Ctext%20x=%22200%22%20y=%22250%22%20text-anchor=%22middle%22%20font-family=%22Inter,%20Arial,%20sans-serif%22%20font-size=%2220%22%20fill=%22%23a3b8b5%22%3ESin%20imagen%3C/text%3E%3C/svg%3E';

export const getImagenUrl = (pathImagen) => {
  if (!pathImagen) return DEFAULT_IMAGE_URL;
  if (pathImagen.startsWith('http')) return pathImagen;

  const normalizedPath = pathImagen
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  if (pathImagen.startsWith('/')) {
    return `${API_URL}${normalizedPath}`;
  }

  if (pathImagen.startsWith('imagenes/') || pathImagen.startsWith('uploads/')) {
    return `${API_URL}/${normalizedPath}`;
  }

  return `${API_URL}/imagenes/${normalizedPath}`;
};

export { DEFAULT_IMAGE_URL };