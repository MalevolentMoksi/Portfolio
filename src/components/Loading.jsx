/**
 * Loading Component
 * Affiche un spinner de chargement pendant le lazy loading des routes
 */
const Loading = () => (
  <div className="loading-container" role="status" aria-live="polite">
    <div className="loading-spinner" aria-hidden="true"></div>
    <p className="loading-text">Chargement...</p>
  </div>
);

export default Loading;
