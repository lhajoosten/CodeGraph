import React from 'react';
import { Card } from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
}

/**
 * Auth Card - Premium glass card wrapper for auth forms
 * - Uses glass-premium effect with enhanced backdrop blur
 * - Animated border shine for premium feel
 * - Centered on page with max-width constraint
 * - Generous padding for form content
 * - Subtle shadow glow for depth
 */
export function AuthCard({ children }: AuthCardProps) {
  return (
    <Card
      variant="glass"
      padding="lg"
      className="glass-premium border-shine relative mx-auto w-full max-w-lg overflow-hidden shadow-xl transition-shadow duration-500 hover:shadow-2xl"
    >
      {/* Subtle gradient accent at top */}
      <div className="pointer-events-none absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent" />

      {/* Content */}
      <div className="relative">{children}</div>
    </Card>
  );
}
