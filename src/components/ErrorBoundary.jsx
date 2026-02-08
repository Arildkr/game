import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Noe gikk galt</h2>
          <p>Spillet krasjet. Prøv å laste siden på nytt.</p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false })}
          >
            Prøv igjen
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            style={{ marginLeft: '1rem' }}
          >
            Last siden på nytt
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
