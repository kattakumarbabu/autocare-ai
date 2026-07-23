import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AutoCare AI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-4 border border-red-500/20 shadow-glow">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">Something went wrong</h2>
              <p className="text-slate-400 text-sm mt-1">
                An unexpected application error occurred. We've captured the error log.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="btn-primary w-full py-2.5 justify-center text-sm"
            >
              <RefreshCw size={16} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
