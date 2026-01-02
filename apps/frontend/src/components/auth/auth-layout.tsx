import React from 'react';
import { useHasMounted } from '@/hooks/common';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout - Wraps authentication pages with:
 * - Luminous theme class for dark navy/cyan palette
 * - Premium animated gradient background
 * - Floating animated orbs for depth
 * - Centered content with full viewport height
 * - Hidden theme toggle on auth pages
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const hasMounted = useHasMounted();

  return (
    <div className="luminous-theme relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      {/* Gradient background with noise texture */}
      <div className="noise absolute inset-0 bg-gradient-to-br from-background via-background-secondary to-background" />

      {/* Animated background orbs - Rich & Expressive */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary orb - top right, animated drift */}
        <div
          className={cn(
            'orb orb-cyan orb-animated absolute h-[500px] w-[500px]',
            hasMounted ? 'opacity-10' : 'opacity-0',
            'transition-opacity duration-1000'
          )}
          style={{ top: '-15%', right: '-10%' }}
        />

        {/* Secondary orb - bottom left, reverse animation */}
        <div
          className={cn(
            'orb orb-teal animate-drift-reverse absolute h-[600px] w-[600px]',
            hasMounted ? 'opacity-8' : 'opacity-0',
            'transition-opacity delay-200 duration-1000'
          )}
          style={{ bottom: '-20%', left: '-15%' }}
        />

        {/* Accent orb - center, slow drift */}
        <div
          className={cn(
            'orb orb-purple animate-drift-slow absolute h-[300px] w-[300px]',
            hasMounted ? 'opacity-5' : 'opacity-0',
            'transition-opacity delay-500 duration-1000'
          )}
          style={{ top: '30%', left: '20%' }}
        />

        {/* Additional floating orb for more depth */}
        <div
          className={cn(
            'orb orb-teal orb-animated absolute h-[200px] w-[200px]',
            hasMounted ? 'opacity-6' : 'opacity-0',
            'transition-opacity delay-300 duration-1000'
          )}
          style={{ top: '60%', right: '10%' }}
        />

        {/* Sparkle effects (subtle particles) */}
        <div
          className={cn(
            'absolute h-2 w-2 rounded-full bg-brand-cyan',
            hasMounted ? 'sparkle-particle' : 'opacity-0'
          )}
          style={{ top: '20%', left: '30%' }}
        />
        <div
          className={cn(
            'absolute h-1.5 w-1.5 rounded-full bg-brand-teal',
            hasMounted ? 'sparkle-particle stagger-2' : 'opacity-0'
          )}
          style={{ top: '70%', right: '25%' }}
        />
        <div
          className={cn(
            'absolute h-1 w-1 rounded-full bg-white',
            hasMounted ? 'sparkle-particle stagger-4' : 'opacity-0'
          )}
          style={{ top: '40%', left: '60%' }}
        />
      </div>

      {/* Content container with entrance animation */}
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl',
          hasMounted ? 'animate-slide-up-spring' : 'opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}
