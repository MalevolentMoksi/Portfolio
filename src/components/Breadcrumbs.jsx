import { Link, useLocation } from 'react-router-dom';

/**
 * Breadcrumbs Component
 * Affiche le fil d'Ariane pour la navigation hiérarchique
 */
const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping des chemins vers des labels lisibles
  const pathLabels = {
    'projets': 'Projets',
    'projets-personnels': 'Projets personnels',
    'projet-MEGASAE': 'MEGASAE',
    'projet-SAE12': 'SAE 1.2',
    'projet-SAE3': 'SAE 3',
    'projet-SAE4': 'SAE 4',
    'projet-SAE56': 'SAE 5-6',
  };

  // Mapping des chemins vers leurs parents
  const pathParents = {
    'projet-MEGASAE': '/projets',
    'projet-SAE12': '/projets',
    'projet-SAE3': '/projets',
    'projet-SAE4': '/projets',
    'projet-SAE56': '/projets',
  };

  // Ne pas afficher sur la page d'accueil
  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Fil d'Ariane">
      <ol>
        <li>
          <Link to="/">Accueil</Link>
        </li>
        
        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const label = pathLabels[segment] || segment;
          
          // Pour les pages de projets, inclure le parent "Projets" si nécessaire
          const needsProjectsParent = 
            pathParents[segment] === '/projets' && 
            !pathnames.includes('projets') &&
            index === 0;
          
          return (
            <li key={segment}>
              {needsProjectsParent && (
                <>
                  <span className="breadcrumb-separator" aria-hidden="true">›</span>
                  <Link to="/projets">Projets</Link>
                </>
              )}
              <span className="breadcrumb-separator" aria-hidden="true">›</span>
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link to={`/${pathnames.slice(0, index + 1).join('/')}`}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
