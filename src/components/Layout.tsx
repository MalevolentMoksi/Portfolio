import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
import { useAccessibility } from '../contexts/AccessibilityContext';
import ParticlesButton from './ParticlesButton';
const PetButton = lazy(() => import('./pet/PetButton'));
import useDocumentMeta from '../hooks/useDocumentMeta';
import useDynamicFavicon from '../hooks/useDynamicFavicon';
import useNavButtonEffects from '../hooks/useNavButtonEffects';
import usePerformanceTier from '../hooks/usePerformanceTier';
import usePortfolioModules from '../hooks/usePortfolioModules';
import useSessionTracking from '../hooks/useSessionTracking';
import { getAssetPath } from '../utils/assetPath';
import { discoverMusicTracks } from '../utils/discoverMusicTracks';
import { ReadingTimeProvider } from '../contexts/ReadingTimeContext';
const AmbientEffects = lazy(() => import('./ambient/AmbientEffects'));
const FooterDiorama = lazy(() => import('./ambient/FooterDiorama'));

const trackFiles = discoverMusicTracks();
const BACKGROUND_TRANSITION_MS = 650;

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
    backgroundSrc: getAssetPath('assets/images/backgrounds/risk-of-rain-2-launch-update.webp'),
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
  '/informations-legales': {
    headingKey: 'pageConfig.legal.heading',
    subheadingKey: 'pageConfig.legal.subheading',
    backgroundSrc: getAssetPath('assets/images/backgrounds/SpaceStation.webp'),
    metaTitleKey: 'pageConfig.legal.metaTitle',
    metaDescriptionKey: 'pageConfig.legal.metaDescription',
  },
};

const Layout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig['/'];
  const { mood } = useMood();
  const { settings: accessibilitySettings } = useAccessibility();
  const [isLanguageTransitioning, setIsLanguageTransitioning] = useState(false);
  const [activeBackgroundSrc, setActiveBackgroundSrc] = useState(config.backgroundSrc);
  const [overlayBackgroundSrc, setOverlayBackgroundSrc] = useState<string | null>(null);
  const [isBackgroundFading, setIsBackgroundFading] = useState(false);
  const transitionTokenRef = useRef(0);
  const overlayCleanupTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsLanguageTransitioning(false);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Listen for language change signal from LanguageButton to start fade
  useEffect(() => {
    const handleLanguageChanging = () => {
      if (accessibilitySettings.noMotion) {
        return;
      }
      setIsLanguageTransitioning(true);
    };

    window.addEventListener('portfolioLanguageChanging', handleLanguageChanging);
    return () => {
      window.removeEventListener('portfolioLanguageChanging', handleLanguageChanging);
    };
  }, [accessibilitySettings.noMotion]);

  const moodStageClassName = `mood-stage${isLanguageTransitioning ? ' is-translating-language-text' : ''}`;

  useDocumentMeta(t(config.metaTitleKey), t(config.metaDescriptionKey));
  useNavButtonEffects();
  usePortfolioModules(trackFiles);
  useSessionTracking(location.pathname);
  useDynamicFavicon(mood);
  usePerformanceTier();

  useEffect(() => {
    return () => {
      if (overlayCleanupTimeoutRef.current !== null) {
        window.clearTimeout(overlayCleanupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeBackgroundSrc === config.backgroundSrc) {
      return;
    }

    transitionTokenRef.current += 1;
    const transitionToken = transitionTokenRef.current;

    if (overlayCleanupTimeoutRef.current !== null) {
      window.clearTimeout(overlayCleanupTimeoutRef.current);
      overlayCleanupTimeoutRef.current = null;
    }

    if (accessibilitySettings.noMotion) {
      setOverlayBackgroundSrc(null);
      setIsBackgroundFading(false);
      setActiveBackgroundSrc(config.backgroundSrc);
      return;
    }

    setOverlayBackgroundSrc(activeBackgroundSrc);
    setIsBackgroundFading(true);

    const nextBackgroundImage = new window.Image();
    nextBackgroundImage.decoding = 'async';
    nextBackgroundImage.src = config.backgroundSrc;

    const finalizeTransition = () => {
      if (transitionTokenRef.current !== transitionToken) {
        return;
      }

      setActiveBackgroundSrc(config.backgroundSrc);

      requestAnimationFrame(() => {
        if (transitionTokenRef.current !== transitionToken) {
          return;
        }
        setIsBackgroundFading(false);
      });

      overlayCleanupTimeoutRef.current = window.setTimeout(() => {
        if (transitionTokenRef.current !== transitionToken) {
          return;
        }
        setOverlayBackgroundSrc(null);
        overlayCleanupTimeoutRef.current = null;
      }, BACKGROUND_TRANSITION_MS);
    };

    if (nextBackgroundImage.complete) {
      finalizeTransition();
    } else {
      nextBackgroundImage.onload = finalizeTransition;
      nextBackgroundImage.onerror = finalizeTransition;
    }

    return () => {
      nextBackgroundImage.onload = null;
      nextBackgroundImage.onerror = null;
    };
  }, [accessibilitySettings.noMotion, activeBackgroundSrc, config.backgroundSrc]);

  // Scroll to top when route changes
  useEffect(() => {
    // Use requestAnimationFrame to defer until browser is ready
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip-to-content">
        {t('common.header.skipToContent')}
      </a>
      <div className={moodStageClassName} data-mood={mood}>
        <div id="particles-js" aria-hidden="true"></div>
        <img
          src={activeBackgroundSrc}
          alt=""
          id="background"
          aria-hidden="true"
          loading="eager"
          fetchpriority="high"
        />
        {overlayBackgroundSrc ? (
          <img
            src={overlayBackgroundSrc}
            alt=""
            className={`background-layer--overlay${isBackgroundFading ? ' is-visible' : ''}`}
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
        ) : null}

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
          <Suspense fallback={null}>
            <PetButton />
          </Suspense>
          <MoodSwitcher />
          <ParticlesButton />
          <MiniTerminal />
        </div>
        </header>

        <section className="header--secondary" aria-label={t('common.header.secondaryAria')}>
          <div className="header--hero">
            <h1 id="main-title" data-typing-text={t(config.headingKey)}>
              {t(config.headingKey)}
            </h1>
            {config.subheadingKey ? (
              <h2 className="header-subheading">{t(config.subheadingKey)}</h2>
            ) : null}
            {config.subheadingAltKey ? (
              <h3 className="header-subheading-alt">{t(config.subheadingAltKey)}</h3>
            ) : null}
          </div>
        </section>

        <main id="main">
          <ReadingTimeProvider>
            <Breadcrumbs />
            <Outlet />
          </ReadingTimeProvider>
        </main>

        <Footer
          diorama={
            <Suspense fallback={null}>
              <FooterDiorama />
            </Suspense>
          }
        />
        {!accessibilitySettings.noMotion && (
          <div className="ambient-layers" aria-hidden="true">
            <Suspense fallback={null}>
              <AmbientEffects />
            </Suspense>
          </div>
        )}
        <BackToTopButton />
        </div>
    </>
  );
};

export default Layout;
