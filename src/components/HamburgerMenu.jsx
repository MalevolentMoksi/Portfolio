import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '@styles/components/_hamburger-menu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  // Close menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Basculer le menu de navigation"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        className={`hamburger-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
      >
        <span className="hamburger-toggle__line"></span>
        <span className="hamburger-toggle__line"></span>
        <span className="hamburger-toggle__line"></span>
      </button>

      <div
        className={`hamburger-overlay ${isOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      ></div>

      <nav
        id="mobile-navigation"
        className={`hamburger-nav ${isOpen ? 'open' : ''}`}
        aria-label="Navigation mobile"
      >
        <ul>
          <li>
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets"
              onClick={closeMenu}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              Projets
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets-personnels"
              onClick={closeMenu}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              Projets personnels
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default HamburgerMenu;
