/**
 * Global error boundary for catching unhandled React component errors.
 * Displays user-friendly error UI and logs errors for debugging.
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally reload the page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`
            flex min-h-screen items-center justify-center bg-gradient-to-br
            from-red-50 to-orange-50 px-4 py-12
          `}
        >
          <div
            className={`
              w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-xl
            `}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-full
                    bg-red-100
                  `}
                >
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-center text-2xl font-bold text-text-primary">
                Oops! Something went wrong
              </h1>
              <p className="text-center text-sm text-text-secondary">
                We encountered an unexpected error. Our team has been notified and we&apos;re
                working on a fix.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="font-mono text-xs text-red-700">{this.state.error.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={this.handleReset} className="w-full">
                Go to Home Page
              </Button>
              <button
                onClick={() => window.location.reload()}
                className={`
                  w-full rounded-lg border border-gray-300 px-4 py-2 text-center
                  text-sm font-medium text-gray-700 transition
                  hover:bg-gray-50
                `}
              >
                Try Again
              </button>
            </div>

            <p className="text-center text-xs text-text-tertiary">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
