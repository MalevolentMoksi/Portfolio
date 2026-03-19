import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@styles/components/_hamburger-menu.css';

const HamburgerMenu = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

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

  // Close menu on viewport resize to avoid layout inconsistency
  useEffect(() => {
    const handleResize = () => setIsOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escape key, body scroll lock, and focus trap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggleRef.current?.focus();
      }
    };

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !navRef.current) return;
      const focusable = navRef.current.querySelectorAll(
        'a, button, [tabindex]:not([tabindex=\"-1\"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('hamburger-menu-open');
      // Defer focus so a rapid second click on the toggle button isn't swallowed
      const firstLink = navRef.current?.querySelector('a');
      if (firstLink) requestAnimationFrame(() => (firstLink as HTMLElement).focus());
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('hamburger-menu-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = '';
      document.body.classList.remove('hamburger-menu-open');
    };
  }, [isOpen]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

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

      {portalTarget
        ? createPortal(
            <>
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
                <div className="hamburger-nav__header">
                  <p className="hamburger-nav__eyebrow">{t('common.mobileNav.aria')}</p>
                </div>
                <ul>
                  <li>
                    <NavLink to="/" end onClick={closeMenu}>
                      {t('common.nav.home')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/projets" onClick={closeMenu}>
                      {t('common.nav.projects')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/projets-personnels" onClick={closeMenu}>
                      {t('common.nav.personalProjects')}
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </>,
            portalTarget
          )
        : null}
    </>
  );
};

export default HamburgerMenu;
