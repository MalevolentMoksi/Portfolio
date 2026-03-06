import { Link, useLocation } from 'react-router-dom';
import { useReadingTime } from '@/contexts/ReadingTimeContext.jsx';

/**
 * Breadcrumbs Component
 * Affiche le fil d'Ariane pour la navigation hiérarchique avec connaissance de la structure du site
 */
const Breadcrumbs = () => {
  const location = useLocation();
  const { readingTime } = useReadingTime();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping des chemins vers des labels lisibles
  const pathLabels = {
    'projets': 'Projets',
    'projets-personnels': 'Projets personnels',
    'projet-MEGASAE': 'Application de planification de banquets',
    'projet-SAE12': "Implémentation d'un besoin client",
    'projet-SAE3': "Installation d'un poste pour le développement",
    'projet-SAE4': "Création d'une base de données",
    'projet-SAE56': "Création d'un site institutionnel",
    'projet-SAE3.01': "Application Web pour les aidants",
  };

  // Génère le fil d'Ariane en respectant la hiérarchie du site
  const generateBreadcrumbTrail = () => {
    const trail = [{ label: 'Accueil', path: '/', isCurrent: false }];

    if (pathnames.length === 0) {
      return trail;
    }

    const firstSegment = pathnames[0];

    // Si c'est une page de projet (projet-MEGASAE, projet-SAE12, etc.)
    // → Accueil › Projets › ProjetXXXX
    if (firstSegment.startsWith('projet-')) {
      trail.push({ label: 'Projets', path: '/projets', isCurrent: false });
      const label = pathLabels[firstSegment] || firstSegment;
      trail.push({ label, path: `/${firstSegment}`, isCurrent: true });
    }
    // Si c'est la page Projets
    // → Accueil › Projets
    else if (firstSegment === 'projets') {
      trail.push({ label: 'Projets', path: '/projets', isCurrent: true });
    }
    // Si c'est la page Projets personnels
    // → Accueil › Projets personnels
    else if (firstSegment === 'projets-personnels') {
      trail.push({ label: 'Projets personnels', path: '/projets-personnels', isCurrent: true });
    }

    return trail;
  };

  const breadcrumbTrail = generateBreadcrumbTrail();

  // Ne pas afficher sur la page d'accueil
  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Fil d'Ariane">
      <ol>
        {breadcrumbTrail.map((crumb, index) => (
          <li key={crumb.path}>
            {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
            {crumb.isCurrent ? (
              <span className="breadcrumb-current" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
      {readingTime ? (
        <span className="reading-time" aria-live="polite">
          {readingTime} min read
        </span>
      ) : null}
    </nav>
  );
};

export default Breadcrumbs;
