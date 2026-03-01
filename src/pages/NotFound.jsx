import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SnakeGame from '@/components/SnakeGame.jsx';
import useDocumentMeta from '@/hooks/useDocumentMeta.js';

/* ── Caractères « glitch » pour l'animation du titre ── */
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789';
const TARGET_TEXT = '404';

const NotFound = () => {
  useDocumentMeta('404 — Page introuvable', 'Cette page n\'existe pas.');

  const [showSnake, setShowSnake] = useState(false);
  const [glitchText, setGlitchText] = useState(TARGET_TEXT);

  /* Animation glitch au montage : les chiffres se « décodent » un par un */
  useEffect(() => {
    let frame = 0;
    const maxFrames = 18; // durée totale de l'animation
    const id = setInterval(() => {
      frame++;
      const progress = frame / maxFrames;
      const resolved = Math.floor(progress * TARGET_TEXT.length);
      let text = '';
      for (let i = 0; i < TARGET_TEXT.length; i++) {
        text += i < resolved
          ? TARGET_TEXT[i]
          : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      setGlitchText(text);
      if (frame >= maxFrames) {
        clearInterval(id);
        setGlitchText(TARGET_TEXT);
      }
    }, 70);
    return () => clearInterval(id);
  }, []);

  const closeSnake = useCallback(() => setShowSnake(false), []);

  return (
    <div className="not-found">
      {/* Fond particules décoratives */}
      <div className="not-found__stars" aria-hidden="true" />

      <div className="not-found__content">
        {/* Grand indicateur 404 */}
        <h1 className="not-found__code" aria-label="Erreur 404">
          {glitchText}
        </h1>

        <p className="not-found__title">Page introuvable</p>
        <p className="not-found__description">
          La page que vous cherchez n'existe pas, a été déplacée, ou vous a
          simplement échappé dans le vide interstellaire.
        </p>

        {/* Actions */}
        <div className="not-found__actions">
          <Link to="/" className="btn not-found__btn-home">
            ← Retour à l'accueil
          </Link>
          {!showSnake && (
            <button
              type="button"
              className="btn btn--secondary not-found__btn-snake"
              onClick={() => setShowSnake(true)}
            >
              🐍 Rester un peu plus longtemps
            </button>
          )}
        </div>

        {/* Snake Game (affiché au clic uniquement) */}
        {showSnake && (
          <div className="not-found__snake-container">
            <SnakeGame onClose={closeSnake} />
          </div>
        )}
      </div>

      {/* Petit footer discret */}
      <footer className="not-found__footer">
        <span>Enzo Morello — Portfolio</span>
      </footer>
    </div>
  );
};

export default NotFound;
