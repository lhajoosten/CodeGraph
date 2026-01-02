import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        // Primary with glow
        default: [
          'border-transparent bg-brand-cyan text-white',
          'shadow-[0_0_8px_rgba(34,211,238,0.3)]',
        ],
        // Secondary with glass effect
        secondary: [
          'bg-surface-secondary/80 text-text-secondary border-border-primary/30',
          'backdrop-blur-sm',
        ],
        // Success with glow
        success: [
          'border-transparent bg-success text-white',
          'shadow-[0_0_8px_rgba(34,197,94,0.3)]',
        ],
        // Danger with glow
        danger: [
          'border-transparent bg-danger text-white',
          'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
        ],
        // Warning with subtle glow
        warning: [
          'border-transparent bg-warning text-white',
          'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        ],
        // Info/Teal with glow
        info: [
          'border-transparent bg-brand-teal text-white',
          'shadow-[0_0_8px_rgba(20,184,166,0.3)]',
        ],
        // Outline with hover effect
        outline: [
          'border-border-primary/50 text-text-primary bg-transparent',
          'hover:border-brand-cyan/50 hover:text-brand-cyan',
        ],
        // Ghost with subtle background on hover
        ghost: [
          'text-text-secondary border-transparent bg-transparent',
          'hover:bg-surface-secondary/50 hover:text-text-primary',
        ],
        // Premium gradient variant
        gradient: [
          'border-transparent bg-linear-to-r from-brand-teal to-brand-cyan text-white',
          'shadow-[0_0_12px_rgba(34,211,238,0.4)]',
        ],
        // Alive/pulsing variant for status indicators
        alive: [
          'border-transparent bg-success/90 text-white',
          'shadow-[0_0_8px_rgba(34,197,94,0.4)]',
          'animate-pulse',
        ],
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
