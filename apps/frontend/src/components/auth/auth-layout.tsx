import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout - Wraps authentication pages with:
 * - Luminous theme class for dark navy/cyan palette
 * - Gradient background for visual depth
 * - Centered content with full viewport height
 * - Hidden theme toggle on auth pages
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="luminous-theme flex min-h-screen w-full items-center justify-center p-4">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary-lum via-bg-secondary-lum to-bg-primary-lum" />

      {/* Animated background elements (subtle) */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute h-96 w-96 rounded-full bg-brand-cyan opacity-5"
          style={{
            top: '-10%',
            right: '-5%',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute h-96 w-96 rounded-full bg-brand-teal opacity-5"
          style={{
            bottom: '-10%',
            left: '-5%',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 w-full max-w-2xl">{children}</div>
    </div>
  );
}
