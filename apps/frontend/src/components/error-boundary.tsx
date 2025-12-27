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
          style={{
            background: `linear-gradient(135deg, var(--color-bg-primary-lum) 0%, var(--color-bg-elevated-lum) 100%)`,
          }}
          className="flex min-h-screen items-center justify-center px-4 py-12"
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary-lum)',
              borderColor: 'var(--color-border-steel)',
            }}
            className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div
                  style={{
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    borderColor: 'rgba(34, 211, 238, 0.3)',
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full border"
                >
                  <svg
                    style={{ color: 'var(--color-brand-cyan)' }}
                    className="h-6 w-6"
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
              <h1
                style={{ color: 'var(--color-text-primary-lum)' }}
                className="text-center text-2xl font-bold"
              >
                Oops! Something went wrong
              </h1>
              <p
                style={{ color: 'var(--color-text-secondary-lum)' }}
                className="text-center text-sm"
              >
                We encountered an unexpected error. Our team has been notified and we&apos;re
                working on a fix.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  backgroundColor: 'rgba(34, 211, 238, 0.05)',
                  borderColor: 'rgba(34, 211, 238, 0.2)',
                }}
                className="rounded-lg border p-4"
              >
                <p style={{ color: 'var(--color-brand-cyan)' }} className="font-mono text-xs">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="default" onClick={this.handleReset} className="flex-1">
                Go to Home Page
              </Button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: 'var(--color-bg-steel)',
                  borderColor: 'var(--color-border-steel)',
                  color: 'var(--color-text-secondary-lum)',
                }}
                className="flex-1 rounded-lg border px-4 py-2 text-center text-sm font-medium transition hover:border-cyan-500/50 hover:bg-slate-700"
              >
                Try Again
              </button>
            </div>

            <p style={{ color: 'var(--color-text-muted-lum)' }} className="text-center text-xs">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
