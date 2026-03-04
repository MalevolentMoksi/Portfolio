import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext.jsx';
import '@styles/components/_contact-form.css';

const FORM_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || 'https://formspree.io/f/xreaoyjd';
const MIN_SUBMIT_DELAY_MS = 3000;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2000;

const ContactForm = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const mountTimestampRef = useRef(Date.now());
  const statusTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
  }, []);

  const clearStatusLater = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = setTimeout(() => setSubmitStatus(null), 5000);
  };

  const normalizeFormData = (data) => ({
    ...data,
    name: data.name.trim(),
    email: data.email.trim(),
    message: data.message.trim(),
  });

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name) newErrors.name = 'Le nom est requis';
    else if (data.name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Le nom ne doit pas dépasser ${MAX_NAME_LENGTH} caractères`;
    }

    if (!data.email) newErrors.email = 'L\'email est requis';
    else if (data.email.length > MAX_EMAIL_LENGTH) {
      newErrors.email = 'Veuillez entrer un email valide';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    if (!data.message) newErrors.message = 'Le message est requis';
    else if (data.message.length < 10)
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    else if (data.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Le message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères`;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (formData.website.trim()) {
      return;
    }

    if (Date.now() - mountTimestampRef.current < MIN_SUBMIT_DELAY_MS) {
      setGlobalError('Veuillez patienter quelques secondes avant d\'envoyer le formulaire.');
      return;
    }

    const normalizedData = normalizeFormData(formData);
    const newErrors = validateForm(normalizedData);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: normalizedData.name,
          email: normalizedData.email,
          message: normalizedData.message,
          _subject: `Nouveau message portfolio - ${normalizedData.name}`,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '', website: '' });
        mountTimestampRef.current = Date.now();
        clearStatusLater();
        showToast('Message envoyé avec succès !', { type: 'success' });
      } else {
        setSubmitStatus('error');
        clearStatusLater();
        showToast('Erreur lors de l\'envoi. Veuillez réessayer.', { type: 'error' });
      }
    } catch {
      setSubmitStatus('error');
      clearStatusLater();
      showToast('Erreur réseau. Vérifiez votre connexion.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group honeypot-field" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex="-1"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="contact-name">Nom *</label>
        <input
          id="contact-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Votre nom"
          disabled={isSubmitting}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <span id="name-error" className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="contact-email">Email *</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="votre.email@exemple.com"
          disabled={isSubmitting}
          maxLength={MAX_EMAIL_LENGTH}
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span id="email-error" className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="contact-message">Message *</label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Votre message..."
          rows="5"
          disabled={isSubmitting}
          maxLength={MAX_MESSAGE_LENGTH}
          required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        ></textarea>
        {errors.message && <span id="message-error" className="error-message">{errors.message}</span>}
      </div>

      {globalError && (
        <div className="status-message error" role="alert">
          ✗ {globalError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="submit-btn"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
      </button>

      {submitStatus === 'success' && (
        <div className="status-message success" role="alert">
          ✓ Message envoyé avec succès! Merci de votre message.
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="status-message error" role="alert">
          ✗ Une erreur s\'est produite. Veuillez réessayer.
        </div>
      )}
    </form>
  );
};

export default ContactForm;
