/**
 * Utilitaire de chemin d'asset
 * Construit des chemins corrects en tenant compte du base path Vite
 */

export const getAssetPath = (path) => {
  const basePath = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path if present, then construct full path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}${cleanPath}`;
};
