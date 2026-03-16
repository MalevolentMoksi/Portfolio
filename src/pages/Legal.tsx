import '@styles/components/_legal.css';
import useDocumentMeta from '@/hooks/useDocumentMeta';
import { useTranslation } from 'react-i18next';

const Legal = () => {
  const { t } = useTranslation();
  useDocumentMeta(t('legal.metaTitle'), t('legal.metaDescription'));

  return (
    <div className="legal-page">
      <p className="legal-updated">{t('legal.lastUpdated')}</p>

      <section className="legal-section" aria-labelledby="legal-mentions-title">
        <h2 id="legal-mentions-title">{t('legal.sections.mentions.title')}</h2>
        <p>{t('legal.sections.mentions.intro')}</p>

        <dl className="legal-definition-list">
          <div className="legal-definition-row">
            <dt>{t('legal.sections.mentions.editorLabel')}</dt>
            <dd>{t('legal.sections.mentions.editorValue')}</dd>
          </div>
          <div className="legal-definition-row">
            <dt>{t('legal.sections.mentions.directorLabel')}</dt>
            <dd>{t('legal.sections.mentions.directorValue')}</dd>
          </div>
          <div className="legal-definition-row">
            <dt>{t('legal.sections.mentions.hostingLabel')}</dt>
            <dd>{t('legal.sections.mentions.hostingValue')}</dd>
          </div>
          <div className="legal-definition-row">
            <dt>{t('legal.sections.mentions.contactLabel')}</dt>
            <dd>{t('legal.sections.mentions.contactValue')}</dd>
          </div>
        </dl>

        <p>{t('legal.sections.mentions.privateIndividualNotice')}</p>
      </section>

      <section className="legal-section" aria-labelledby="legal-privacy-title">
        <h2 id="legal-privacy-title">{t('legal.sections.privacy.title')}</h2>
        <p>{t('legal.sections.privacy.intro')}</p>

        <h3>{t('legal.sections.privacy.collectedDataTitle')}</h3>
        <ul className="legal-list">
          <li>{t('legal.sections.privacy.collectedData.contactForm')}</li>
          <li>{t('legal.sections.privacy.collectedData.preferences')}</li>
          <li>{t('legal.sections.privacy.collectedData.analytics')}</li>
        </ul>

        <h3>{t('legal.sections.privacy.usageTitle')}</h3>
        <ul className="legal-list">
          <li>{t('legal.sections.privacy.usage.contact')}</li>
          <li>{t('legal.sections.privacy.usage.experience')}</li>
          <li>{t('legal.sections.privacy.usage.measurement')}</li>
        </ul>

        <h3>{t('legal.sections.privacy.recipientsTitle')}</h3>
        <ul className="legal-list">
          <li>{t('legal.sections.privacy.recipients.formspree')}</li>
          <li>{t('legal.sections.privacy.recipients.hosting')}</li>
          <li>{t('legal.sections.privacy.recipients.analytics')}</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="legal-cookies-title">
        <h2 id="legal-cookies-title">{t('legal.sections.cookies.title')}</h2>
        <p>{t('legal.sections.cookies.intro')}</p>

        <ul className="legal-list">
          <li>{t('legal.sections.cookies.items.noAds')}</li>
          <li>{t('legal.sections.cookies.items.localStorage')}</li>
          <li>{t('legal.sections.cookies.items.sessionStorage')}</li>
        </ul>

        <p>{t('legal.sections.cookies.manage')}</p>
      </section>

      <section className="legal-section" aria-labelledby="legal-rights-title">
        <h2 id="legal-rights-title">{t('legal.sections.rights.title')}</h2>
        <p>{t('legal.sections.rights.intro')}</p>
        <p>{t('legal.sections.rights.contact')}</p>
      </section>

      <section className="legal-section" aria-labelledby="legal-ip-title">
        <h2 id="legal-ip-title">{t('legal.sections.ip.title')}</h2>
        <p>{t('legal.sections.ip.paragraph1')}</p>
        <p>{t('legal.sections.ip.paragraph2')}</p>
      </section>
    </div>
  );
};

export default Legal;
