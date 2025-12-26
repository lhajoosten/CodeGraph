export type PasswordStrength = 'weak' | 'medium' | 'strong';

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
}

/**
 * Get password strength based on criteria
 * - Weak: Less than 8 chars
 * - Medium: 8+ chars, has uppercase and lowercase
 * - Strong: 8+ chars, has uppercase, lowercase, and number
 */
function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return 'weak';
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (hasUppercase && hasLowercase && hasNumber) {
    return 'strong';
  }

  if (hasUppercase && hasLowercase) {
    return 'medium';
  }

  return 'weak';
}

function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-error';
    case 'medium':
      return 'bg-warning';
    case 'strong':
      return 'bg-brand-lime';
    default:
      return 'bg-gray-400';
  }
}

function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    default:
      return '';
  }
}

/**
 * Password Strength Indicator - Visual feedback for password quality
 * - Progress bar with color transitions
 * - Weak (red), Medium (yellow), Strong (lime)
 * - Optional label text
 * - Smooth animations
 */
export function PasswordStrengthIndicator({
  password,
  showLabel = true,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const strengthPercentage = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100;
  const colorClass = getStrengthColor(strength);
  const label = getStrengthLabel(strength);

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-steel">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {showLabel && password && (
        <p className="text-xs font-medium text-text-secondary-lum">
          Password strength:{' '}
          <span
            className={
              strength === 'weak'
                ? 'text-error'
                : strength === 'medium'
                  ? 'text-warning'
                  : 'text-brand-lime'
            }
          >
            {label}
          </span>
        </p>
      )}

      {password && strength !== 'strong' && (
        <ul className="mt-2 space-y-1 text-xs text-text-muted-lum">
          <li className="flex items-center gap-2">
            <span className={password.length >= 8 ? 'text-success' : 'text-text-muted-lum'}>✓</span>
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <span
              className={
                /[A-Z]/.test(password) && /[a-z]/.test(password)
                  ? 'text-success'
                  : 'text-text-muted-lum'
              }
            >
              ✓
            </span>
            Mix of uppercase and lowercase
          </li>
          <li className="flex items-center gap-2">
            <span className={/[0-9]/.test(password) ? 'text-success' : 'text-text-muted-lum'}>
              ✓
            </span>
            At least one number
          </li>
        </ul>
      )}

      {password && strength === 'strong' && (
        <p className="text-xs text-brand-lime">✓ Strong password!</p>
      )}
    </div>
  );
}
