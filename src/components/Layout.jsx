import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import BackToTopButton from './BackToTopButton.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import Footer from './Footer.jsx';
import HamburgerMenu from './HamburgerMenu.jsx';
import MiniTerminal from './MiniTerminal.jsx';
import MoodSwitcher from './MoodSwitcher.jsx';
import ParticlesButton from './ParticlesButton.jsx';
import PetButton from './pet/PetButton.jsx';
import useDocumentMeta from '../hooks/useDocumentMeta.js';
import usePortfolioModules from '../hooks/usePortfolioModules.js';
import { getAssetPath } from '../utils/assetPath.js';
import { discoverMusicTracks } from '../utils/discoverMusicTracks.js';
import { ReadingTimeProvider } from '../contexts/ReadingTimeContext.jsx';
import AmbientEffects from './ambient/AmbientEffects.jsx';
import FooterDiorama from './ambient/FooterDiorama.jsx';

const trackFiles = discoverMusicTracks();

const pageConfig = {
  '/': {
    heading: 'Portfolio de Enzo MORELLO',
    subheading: 'Étudiant en IUT2',
    subheadingAlt: "en Parcours Développeur d'applications",
    backgroundSrc: getAssetPath('assets/images/backgrounds/risk-of-rain-2-launch-update.jpg'),
    metaTitle: 'Portfolio - Enzo Morello',
    metaDescription: "Portfolio d'Enzo Morello, étudiant en BUT Informatique à l'IUT2 de Grenoble",
  },
  '/projets': {
    heading: 'Portfolio - Projets',
    subheading: 'Projets académiques et professionnels',
    backgroundSrc: getAssetPath('assets/images/backgrounds/destiny-2-landshaft-fentezi.webp'),
    metaTitle: 'Portfolio - Projets Académiques',
    metaDescription: "Découvrez mes projets académiques réalisés à l'IUT2 de Grenoble",
  },
  '/projets-personnels': {
    heading: 'Projets personnels',
    subheading: 'Créations et explorations créatives',
    backgroundSrc: getAssetPath('assets/images/backgrounds/europa_compressed.jpg'),
    metaTitle: 'Portfolio - Projets personnels',
    metaDescription: "Portfolio d'Enzo Morello - Projets personnels et créations",
  },
  '/projet-MEGASAE': {
    heading: 'Projet cardinal - Application de planification de banquets',
    backgroundSrc: getAssetPath('assets/images/backgrounds/beyondlight.png'),
    metaTitle: 'Projet cardinal - Application de gestion de banquets',
    metaDescription: "Portfolio d'Enzo Morello - Projet cardinal",
  },
  '/projet-SAE12': {
    heading: "Projet Implémentation d'un besoin client | Comparaison d'approches algorithmiques",
    backgroundSrc: getAssetPath('assets/images/backgrounds/Destiny-2-Pyramids2.jpg'),
    metaTitle: "Projet Implémentation d'un besoin client",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE12",
  },
  '/projet-SAE3': {
    heading: "Installation d'un poste pour le développement | Carte mentale & Présentation",
    backgroundSrc: getAssetPath('assets/images/backgrounds/SpaceStation.png'),
    metaTitle: "Installation d'un poste pour le développement",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE3",
  },
  '/projet-SAE4': {
    heading: "Projet - Création d'une base de données",
    backgroundSrc: getAssetPath('assets/images/backgrounds/ClairObscurSwords.jpg'),
    metaTitle: "Projet - Création d'une base de données",
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE4",
  },
  '/projet-SAE56': {
    heading: "Projet - Création d'un site institutionnel",
    backgroundSrc: getAssetPath('assets/images/backgrounds/pyramids2.png'),
    metaTitle: 'Projet - Création site web institutionnel',
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE56",
  },
  '/projet-SAE3.01': {
    heading: "Aidémé – Application Web de coordination pour les aidants",
    subheading: 'Une plateforme collaborative pour gérer le suivi des personnes dépendantes',
    backgroundSrc: getAssetPath('assets/images/backgrounds/pyramids2.png'),
    metaTitle: 'Aidémé – Application Web pour les aidants',
    metaDescription: "Portfolio d'Enzo Morello - Projet SAE 3.01 : application full-stack React + PHP",
  },
};

const Layout = () => {
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig['/'];

  useDocumentMeta(config.metaTitle, config.metaDescription);
  usePortfolioModules(trackFiles);

  // Scroll to top when route changes
  useEffect(() => {
    // Use requestAnimationFrame to defer until browser is ready
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location.pathname]);

  // Initialisation du suivi de session (timestamp de début)
  useEffect(() => {
    if (!sessionStorage.getItem('session-start')) {
      sessionStorage.setItem('session-start', Date.now().toString());
    }
  }, []);

  // Suivi des pages visitées dans la session courante
  useEffect(() => {
    const pages = JSON.parse(sessionStorage.getItem('session-pages') || '[]');
    if (!pages.includes(location.pathname)) {
      pages.push(location.pathname);
      sessionStorage.setItem('session-pages', JSON.stringify(pages));
    }
  }, [location.pathname]);



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
              <NavLink to="/" end>
                Accueil
              </NavLink>
            </li>
            <li>
              <NavLink to="/projets">Projets</NavLink>
            </li>
            <li>
              <NavLink to="/projets-personnels">Projets personnels</NavLink>
            </li>
          </ul>
        </nav>

        {/* Mobile Hamburger Menu */}
        <HamburgerMenu />

        {/* Actions interactives — slot droit de la barre de navigation */}
        <div className="header--actions" role="toolbar" aria-label="Actions interactives">
          <PetButton />
          <MoodSwitcher />
          <ParticlesButton />
          <MiniTerminal />
        </div>
      </header>

      <section className="header--secondary" aria-label="En-tête secondaire de la page">
        <div className="header--hero">
          <h1 id="main-title">{config.heading}</h1>
          {config.subheading ? <h3 className="header-subheading">{config.subheading}</h3> : null}
          {config.subheadingAlt ? <h4 className="header-subheading-alt">{config.subheadingAlt}</h4> : null}
        </div>
      </section>

      <main id="main">
        <ReadingTimeProvider>
          <Breadcrumbs />
          <Outlet />
        </ReadingTimeProvider>
      </main>

      <Footer diorama={<FooterDiorama />} />
      <AmbientEffects />
      <BackToTopButton />
    </>
  );
};

export default Layout;
