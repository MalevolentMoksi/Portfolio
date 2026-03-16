import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReadingTime } from '@/contexts/ReadingTimeContext';

/**
 * Breadcrumbs Component
 * Affiche le fil d'Ariane pour la navigation hiérarchique avec connaissance de la structure du site
 */
const Breadcrumbs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { readingTime } = useReadingTime();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping des chemins vers des labels lisibles
  const pathLabels: Record<string, string> = {
    projets: t('common.breadcrumbs.labels.projets'),
    'projets-personnels': t('common.breadcrumbs.labels.projetsPersonnels'),
    'projet-MEGASAE': t('common.breadcrumbs.labels.projetMegasae'),
    'projet-SAE12': t('common.breadcrumbs.labels.projetSae12'),
    'projet-SAE3': t('common.breadcrumbs.labels.projetSae3'),
    'projet-SAE4': t('common.breadcrumbs.labels.projetSae4'),
    'projet-SAE56': t('common.breadcrumbs.labels.projetSae56'),
    'projet-SAE3.01': t('common.breadcrumbs.labels.projetSae301'),
    'informations-legales': t('common.breadcrumbs.labels.legal'),
  };

  // Génère le fil d'Ariane en respectant la hiérarchie du site
  const generateBreadcrumbTrail = () => {
    const trail = [{ label: t('common.nav.home'), path: '/', isCurrent: false }];

    if (pathnames.length === 0) {
      return trail;
    }

    const firstSegment = pathnames[0];

    // Si c'est une page de projet (projet-MEGASAE, projet-SAE12, etc.)
    // → Accueil › Projets › ProjetXXXX
    if (firstSegment.startsWith('projet-')) {
      trail.push({ label: t('common.nav.projects'), path: '/projets', isCurrent: false });
      const label = pathLabels[firstSegment] || firstSegment;
      trail.push({ label, path: `/${firstSegment}`, isCurrent: true });
    }
    // Si c'est la page Projets
    // → Accueil › Projets
    else if (firstSegment === 'projets') {
      trail.push({ label: t('common.nav.projects'), path: '/projets', isCurrent: true });
    }
    // Si c'est la page Projets personnels
    // → Accueil › Projets personnels
    else if (firstSegment === 'projets-personnels') {
      trail.push({
        label: t('common.nav.personalProjects'),
        path: '/projets-personnels',
        isCurrent: true,
      });
    }
    // Si c'est la page À propos
    // → Accueil › À propos
    else if (firstSegment === 'about') {
      trail.push({ label: t('common.footer.about'), path: '/about', isCurrent: true });
    }
    // Si c'est la page Crédits
    // → Accueil › Crédits
    else if (firstSegment === 'credits') {
      trail.push({ label: t('common.footer.credits'), path: '/credits', isCurrent: true });
    }
    // Si c'est la page Informations legales
    // -> Accueil > Informations legales
    else if (firstSegment === 'informations-legales') {
      trail.push({
        label: t('common.footer.legal'),
        path: '/informations-legales',
        isCurrent: true,
      });
    }

    return trail;
  };

  const breadcrumbTrail = generateBreadcrumbTrail();

  // Ne pas afficher sur la page d'accueil
  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label={t('common.breadcrumbs.aria')}>
      <ol>
        {breadcrumbTrail.map((crumb, index) => (
          <li key={crumb.path}>
            {index > 0 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                ›
              </span>
            )}
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
          {t('common.breadcrumbs.minRead', { count: readingTime })}
        </span>
      ) : null}
    </nav>
  );
};

export default Breadcrumbs;
