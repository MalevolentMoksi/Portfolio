import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AccessibilityButton from './AccessibilityButton';
import BackToTopButton from './BackToTopButton';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';
import HamburgerMenu from './HamburgerMenu';
import LanguageButton from './LanguageButton';
import MiniTerminal from './MiniTerminal';
import MoodSwitcher from './MoodSwitcher';
import { useMood } from '../contexts/MoodContext';
import ParticlesButton from './ParticlesButton';
import PetButton from './pet/PetButton';
import useDocumentMeta from '../hooks/useDocumentMeta';
import usePortfolioModules from '../hooks/usePortfolioModules';
import { getAssetPath } from '../utils/assetPath';
import { discoverMusicTracks } from '../utils/discoverMusicTracks';
import { getPerformanceTier } from '../utils/performanceTier';
import { safeSessionGet, safeSessionSet } from '../utils/safeStorage';
import { ReadingTimeProvider } from '../contexts/ReadingTimeContext';
import AmbientEffects from './ambient/AmbientEffects';
import FooterDiorama from './ambient/FooterDiorama';

const trackFiles = discoverMusicTracks();

interface PageConfigItem {
  headingKey: string;
  subheadingKey?: string;
  subheadingAltKey?: string;
  backgroundSrc: string;
  metaTitleKey: string;
  metaDescriptionKey: string;
}

const pageConfig: Record<string, PageConfigItem> = {
  '/': {
    headingKey: 'pageConfig.home.heading',
    subheadingKey: 'pageConfig.home.subheading',
    subheadingAltKey: 'pageConfig.home.subheadingAlt',
    backgroundSrc: getAssetPath('assets/images/backgrounds/risk-of-rain-2-launch-update.jpg'),
    metaTitleKey: 'pageConfig.home.metaTitle',
    metaDescriptionKey: 'pageConfig.home.metaDescription',
  },
  '/projets': {
    headingKey: 'pageConfig.projets.heading',
    subheadingKey: 'pageConfig.projets.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/destiny-2-landshaft-fentezi.webp'),
    metaTitleKey: 'pageConfig.projets.metaTitle',
    metaDescriptionKey: 'pageConfig.projets.metaDescription',
  },
  '/projets-personnels': {
    headingKey: 'pageConfig.projetsPersonnels.heading',
    subheadingKey: 'pageConfig.projetsPersonnels.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/europa_compressed.jpg'),
    metaTitleKey: 'pageConfig.projetsPersonnels.metaTitle',
    metaDescriptionKey: 'pageConfig.projetsPersonnels.metaDescription',
  },
  '/projet-MEGASAE': {
    headingKey: 'pageConfig.projetMegasae.heading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/beyondlight.webp'),
    metaTitleKey: 'pageConfig.projetMegasae.metaTitle',
    metaDescriptionKey: 'pageConfig.projetMegasae.metaDescription',
  },
  '/projet-SAE12': {
    headingKey: 'pageConfig.projetSae12.heading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/pyramids2.webp'),
    metaTitleKey: 'pageConfig.projetSae12.metaTitle',
    metaDescriptionKey: 'pageConfig.projetSae12.metaDescription',
  },
  '/projet-SAE3': {
    headingKey: 'pageConfig.projetSae3.heading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/SpaceStation.webp'),
    metaTitleKey: 'pageConfig.projetSae3.metaTitle',
    metaDescriptionKey: 'pageConfig.projetSae3.metaDescription',
  },
  '/projet-SAE4': {
    headingKey: 'pageConfig.projetSae4.heading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/Destiny2PyramidStation.webp'),
    metaTitleKey: 'pageConfig.projetSae4.metaTitle',
    metaDescriptionKey: 'pageConfig.projetSae4.metaDescription',
  },
  '/projet-SAE56': {
    headingKey: 'pageConfig.projetSae56.heading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/pyramids2.webp'),
    metaTitleKey: 'pageConfig.projetSae56.metaTitle',
    metaDescriptionKey: 'pageConfig.projetSae56.metaDescription',
  },
  '/projet-SAE3.01': {
    headingKey: 'pageConfig.projetSae301.heading',
    subheadingKey: 'pageConfig.projetSae301.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/Destiny2EuropaPyramid.webp'),
    metaTitleKey: 'pageConfig.projetSae301.metaTitle',
    metaDescriptionKey: 'pageConfig.projetSae301.metaDescription',
  },
  '/about': {
    headingKey: 'pageConfig.about.heading',
    subheadingKey: 'pageConfig.about.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/ROR2ReturnsSpace.webp'),
    metaTitleKey: 'pageConfig.about.metaTitle',
    metaDescriptionKey: 'pageConfig.about.metaDescription',
  },
  '/credits': {
    headingKey: 'pageConfig.credits.heading',
    subheadingKey: 'pageConfig.credits.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/RiskOfRain2SurvivorsOfTheVoid.webp'),
    metaTitleKey: 'pageConfig.credits.metaTitle',
    metaDescriptionKey: 'pageConfig.credits.metaDescription',
  },
};

const Layout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig['/'];
  const { mood } = useMood();

  useDocumentMeta(t(config.metaTitleKey), t(config.metaDescriptionKey));
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
    if (!safeSessionGet('session-start')) {
      safeSessionSet('session-start', Date.now().toString());
    }
  }, []);

  // Suivi des pages visitées dans la session courante
  useEffect(() => {
    const rawPages = safeSessionGet('session-pages') || '[]';
    let pages = [];
    try {
      pages = JSON.parse(rawPages);
    } catch {
      pages = [];
    }
    if (!pages.includes(location.pathname)) {
      pages.push(location.pathname);
      safeSessionSet('session-pages', JSON.stringify(pages));
    }
  }, [location.pathname]);

  // Ajouter le tier de performance à body pour les règles CSS conditionnelles
  useEffect(() => {
    const tier = getPerformanceTier();
    document.body.setAttribute('data-perf-tier', tier);
  }, []);

  // Swap favicon selon le mood actif
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = getAssetPath(`assets/images/favicon-${mood}.svg`);
    }
  }, [mood]);

  return (
    <>
      <a href="#main" className="skip-to-content">
        {t('common.header.skipToContent')}
      </a>
      <div id="particles-js" aria-hidden="true"></div>
      <img
        src={config.backgroundSrc}
        width="800"
        height="450"
        alt=""
        id="background"
        aria-hidden="true"
        loading="eager"
        fetchpriority="high"
      />

      <header className="header--main">
        {/* Branding Section */}
        <div className="header--branding">
          <NavLink to="/" className="brand-logo" aria-label={t('common.header.brandAria')}>
            <span className="logo-icon">EM</span>
            <span className="logo-text">ENZO MORELLO</span>
          </NavLink>
        </div>

        <div
          className="header--controls"
          role="toolbar"
          aria-label={t('common.header.controlsAria')}
        >
          <LanguageButton />
          <AccessibilityButton />
        </div>

        {/* Desktop Navigation */}
        <nav className="header--nav-desktop" aria-label={t('common.nav.primaryAria')}>
          <ul>
            <li>
              <NavLink to="/" end>
                {t('common.nav.home')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/projets">{t('common.nav.projects')}</NavLink>
            </li>
            <li>
              <NavLink to="/projets-personnels">{t('common.nav.personalProjects')}</NavLink>
            </li>
          </ul>
        </nav>

        {/* Mobile Hamburger Menu */}
        <HamburgerMenu />

        {/* Actions interactives — slot droit de la barre de navigation */}
        <div className="header--actions" role="toolbar" aria-label={t('common.header.actionsAria')}>
          <PetButton />
          <MoodSwitcher />
          <ParticlesButton />
          <MiniTerminal />
        </div>
      </header>

      <section className="header--secondary" aria-label={t('common.header.secondaryAria')}>
        <div className="header--hero">
          <h1 id="main-title">{t(config.headingKey)}</h1>
          {config.subheadingKey ? (
            <h3 className="header-subheading">{t(config.subheadingKey)}</h3>
          ) : null}
          {config.subheadingAltKey ? (
            <h4 className="header-subheading-alt">{t(config.subheadingAltKey)}</h4>
          ) : null}
        </div>
      </section>

      <main id="main">
        <ReadingTimeProvider>
          <Breadcrumbs />
          <Outlet />
        </ReadingTimeProvider>
      </main>

      <Footer diorama={<FooterDiorama />} />
      <div className="ambient-layers" aria-hidden="true">
        <AmbientEffects />
      </div>
      <BackToTopButton />
    </>
  );
};

export default Layout;
