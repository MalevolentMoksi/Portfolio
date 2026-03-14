import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { useTranslation } from 'react-i18next';
import ContactForm from '@/components/ContactForm.jsx';

const Home = () => {
  const { t } = useTranslation();
  useDocumentMeta(t('home.metaTitle'), t('home.metaDescription'));
  
  return (
    <>
      {/* === À propos === */}
      <section id="about" aria-labelledby="about-title">
        <h2 id="about-title">{t('home.about.title')}</h2>
        <article className="about-card">
          <p>
            {t('home.about.descriptionPrefix')} <strong>{t('home.about.program')}</strong>{' '}
            {t('home.about.descriptionMid')}{' '}
            <strong>{t('home.about.specialization')}</strong>. {t('home.about.descriptionSuffix')}
          </p>
          <div className="about-badges" role="list" aria-label={t('home.about.badgesAria')}>
            <span className="about-badge" role="listitem">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              {t('home.about.program')}
            </span>
            <span className="about-badge" role="listitem">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {t('home.about.year')}
            </span>
            <span className="about-badge" role="listitem">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {t('home.about.school')}
            </span>
            <span className="about-badge" role="listitem">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
              {t('home.about.specialization')}
            </span>
          </div>
        </article>
      </section>

      {/* === Compétences === */}
      <section id="skills" aria-labelledby="skills-title">
        <h2 id="skills-title">{t('home.skills.title')}</h2>
        <p className="skills-intro">{t('home.skills.intro')}</p>
        <div className="skills-cards" role="list">

          <div className="bot-feature-card" role="listitem">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <div>
              <strong>{t('home.skills.cards.web.title')}</strong>
              <div className="bot-skills-tags">
                <span className="bot-skill-tag">HTML / CSS</span>
                <span className="bot-skill-tag">JavaScript</span>
                <span className="bot-skill-tag">PHP</span>
                <span className="bot-skill-tag">Symfony</span>
                <span className="bot-skill-tag">React</span>
                <span className="bot-skill-tag">Vite</span>
              </div>
            </div>
          </div>

          <div className="bot-feature-card" role="listitem">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h6"/>
            </svg>
            <div>
              <strong>{t('home.skills.cards.backend.title')}</strong>
              <div className="bot-skills-tags">
                <span className="bot-skill-tag">Java</span>
                <span className="bot-skill-tag">Python</span>
                <span className="bot-skill-tag">C</span>
                <span className="bot-skill-tag">C++</span>
                <span className="bot-skill-tag">SQL</span>
                <span className="bot-skill-tag">PostgreSQL</span>
              </div>
            </div>
          </div>

          <div className="bot-feature-card" role="listitem">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              <polyline points="7 10 10 13 17 6" strokeWidth="2"/>
            </svg>
            <div>
              <strong>{t('home.skills.cards.tools.title')}</strong>
              <div className="bot-skills-tags">
                <span className="bot-skill-tag">Git</span>
                <span className="bot-skill-tag">Linux</span>
                <span className="bot-skill-tag">Bash</span>
                <span className="bot-skill-tag">JavaFX</span>
                <span className="bot-skill-tag">Docker</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* === Parcours === */}
      <section id="achievements" aria-labelledby="achievements-title">
        <h2 id="achievements-title">{t('home.timeline.title')}</h2>
        <ol className="timeline" aria-label={t('home.timeline.aria')}>
          <li className="timeline-item">
            <span className="timeline-year">{t('home.timeline.items.0.year')}</span>
            <div className="timeline-content">
              <strong>{t('home.timeline.items.0.title')}</strong>
              <span className="timeline-place">{t('home.timeline.items.0.place')}</span>
              <p>{t('home.timeline.items.0.desc')}</p>
            </div>
          </li>
          <li className="timeline-item">
            <span className="timeline-year">{t('home.timeline.items.1.year')}</span>
            <div className="timeline-content">
              <strong>{t('home.timeline.items.1.title')}</strong>
              <span className="timeline-place">{t('home.timeline.items.1.place')}</span>
              <p>{t('home.timeline.items.1.desc')}</p>
            </div>
          </li>
        </ol>
      </section>

      {/* === Centres d'intérêt === */}
      <section id="hobbies" aria-labelledby="hobbies-title">
        <h2 id="hobbies-title">{t('home.hobbies.title')}</h2>
        <div className="hobbies-grid" role="list">

          <div className="hobby-card" role="listitem">
            <svg className="hobby-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
            </svg>
            <span>{t('home.hobbies.items.art')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg className="hobby-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="16.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              <path d="M12 9v6M9 12h6" strokeWidth="2.5"/>
            </svg>
            <span>{t('home.hobbies.items.games')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg className="hobby-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <span>{t('home.hobbies.items.music')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg className="hobby-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
            <span>{t('home.hobbies.items.cinema')}</span>
          </div>

        </div>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">{t('home.contact.title')}</h2>
        <div className="contact-info">
          <ul>
            {/* <li>
              Email :
              <a href="#" className="email-glitch" aria-label="Adresse email masquée pour éviter le spam">
                <span className="local-part" data-text="##########"></span>@etu.univ-grenoble-alpes.fr
              </a>
            </li> */}
            <li>
              {t('home.contact.gitlabLabel')}{' '}
              <a
                href="https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('home.contact.gitlabAria')}
              >
                gricad-gitlab.univ-grenoble-alpes.fr/morelloe
              </a>
            </li>
            <li>
              {t('home.contact.linkedinLabel')}{' '}
              <a
                href="https://www.linkedin.com/in/enzo-morello-28a364392"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('home.contact.linkedinAria')}
              >
                www.linkedin.com/in/enzo-morello-28a364392
              </a>
            </li>
          </ul>
        </div>
        <ContactForm />
      </section>
    </>
  );
};

export default Home;
