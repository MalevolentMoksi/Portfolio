import { useTranslation } from 'react-i18next';

const BackToTopButton = () => {
  const { t } = useTranslation();
  return (
    <button id="back-to-top" aria-label={t('common.backToTop.aria')}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 4L12 20M12 4L6 10M12 4L18 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default BackToTopButton;
