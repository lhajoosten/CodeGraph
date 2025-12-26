import React from 'react';
import { Card } from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
}

/**
 * Auth Card - Glass card wrapper for auth forms
 * - Uses luminousGlass variant for 70% opacity + 12px blur
 * - Centered on page with max-width constraint
 * - Generous padding for form content
 * - White border at 10% opacity for glass effect
 */
export function AuthCard({ children }: AuthCardProps) {
  return (
    <Card variant="luminousGlass" padding="lg" className="mx-auto w-full max-w-lg">
      {children}
    </Card>
  );
}
