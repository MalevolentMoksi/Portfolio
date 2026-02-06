import { Link } from 'react-router-dom';
import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { academicProjects } from '@/data/projects.js';
import { getAssetPath } from '@/utils/assetPath.js';

const Projets = () => {
  useDocumentMeta('Projets | Portfolio', 'Mes projets scolaires et professionnels');

  return (
    <section id="project-list">
      <h2>
        <em>Mes Projets</em>
      </h2>

      {academicProjects.map((project, index) => (
        <div key={project.id}>
          <article className="project">
            {project.category && <h3>{project.category}</h3>}
            <h2>{project.title}</h2>
            <img
              src={getAssetPath(project.image)}
              alt={project.title}
              loading="lazy"
              width="800"
              height="450"
            />
            <p>
              <strong>{project.teamSize} :</strong> {project.description}
            </p>

            {project.technologies && project.technologies.length > 0 && (
              <div className="project-tech">
                {project.technologies.map((tech) => (
                  <img
                    key={tech.name}
                    src={getAssetPath(tech.icon)}
                    alt={tech.name}
                    title={tech.name}
                    loading="lazy"
                    width="30"
                    height="30"
                  />
                ))}
              </div>
            )}

            <Link to={project.path} className="btn">En savoir plus</Link>
          </article>

          {index < academicProjects.length - 1 && <hr />}
        </div>
      ))}
    </section>
  );
};

export default Projets;
