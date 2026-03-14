import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@styles/components/_hamburger-menu.css';

const HamburgerMenu = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const toggleRef = useRef(null);

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

  // Escape key, body scroll lock, and focus trap
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggleRef.current?.focus();
      }
    };

    const handleFocusTrap = (e) => {
      if (e.key !== 'Tab' || !navRef.current) return;
      const focusable = navRef.current.querySelectorAll('a, button, [tabindex]:not([tabindex=\"-1\"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'hidden';
      // Move focus into nav
      const firstLink = navRef.current?.querySelector('a');
      if (firstLink) firstLink.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        aria-label={t('common.mobileNav.toggleAria')}
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
        ref={navRef}
        className={`hamburger-nav ${isOpen ? 'open' : ''}`}
        aria-label={t('common.mobileNav.aria')}
      >
        <ul>
          <li>
            <NavLink
              to="/"
              end
              onClick={closeMenu}
            >
              {t('common.nav.home')}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets"
              onClick={closeMenu}
            >
              {t('common.nav.projects')}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projets-personnels"
              onClick={closeMenu}
            >
              {t('common.nav.personalProjects')}
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default HamburgerMenu;
