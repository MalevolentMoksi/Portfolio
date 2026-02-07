import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import BackToTopButton from './BackToTopButton.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import Footer from './Footer.jsx';
import HamburgerMenu from './HamburgerMenu.jsx';
import useDocumentMeta from '../hooks/useDocumentMeta.js';
import usePortfolioModules from '../hooks/usePortfolioModules.js';
import { getAssetPath } from '../utils/assetPath.js';
import { discoverMusicTracks } from '../utils/discoverMusicTracks.js';

const trackFiles = discoverMusicTracks();

const pageConfig = {
  '/': {
    heading: 'Portfolio de Enzo MORELLO',
    subheading: 'Étudiant en IUT2',
    subheadingAlt: "Souhaiterait être Développeur d'applications",
    backgroundSrc: getAssetPath('assets/images/risk-of-rain-2-launch-update.jpg'),
    metaTitle: 'Portfolio - Enzo Morello',
    metaDescription: "Portfolio d'Enzo Morello, étudiant en BUT Informatique à l'IUT2 de Grenoble",
  },
  '/projets': {
    heading: 'Portfolio - Projets',
    subheading: 'Projets académiques et professionnels',
    backgroundSrc: getAssetPath('assets/images/destiny-2-landshaft-fentezi.webp'),
    metaTitle: 'Portfolio - Projets Académiques',
    metaDescription: "Découvrez mes projets académiques réalisés à l'IUT2 de Grenoble",
  },
  '/projets-personnels': {
    heading: 'Projets personnels',
    subheading: 'Créations et explorations créatives',
    backgroundSrc: getAssetPath('assets/images/europa_compressed.jpg'),
    metaTitle: 'Portfolio - Projets personnels',
    metaDescription: "Portfolio d'Enzo Morello - Projets personnels et créations",
  },
  '/projet-MEGASAE': {
    heading: 'Projet cardinal - Application de planification de banquets',
    backgroundSrc: getAssetPath('assets/images/beyondlight.png'),
    metaTitle: 'Projet cardinal - Application de gestion de banquets',
    metaDescription: "Portfolio d'Enzo Morello - Projet cardinal",
  },
  '/projet-SAE12': {
    heading: "Projet Implémentation d'un besoin client | Comparaison d'approches algorithmiques",
    backgroundSrc: getAssetPath('assets/images/Destiny-2-Pyramids2.jpg'),
    metaTitle: "Projet Implémentation d'un besoin client",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE12",
  },
  '/projet-SAE3': {
    heading: "Installation d'un poste pour le développement | Carte mentale & Présentation",
    backgroundSrc: getAssetPath('assets/images/SpaceStation.png'),
    metaTitle: "Installation d'un poste pour le développement",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE3",
  },
  '/projet-SAE4': {
    heading: "Projet - Création d'une base de données",
    backgroundSrc: getAssetPath('assets/images/ClairObscurSwords.jpg'),
    metaTitle: "Projet - Création d'une base de données",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE4",
  },
  '/projet-SAE56': {
    heading: "Projet - Création d'un site institutionnel",
    backgroundSrc: getAssetPath('assets/images/pyramids2.png'),
    metaTitle: 'Projet - Création site web institutionnel',
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE56",
  },
};

const Layout = () => {
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig['/'];
  const [scrollProgress, setScrollProgress] = useState(0);

  useDocumentMeta(config.metaTitle, config.metaDescription);
  usePortfolioModules(trackFiles);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Track scroll position for progressive header transition
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const transitionStart = 0;
      const transitionEnd = 300;
      
      // Calculate linear progress from 0 to 1
      const linearProgress = Math.min(Math.max((scrollY - transitionStart) / (transitionEnd - transitionStart), 0), 1);
      
      // Apply ease-out cubic function for smooth deceleration at the end
      // This makes the transition slow down naturally instead of stopping abruptly
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
      
      setScrollProgress(easedProgress);
    };

    // Initialize on mount
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <a href="#main" className="skip-to-content">Aller au contenu principal</a>
      <div id="particles-js" aria-hidden="true"></div>
      <img
        src={config.backgroundSrc}
        width="800"
        height="450"
        alt=""
        id="background"
        aria-hidden="true"
        loading="lazy"
      />

      <header 
        className="header--main"
        style={{
          '--scroll-progress': scrollProgress,
          '--header-padding': `${2 - (scrollProgress * 1.25)}rem`,
          '--hero-opacity': Math.max(0, 1 - (scrollProgress * 1.5)),
          '--hero-scale': 1 - (scrollProgress * 0.15),
          '--hero-pointer': scrollProgress > 0.3 ? 'none' : 'auto',
          '--branding-top': `${2 - (scrollProgress * 1)}rem`,
        }}
      >
        {/* Branding Section */}
        <div className="header--branding">
          <NavLink to="/" className="brand-logo" aria-label="Accueil - Enzo MORELLO">
            <span className="logo-icon">EM</span>
            <span className="logo-text">ENZO MORELLO</span>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className="header--nav-desktop" aria-label="Navigation principale">
          <ul>
            <li>
              <NavLink to="/" end aria-current={({ isActive }) => isActive ? "page" : undefined}>
                Accueil
              </NavLink>
            </li>
            <li>
              <NavLink to="/projets" aria-current={({ isActive }) => isActive ? "page" : undefined}>Projets</NavLink>
            </li>
            <li>
              <NavLink to="/projets-personnels" aria-current={({ isActive }) => isActive ? "page" : undefined}>Projets personnels</NavLink>
            </li>
          </ul>
        </nav>

        {/* Mobile Hamburger Menu */}
        <HamburgerMenu />

        {/* Page Title & Subtitle - Always in DOM, hidden via CSS */}
        <div className="header--hero">
          <h1 id="main-title">{config.heading}</h1>
          {config.subheading ? <h3>{config.subheading}</h3> : null}
          {config.subheadingAlt ? <h4>{config.subheadingAlt}</h4> : null}
        </div>
      </header>

      <main id="main">
        <Breadcrumbs />
        <Outlet />
      </main>

      <Footer />
      <BackToTopButton />
    </>
  );
};

export default Layout;
