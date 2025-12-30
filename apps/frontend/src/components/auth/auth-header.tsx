interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

/**
 * Auth Header - Logo, title, and subtitle for auth pages
 * - Displays CodeGraph branding
 * - Title with cyan glow effect
 * - Optional subtitle for context
 */
export function AuthHeader({ title, subtitle, showLogo = true }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      {showLogo && (
        <div className="mb-6 flex justify-center">
          {/* CodeGraph Logo - can be replaced with actual SVG */}
          <div
            className="text-2xl font-bold"
            style={{
              color: '#22d3ee',
              textShadow: '0 0 12px rgba(34, 211, 238, 0.4)',
            }}
          >
            CodeGraph
          </div>
        </div>
      )}

      <h1 className="text-text-primary mb-2 text-3xl font-bold">{title}</h1>

      {subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>}
    </div>
  );
}
