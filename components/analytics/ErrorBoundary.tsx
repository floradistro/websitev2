/**
 * Error Boundary for Analytics Pages
 * Catches and displays errors gracefully with retry functionality
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics Error Boundary]', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, etc.)
    // Example:
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="w-full px-4 lg:px-0 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-lg mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-white/60 text-sm mb-4">
                    We encountered an error while loading the analytics. This has been logged
                    and we'll look into it.
                  </p>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mb-4">
                      <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60 transition mb-2">
                        Error details (development only)
                      </summary>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-4 overflow-auto max-h-64">
                        <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap">
                          {this.state.error.toString()}
                          {'\n\n'}
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                    </details>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={this.handleReset}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-sm font-medium transition"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 * For functional components
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function withAnalyticsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <AnalyticsErrorBoundary>
        <Component {...props} />
      </AnalyticsErrorBoundary>
    );
  };
}
