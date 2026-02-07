import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import BackToTopButton from './BackToTopButton.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import Footer from './Footer.jsx';
import HamburgerMenu from './HamburgerMenu.jsx';
import useDocumentMeta from '../hooks/useDocumentMeta.js';
import usePortfolioModules from '../hooks/usePortfolioModules.js';
import { getAssetPath } from '../utils/assetPath.js';

const trackFiles = ['deepstone.m4a', 'browser.m4a', 'wildriver.m4a'];

const pageConfig = {
  '/': {
    heading: 'Portfolio de Enzo MORELLO',
    subheading: 'Etudiant en IUT2',
    subheadingAlt: "Souhaiterait etre Developpeur d'applications",
    backgroundSrc: getAssetPath('assets/images/risk-of-rain-2-launch-update.jpg'),
    metaTitle: 'Portfolio - Enzo Morello',
    metaDescription: "Portfolio d'Enzo Morello, etudiant en BUT Informatique a l'IUT2 de Grenoble",
  },
  '/projets': {
    heading: 'Portfolio - Projets',
    backgroundSrc: getAssetPath('assets/images/destiny-2-landshaft-fentezi.webp'),
    metaTitle: 'Portfolio - Projets Academiques',
    metaDescription: "Decouvrez mes projets academiques realises a l'IUT2 de Grenoble",
  },
  '/projets-personnels': {
    heading: 'Projets personnels',
    backgroundSrc: getAssetPath('assets/images/europa_compressed.jpg'),
    metaTitle: 'Portfolio - Projets personnels',
    metaDescription: "Portfolio d'Enzo Morello - Projets personnels et creations",
  },
  '/projet-MEGASAE': {
    heading: 'Projet cardinal - Application de planification de banquets',
    backgroundSrc: getAssetPath('assets/images/beyondlight.png'),
    metaTitle: 'Projet cardinal - Application de gestion de banquets',
    metaDescription: "Portfolio d'Enzo Morello - Projet cardinal",
  },
  '/projet-SAE12': {
    heading: "Projet Implementation d'un besoin client | Comparaison d'approches algorithmiques",
    backgroundSrc: getAssetPath('assets/images/Destiny-2-Pyramids2.jpg'),
    metaTitle: "Projet Implementation d'un besoin client",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE12",
  },
  '/projet-SAE3': {
    heading: "Installation d'un poste pour le developpement | Carte mentale & Presentation",
    backgroundSrc: getAssetPath('assets/images/SpaceStation.png'),
    metaTitle: "Installation d'un poste pour le developpement",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE3",
  },
  '/projet-SAE4': {
    heading: "Projet - Creation d'une base de donnees",
    backgroundSrc: getAssetPath('assets/images/ClairObscurSwords.jpg'),
    metaTitle: "Projet - Creation d'une base de donnees",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE4",
  },
  '/projet-SAE56': {
    heading: "Projet - Creation d'un site institutionnel",
    backgroundSrc: getAssetPath('assets/images/pyramids2.png'),
    metaTitle: 'Projet - Creation site web institutionnel',
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE56",
  },
};

const Layout = () => {
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig['/'];
  const [isScrolled, setIsScrolled] = useState(false);

  useDocumentMeta(config.metaTitle, config.metaDescription);
  usePortfolioModules(trackFiles);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Track scroll position for compact header state
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 80;
      setIsScrolled(scrolled);
    };

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

      <header className={`header--main ${isScrolled ? 'header--compact' : 'header--full'}`}>
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

        {/* Page Title & Subtitle */}
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
