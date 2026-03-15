import React from 'react';

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary. Catches unhandled render errors and shows a
 * friendly recovery screen instead of leaving the user on a blank page.
 */
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Oops, une erreur est survenue.
          </h1>
          <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
            Veuillez rafraîchir la page ou réessayer plus tard.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '1rem',
              cursor: 'pointer',
              borderRadius: '0.4rem',
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
            }}
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
