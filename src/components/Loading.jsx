/**
 * Loading Component
 * Affiche un spinner de chargement pendant le lazy loading des routes
 */
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner" aria-label="Chargement en cours"></div>
    <p className="loading-text">Chargement...</p>
  </div>
);

export default Loading;
