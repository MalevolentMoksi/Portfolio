import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useDocumentMeta from '@/hooks/useDocumentMeta';
import { getAcademicProjects } from '@/data/projects';
import { getAssetPath } from '@/utils/assetPath';
import Tooltip from '@/components/Tooltip';

const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

const Projets = () => {
  const { t } = useTranslation();
  const academicProjects = getAcademicProjects(t);

  useDocumentMeta(t('projets.metaTitle'), t('projets.metaDescription'));

  return (
    <section id="project-list" aria-labelledby="projects-title">
      <h2 id="projects-title">
        <em>{t('projets.title')}</em>
      </h2>

      <div className="projects-grid">
        {academicProjects.map((project, index) => (
          <div key={project.id}>
            <article
              className={`project${project.featured ? ' project--featured' : ''}`}
              aria-labelledby={`project-title-${project.id}`}
            >
              {project.featured && project.badgeKey && (
                <p className="project-featured-badge">
                  <span className="project-featured-star" aria-hidden="true">
                    ★
                  </span>
                  {t(project.badgeKey)}
                </p>
              )}
              <h2 id={`project-title-${project.id}`}>{project.title}</h2>
              {project.category && <p className="project-category">{project.category}</p>}
              {project.video ? (
                <video
                  src={getAssetPath(project.video)}
                  poster={getAssetPath(project.image)}
                  autoPlay={!prefersReducedMotion}
                  muted
                  loop
                  playsInline
                  aria-label={t('projets.previewAria', { title: project.title })}
                  width="800"
                  height="450"
                />
              ) : (
                <img
                  src={getAssetPath(project.image)}
                  alt={t('projets.previewAria', { title: project.title })}
                  loading="lazy"
                  width="800"
                  height="450"
                />
              )}
              <p>
                <strong>{project.teamSize} :</strong> {project.description}
              </p>

              {project.technologies && project.technologies.length > 0 && (
                <div className="project-tech" role="list" aria-label={t('projets.technologies')}>
                  {project.technologies.map((tech: any) => (
                    <div key={tech.name} role="listitem">
                      <Tooltip text={tech.name} focusable>
                        <img
                          src={tech.icon.startsWith('http') ? tech.icon : getAssetPath(tech.icon)}
                          alt={tech.name}
                          className="tech-icon"
                          loading="lazy"
                          width="36"
                          height="36"
                        />
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}

              <footer className="project-footer">
                <Link
                  to={project.path}
                  className="btn project-card-link"
                  aria-label={t('projets.learnMoreAria', { title: project.title })}
                >
                  {t('projets.learnMore')}
                  <span className="btn-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </footer>
            </article>

            {index < academicProjects.length - 1 && <hr aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projets;
