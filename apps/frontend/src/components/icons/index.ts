/**
 * Icon System
 * Centralized icon exports for the CodeGraph application
 *
 * Organized into three categories:
 * 1. Base Icon component - reusable wrapper for size/color variants
 * 2. Standard Icons - Heroicons re-exports with project naming conventions
 * 3. Custom Icons - Pre-styled icon variants (Success, Error, Warning, Info, Loading)
 * 4. Brand Icons - Social/service provider brand logos (@iconify)
 */

// Base icon component and types
export { Icon, type IconProps } from './icon';

// Icon variants for styling
export { iconVariants, type IconVariants } from './variants/icon-variants';

// Standard Heroicons re-exports
export {
  // Navigation
  LayoutDashboardIcon,
  CheckSquareIcon,
  SettingsIcon,
  // Actions
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  CheckIcon,
  // Status & Feedback
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SpinnerIcon,
  // Search & Input
  SearchIcon,
  ClearIcon,
  // Navigation Chevrons
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  // User & Account
  UserIcon,
  MailIcon,
  LockIcon,
  NotificationIcon,
  // Solid variants
  CheckCircleSolidIcon,
  XCircleSolidIcon,
  ExclamationCircleSolidIcon,
  InformationCircleSolidIcon,
} from './standard';

// Custom variant icons
export { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, LoadingIcon } from './variants';

// Brand icons
export { GithubIcon, GoogleIcon, MicrosoftIcon, AppleIcon } from './brand';
