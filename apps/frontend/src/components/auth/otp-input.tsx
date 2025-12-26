import React, { useRef, useEffect, useState } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * OTP Input - 6-digit one-time password input
 * - Individual input boxes for each digit
 * - Auto-advance to next field on digit entry
 * - Paste support (6-digit codes split across fields)
 * - Backspace navigation (focus previous field)
 * - Cyan glow on focus
 */
export function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length - value.length).fill(''))
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setOtp(value.split('').concat(Array(length - value.length).fill('')));
  }, [value, length]);

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
      onChange(newOtp.join(''));

      // Focus last filled field
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit entry
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      onChange(newOtp.join(''));

      // Auto-advance to next field
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary-lum">Verification Code</label>

      <div className="flex justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            className={`
              h-12 w-12 rounded-lg border-2 bg-[rgba(15,23,42,0.5)]
              text-center text-xl font-semibold text-text-primary-lum
              backdrop-blur-sm transition-all
              placeholder:text-text-muted-lum
              ${
                otp[index]
                  ? 'border-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                  : 'border-border-default-lum'
              }
              focus:border-brand-cyan focus:shadow-[0_0_12px_rgba(34,211,238,0.4)] focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          />
        ))}
      </div>

      <p className="text-center text-xs text-text-muted-lum">
        Enter the 6-digit code sent to your email
      </p>
    </div>
  );
}
