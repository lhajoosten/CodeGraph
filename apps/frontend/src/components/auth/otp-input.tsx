import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoSubmit?: boolean;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  hint?: string;
}

/**
 * OTP Input - 6-digit one-time password input
 * - Individual input boxes for each digit
 * - Auto-advance to next field on digit entry
 * - Auto-submit when all digits are filled (optional)
 * - Paste support (6-digit codes split across fields)
 * - Backspace navigation (focus previous field)
 * - Modern styling with smooth animations
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoSubmit = false,
  disabled = false,
  error = false,
  label = 'Verification Code',
  hint = 'Enter the 6-digit code from your authenticator app',
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length - value.length).fill(''))
  );
  const [hasCompleted, setHasCompleted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setOtp(value.split('').concat(Array(length - value.length).fill('')));
    // Reset completion flag when value changes (e.g., when cleared after error)
    if (value.length < length) {
      setHasCompleted(false);
    }
  }, [value, length]);

  const triggerComplete = useCallback(
    (completeValue: string) => {
      if (autoSubmit && onComplete && !hasCompleted && completeValue.length === length) {
        // Ensure all digits are present (no empty strings)
        const allFilled = completeValue.split('').every((d) => d !== '');
        if (allFilled) {
          setHasCompleted(true);
          // Small delay to allow the UI to update before submitting
          setTimeout(() => {
            onComplete(completeValue);
          }, 100);
        }
      }
    },
    [autoSubmit, onComplete, hasCompleted, length]
  );

  const handleChange = (index: number, val: string) => {
    // Only allow digits
    const digit = val.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Handle paste: split pasted value across fields
      const pastedDigits = digit.split('').slice(0, length);
      const newOtp = [...otp];

      pastedDigits.forEach((d, i) => {
        if (index + i < length) {
          newOtp[index + i] = d;
        }
      });

      setOtp(newOtp);
      const newValue = newOtp.join('');
      onChange(newValue);

      // Focus last filled field or last field
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      // Check for completion
      triggerComplete(newValue);
    } else {
      // Single digit entry
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      const newValue = newOtp.join('');
      onChange(newValue);

      // Auto-advance to next field
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check for completion (if this is the last digit)
      if (digit && index === length - 1) {
        triggerComplete(newValue);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current field
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous field and clear it
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select the content when focusing
    e.target.select();
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-text-secondary block text-center text-sm font-medium">
          {label}
        </label>
      )}

      <div className="flex justify-center gap-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={handleFocus}
            disabled={disabled}
            aria-label={`Digit ${index + 1}`}
            className={cn(
              // Base styles
              'h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold',
              'bg-surface/80 text-text-primary backdrop-blur-sm',
              'transition-all duration-200 ease-out',
              'placeholder:text-text-muted',
              // Error state
              error
                ? 'border-error animate-shake shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : // Focus and filled states
                  otp[index]
                  ? 'border-brand-teal shadow-glow-teal scale-[1.02]'
                  : 'border-border-primary hover:border-brand-teal/50',
              !error &&
                'focus:border-brand-teal focus:shadow-glow-teal focus:scale-105 focus:outline-none',
              // Disabled state
              'disabled:hover:border-border-primary disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
        ))}
      </div>

      {hint && <p className="text-text-muted text-center text-xs">{hint}</p>}
    </div>
  );
}
