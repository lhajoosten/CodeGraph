import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBackLink?: boolean;
}

function AuthLayout({ children, className, showBackLink = false }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        `
          bg-background flex min-h-screen flex-col items-center justify-center
          px-4 py-12
        `,
        `
          sm:px-6
          lg:px-8
        `,
        className
      )}
    >
      <div className="w-full max-w-xl space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`
                flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan
                shadow-lg
              `}
            >
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <span className="text-3xl font-bold text-brand-cyan">{APP_NAME}</span>
          </Link>
        </div>

        {/* Content */}
        <div
          className={`
            border-border-primary bg-surface-secondary shadow-card rounded-auth border p-8
          `}
        >
          {children}
        </div>

        {/* Back link */}
        {showBackLink && (
          <div className="text-center">
            <Link
              to="/login"
              search={{ redirect: '/' }}
              className={`
                text-text-secondary text-sm transition-colors
                hover:text-brand-cyan
              `}
            >
              &larr; Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Auth page title component
interface AuthTitleProps {
  title: string;
  description?: string;
  className?: string;
}

function AuthTitle({ title, description, className }: AuthTitleProps) {
  return (
    <div className={cn('mb-6 space-y-2 text-center', className)}>
      <h1 className="text-text-primary text-2xl font-bold">{title}</h1>
      {description && <p className="text-text-secondary text-sm">{description}</p>}
    </div>
  );
}

// Auth footer with links
interface AuthFooterProps {
  children: React.ReactNode;
  className?: string;
}

function AuthFooter({ children, className }: AuthFooterProps) {
  return (
    <div className={cn('text-text-secondary mt-6 text-center text-sm', className)}>
      {children}
    </div>
  );
}

// Auth divider with text
interface AuthDividerProps {
  text?: string;
  className?: string;
}

function AuthDivider({ text = 'or', className }: AuthDividerProps) {
  return (
    <div className={cn('relative my-6', className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="border-border-primary w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-surface-secondary text-text-muted px-2">{text}</span>
      </div>
    </div>
  );
}

export { AuthLayout, AuthTitle, AuthFooter, AuthDivider };
export type { AuthLayoutProps, AuthTitleProps, AuthFooterProps, AuthDividerProps };
