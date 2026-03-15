import { useEffect } from 'react';

const ensureDescriptionMeta = (): HTMLMetaElement => {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  return meta;
};

const ensureCanonicalLink = (): HTMLLinkElement => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  return link;
};

const useDocumentMeta = (title?: string, description?: string): void => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      const meta = ensureDescriptionMeta();
      meta.setAttribute('content', description);
    }
    // Canonical URL — normalises the page URL by stripping query strings and
    // hash fragments, which prevents duplicate-content SEO penalties.
    const canonical = ensureCanonicalLink();
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, [title, description]);
};

export default useDocumentMeta;
