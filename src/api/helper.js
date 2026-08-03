const API_URL = 'http://localhost:3000'; // La URL donde corre tu backend Express

export const getImagenUrl = (pathImagen) => {
  if (!pathImagen) return 'https://via.placeholder.com/200'; // Imagen por defecto
  if (pathImagen.startsWith('http')) return pathImagen;
  
  return `${API_URL}/${pathImagen}`;
};