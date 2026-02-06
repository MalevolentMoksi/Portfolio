import { useEffect } from 'react';

const ensureDescriptionMeta = () => {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  return meta;
};

const useDocumentMeta = (title, description) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      const meta = ensureDescriptionMeta();
      meta.setAttribute('content', description);
    }
  }, [title, description]);
};

export default useDocumentMeta;
