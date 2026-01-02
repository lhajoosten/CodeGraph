import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './use-media-query';

interface UseAnimatedCounterOptions {
  /** Duration of the animation in milliseconds (default: 800) */
  duration?: number;
  /** Easing function name (default: 'easeOutExpo') */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'easeOutExpo' | 'spring';
  /** Delay before animation starts in milliseconds (default: 0) */
  delay?: number;
  /** Whether to animate on mount (default: true) */
  animateOnMount?: boolean;
  /** Format function for the displayed value */
  formatValue?: (value: number) => string;
  /** Decimal places to show (default: 0) */
  decimals?: number;
  /** Whether the animation has started (for staggering) */
  startAnimation?: boolean;
}

interface UseAnimatedCounterReturn {
  /** Current animated value */
  value: number;
  /** Formatted display value */
  displayValue: string;
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Manually trigger animation to a new target */
  animateTo: (newTarget: number) => void;
  /** Reset to initial value without animation */
  reset: () => void;
}

// Easing functions for smooth animations
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Hook for animating number values with smooth easing.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * const { displayValue, isAnimating } = useAnimatedCounter(1234, {
 *   duration: 1000,
 *   easing: 'easeOutExpo',
 *   formatValue: (v) => `$${v.toLocaleString()}`,
 * });
 *
 * return <span className={isAnimating ? 'animate-counter-pop' : ''}>{displayValue}</span>;
 * ```
 */
export function useAnimatedCounter(
  target: number,
  options: UseAnimatedCounterOptions = {}
): UseAnimatedCounterReturn {
  const {
    duration = 800,
    easing = 'easeOutExpo',
    delay = 0,
    animateOnMount = true,
    formatValue,
    decimals = 0,
    startAnimation = true,
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentValue, setCurrentValue] = useState(animateOnMount ? 0 : target);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const targetRef = useRef(target);

  const easingFn = easingFunctions[easing];

  // Animate to new value
  const animateTo = (newTarget: number) => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // If reduced motion is preferred, jump directly to target
    if (prefersReducedMotion) {
      setCurrentValue(newTarget);
      targetRef.current = newTarget;
      return;
    }

    startValueRef.current = currentValue;
    targetRef.current = newTarget;
    startTimeRef.current = null;
    setIsAnimating(true);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);

      const newValue =
        startValueRef.current + (targetRef.current - startValueRef.current) * easedProgress;
      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetRef.current);
        setIsAnimating(false);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Reset to 0 without animation
  const reset = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCurrentValue(0);
    setIsAnimating(false);
    startValueRef.current = 0;
    targetRef.current = 0;
  };

  // Animate on target change
  useEffect(() => {
    if (!startAnimation) return;

    const timeoutId = setTimeout(() => {
      animateTo(target);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, startAnimation, delay, prefersReducedMotion]);

  // Format the display value
  const displayValue = formatValue
    ? formatValue(Math.round(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals))
    : decimals > 0
      ? currentValue.toFixed(decimals)
      : Math.round(currentValue).toString();

  return {
    value: currentValue,
    displayValue,
    isAnimating,
    animateTo,
    reset,
  };
}

/**
 * Hook for animating percentage values (0-100).
 */
export function useAnimatedPercentage(
  percentage: number,
  options: Omit<UseAnimatedCounterOptions, 'decimals' | 'formatValue'> = {}
): UseAnimatedCounterReturn {
  return useAnimatedCounter(percentage, {
    ...options,
    decimals: 0,
    formatValue: (v) => `${Math.round(v)}%`,
  });
}

/**
 * Hook for animating currency values.
 */
export function useAnimatedCurrency(
  amount: number,
  currency: string = 'USD',
  options: Omit<UseAnimatedCounterOptions, 'formatValue'> = {}
): UseAnimatedCounterReturn {
  return useAnimatedCounter(amount, {
    ...options,
    formatValue: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: options.decimals ?? 2,
        maximumFractionDigits: options.decimals ?? 2,
      }).format(v),
  });
}

export default useAnimatedCounter;
