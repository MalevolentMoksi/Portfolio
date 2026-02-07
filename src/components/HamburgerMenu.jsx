import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '@styles/components/_hamburger-menu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes (handled by parent)
  const handleNavClick = () => {
    setIsOpen(false);
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
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
      {/* Hamburger Toggle Button */}
      <button
        aria-label="Basculer le menu de navigation"
        aria-expanded={isOpen}
        className={`hamburger-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay (closes menu when clicked) */}
      {isOpen && (
        <div
          className="hamburger-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Navigation Drawer */}
      <nav
        className={`hamburger-nav ${isOpen ? 'open' : ''}`}
        aria-label="Navigation mobile"
      >
        <ul>
          <li>
            <NavLink
              to="/"
              end
              onClick={handleNavClick}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets"
              onClick={handleNavClick}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              Projets
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets-personnels"
              onClick={handleNavClick}
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
