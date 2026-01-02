import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useAnimatedCounter, useAnimatedPercentage, useAnimatedCurrency } from '@/hooks/common';

interface AnimatedCounterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The target value to animate to */
  value: number;
  /** Duration of the animation in milliseconds (default: 800) */
  duration?: number;
  /** Easing function (default: 'easeOutExpo') */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'easeOutExpo' | 'spring';
  /** Delay before animation starts in milliseconds (default: 0) */
  delay?: number;
  /** Format function for the displayed value */
  formatValue?: (value: number) => string;
  /** Decimal places to show (default: 0) */
  decimals?: number;
  /** Whether to show pop animation on value change */
  showPopAnimation?: boolean;
  /** Prefix to display before the value */
  prefix?: string;
  /** Suffix to display after the value */
  suffix?: string;
  /** Whether animation should start (for staggering) */
  startAnimation?: boolean;
}

/**
 * AnimatedCounter - Displays a number that animates from 0 to the target value.
 *
 * @example
 * ```tsx
 * <AnimatedCounter value={1234} duration={1000} suffix=" tasks" />
 * ```
 */
export const AnimatedCounter = forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  (
    {
      value,
      duration = 800,
      easing = 'easeOutExpo',
      delay = 0,
      formatValue,
      decimals = 0,
      showPopAnimation = true,
      prefix,
      suffix,
      startAnimation = true,
      className,
      ...props
    },
    ref
  ) => {
    const { displayValue, isAnimating } = useAnimatedCounter(value, {
      duration,
      easing,
      delay,
      formatValue,
      decimals,
      startAnimation,
    });

    return (
      <span
        ref={ref}
        className={cn(
          'tabular-nums',
          showPopAnimation && isAnimating && 'animate-counter-pop',
          className
        )}
        {...props}
      >
        {prefix}
        {displayValue}
        {suffix}
      </span>
    );
  }
);

AnimatedCounter.displayName = 'AnimatedCounter';

/**
 * AnimatedPercentage - Displays a percentage that animates from 0 to the target value.
 */
interface AnimatedPercentageProps extends Omit<AnimatedCounterProps, 'formatValue' | 'decimals'> {
  /** Show % symbol (default: true) */
  showSymbol?: boolean;
}

export const AnimatedPercentage = forwardRef<HTMLSpanElement, AnimatedPercentageProps>(
  ({ value, showSymbol = true, suffix, ...props }, ref) => {
    const { displayValue, isAnimating } = useAnimatedPercentage(value, {
      duration: props.duration,
      easing: props.easing,
      delay: props.delay,
      startAnimation: props.startAnimation,
    });

    return (
      <span
        ref={ref}
        className={cn(
          'tabular-nums',
          props.showPopAnimation !== false && isAnimating && 'animate-counter-pop',
          props.className
        )}
        {...props}
      >
        {props.prefix}
        {displayValue}
        {showSymbol ? '%' : ''}
        {suffix}
      </span>
    );
  }
);

AnimatedPercentage.displayName = 'AnimatedPercentage';

/**
 * AnimatedCurrency - Displays a currency value that animates from 0 to the target value.
 */
interface AnimatedCurrencyProps extends Omit<AnimatedCounterProps, 'formatValue' | 'prefix'> {
  /** Currency code (default: 'USD') */
  currency?: string;
}

export const AnimatedCurrency = forwardRef<HTMLSpanElement, AnimatedCurrencyProps>(
  ({ value, currency = 'USD', decimals = 2, ...props }, ref) => {
    const { displayValue, isAnimating } = useAnimatedCurrency(value, currency, {
      duration: props.duration,
      easing: props.easing,
      delay: props.delay,
      decimals,
      startAnimation: props.startAnimation,
    });

    return (
      <span
        ref={ref}
        className={cn(
          'tabular-nums',
          props.showPopAnimation !== false && isAnimating && 'animate-counter-pop',
          props.className
        )}
        {...props}
      >
        {displayValue}
        {props.suffix}
      </span>
    );
  }
);

AnimatedCurrency.displayName = 'AnimatedCurrency';

export default AnimatedCounter;
