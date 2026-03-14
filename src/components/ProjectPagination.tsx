import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * ProjectPagination Component
 * Affiche les liens vers le projet précédent et suivant
 */

const projects = [
  { path: '/projet-SAE3.01', titleKey: 'common.pagination.projectTitles.sae301' },
  { path: '/projet-MEGASAE', titleKey: 'common.pagination.projectTitles.megasae' },
  { path: '/projet-SAE56', titleKey: 'common.pagination.projectTitles.sae56' },
  { path: '/projet-SAE3', titleKey: 'common.pagination.projectTitles.sae3' },
  { path: '/projet-SAE12', titleKey: 'common.pagination.projectTitles.sae12' },
  { path: '/projet-SAE4', titleKey: 'common.pagination.projectTitles.sae4' },
];

const ProjectPagination = ({ currentPath }: any) => {
  const { t } = useTranslation();
  const currentIndex = projects.findIndex((p) => p.path === currentPath);

  if (currentIndex === -1) return null;

  const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
  const nextIndex = (currentIndex + 1) % projects.length;

  const prevProject = projects[prevIndex];
  const nextProject = projects[nextIndex];
  const prevTitle = t(prevProject.titleKey);
  const nextTitle = t(nextProject.titleKey);

  return (
    <nav className="project-pagination" aria-label={t('common.pagination.navAria')}>
      <Link
        to={prevProject.path}
        className="project-pagination-link prev"
        aria-label={t('common.pagination.previousAria', { title: prevTitle })}
      >
        <span className="pagination-arrow" aria-hidden="true">
          ←
        </span>
        <div className="pagination-content">
          <span className="pagination-label">{t('common.pagination.previous')}</span>
          <span className="pagination-title">{prevTitle}</span>
        </div>
      </Link>

      <Link
        to="/projets"
        className="project-pagination-link back-to-list"
        aria-label={t('common.pagination.allProjectsAria')}
      >
        <span className="pagination-icon" aria-hidden="true">
          ◉
        </span>
        <span>{t('common.pagination.allProjects')}</span>
      </Link>

      <Link
        to={nextProject.path}
        className="project-pagination-link next"
        aria-label={t('common.pagination.nextAria', { title: nextTitle })}
      >
        <div className="pagination-content">
          <span className="pagination-label">{t('common.pagination.next')}</span>
          <span className="pagination-title">{nextTitle}</span>
        </div>
        <span className="pagination-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </nav>
  );
};

export default ProjectPagination;
