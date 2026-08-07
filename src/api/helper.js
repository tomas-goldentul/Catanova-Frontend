const API_URL = 'http://localhost:3000'; // La URL donde corre tu backend Express
const DEFAULT_IMAGE_URL = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23f0f2f5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2218%22%3ESin%20Imagen%3C/text%3E%3C/svg%3E';

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