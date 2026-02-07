import { Link } from 'react-router-dom';
import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { academicProjects } from '@/data/projects.js';
import { getAssetPath } from '@/utils/assetPath.js';

const Projets = () => {
  useDocumentMeta('Projets | Portfolio', 'Mes projets scolaires et professionnels');

  return (
    <section id="project-list" aria-labelledby="projects-title">
      <h2 id="projects-title">
        <em>Mes Projets</em>
      </h2>

      <div className="projects-grid">
        {academicProjects.map((project, index) => (
          <div key={project.id}>
            <article className="project" aria-labelledby={`project-title-${project.id}`}>
              {project.category && <h3>{project.category}</h3>}
              <h2 id={`project-title-${project.id}`}>{project.title}</h2>
              <img
                src={getAssetPath(project.image)}
                alt={`Apercu du projet : ${project.title}`}
                loading="lazy"
                width="800"
                height="450"
              />
              <p>
                <strong>{project.teamSize} :</strong> {project.description}
              </p>

              {project.technologies && project.technologies.length > 0 && (
                <div className="project-tech" role="list" aria-label="Technologies utilisées">
                  {project.technologies.map((tech) => (
                    <div key={tech.name} role="listitem">
                      <img
                        src={tech.icon.startsWith('http') ? tech.icon : getAssetPath(tech.icon)}
                        alt={tech.name}
                        title={tech.name}
                        loading="lazy"
                        width="30"
                        height="30"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Link to={project.path} className="btn" aria-label={`En savoir plus sur ${project.title}`}>En savoir plus</Link>
            </article>

            {index < academicProjects.length - 1 && <hr aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projets;
