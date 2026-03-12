import { NavLink, useLocation } from 'react-router-dom';
import FooterWidget from './FooterWidget.jsx';

const Footer = ({ diorama }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const FooterLink = ({ to, children }) => {
    const isActive = currentPath === to;
    if (isActive) {
      return (
        <span className="footer-top-link active" aria-current="page" aria-disabled="true">
          {children}
        </span>
      );
    }

    return (
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? 'footer-top-link active' : 'footer-top-link')}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        {children}
      </NavLink>
    );
  };

  return (
    <footer className="site-footer">
      {diorama}

      {/* ─── Bande supérieure : micro-navigation + indicateur de thème ─── */}
      <div className="footer-top">
        <nav className="footer-top-nav" aria-label="Navigation secondaire">
          <FooterLink to="/about">À propos du portfolio</FooterLink>
          <FooterLink to="/credits">Crédits</FooterLink>
        </nav>
        <FooterWidget />
      </div>

    <div className="footer-inner">
      <div className="footer-left">Enzo Morello &copy; 2026</div>
      <div className="footer-center footer-bubbles">
        <a
          href="https://github.com/MalevolentMoksi"
          className="bubble"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profil GitHub"
        >
          <img
            src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg"
            alt="GitHub"
            width="22"
            height="22"
          />
        </a>
        <a href="/#contact" className="bubble" aria-label="Email">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 8l8 6 8-6M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8M4 8l8 6 8-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <a
          href="https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe"
          className="bubble"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profil GitLab"
        >
          <img
            src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg"
            alt="GitLab"
            width="22"
            height="22"
          />
        </a>
      </div>
      <div className="footer-right" id="footer-fun">
        <span id="footer-clock" aria-label="Horloge" role="timer"></span>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
