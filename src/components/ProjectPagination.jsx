import { Link } from 'react-router-dom';

/**
 * ProjectPagination Component
 * Affiche les liens vers le projet précédent et suivant
 */

const projects = [
  { path: '/projet-SAE12', title: 'SAE 1.2 - Implémentation besoin client' },
  { path: '/projet-SAE3', title: 'SAE 3 - Installation poste développement' },
  { path: '/projet-SAE4', title: 'SAE 4 - Création base de données' },
  { path: '/projet-SAE56', title: 'SAE 5-6 - Site web institutionnel' },
  { path: '/projet-MEGASAE', title: 'MEGASAE - Application de banquets' },
];

const ProjectPagination = ({ currentPath }) => {
  const currentIndex = projects.findIndex(p => p.path === currentPath);
  
  if (currentIndex === -1) return null;
  
  const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
  const nextIndex = (currentIndex + 1) % projects.length;
  
  const prevProject = projects[prevIndex];
  const nextProject = projects[nextIndex];

  return (
    <nav className="project-pagination" aria-label="Navigation entre projets">
      <Link 
        to={prevProject.path} 
        className="project-pagination-link prev"
        aria-label={`Projet précédent : ${prevProject.title}`}
      >
        <span className="pagination-arrow" aria-hidden="true">←</span>
        <div className="pagination-content">
          <span className="pagination-label">Projet précédent</span>
          <span className="pagination-title">{prevProject.title}</span>
        </div>
      </Link>
      
      <Link 
        to="/projets" 
        className="project-pagination-link back-to-list"
        aria-label="Retour à la liste des projets"
      >
        <span className="pagination-icon" aria-hidden="true">◉</span>
        <span>Tous les projets</span>
      </Link>
      
      <Link 
        to={nextProject.path} 
        className="project-pagination-link next"
        aria-label={`Projet suivant : ${nextProject.title}`}
      >
        <div className="pagination-content">
          <span className="pagination-label">Projet suivant</span>
          <span className="pagination-title">{nextProject.title}</span>
        </div>
        <span className="pagination-arrow" aria-hidden="true">→</span>
      </Link>
    </nav>
  );
};

export default ProjectPagination;
