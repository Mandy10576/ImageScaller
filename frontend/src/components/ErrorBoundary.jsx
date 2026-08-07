import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-8">
          <div className="max-w-lg w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-zinc-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <pre className="text-left text-xs text-rose-300 bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-auto max-h-40">
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
