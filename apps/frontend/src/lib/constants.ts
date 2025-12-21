/**
 * Application-wide constants
 */

export const APP_NAME = 'CodeGraph';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Multi-agent AI coding platform';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Authentication
export const AUTH_TOKEN_KEY = 'auth-storage';
export const CSRF_TOKEN_KEY = 'csrf_token';
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Media queries
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkMode: '(prefers-color-scheme: dark)',
} as const;

// Date/Time
export const DATE_FORMAT = 'MMM d, yyyy';
export const DATETIME_FORMAT = 'MMM d, yyyy h:mm a';
export const TIME_FORMAT = 'h:mm a';
export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

// Debounce/Throttle delays
export const DEBOUNCE_DELAY = 300;
export const SEARCH_DEBOUNCE_DELAY = 500;
export const AUTOSAVE_DELAY = 1000;

// Toast/Notification defaults
export const TOAST_DURATION = 5000;
export const ERROR_TOAST_DURATION = 8000;

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

// Z-index layers
export const Z_INDEX = {
  dropdown: 50,
  modal: 100,
  toast: 150,
  tooltip: 200,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'auth-storage',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar-state',
  RECENT_SEARCHES: 'recent-searches',
  USER_PREFERENCES: 'user-preferences',
} as const;

// Route paths
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  VERIFY_EMAIL_PENDING: '/verify-email-pending',

  // Protected routes
  DASHBOARD: '/',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  AGENTS: '/agents',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // Error pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
} as const;

// External links
export const EXTERNAL_LINKS = {
  DOCUMENTATION: 'https://docs.codegraph.dev',
  GITHUB: 'https://github.com/codegraph',
  SUPPORT: 'https://support.codegraph.dev',
  PRIVACY_POLICY: '/privacy',
  TERMS_OF_SERVICE: '/terms',
} as const;

// Feature flags (can be overridden by environment variables)
export const FEATURES = {
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: import.meta.env.PROD,
  ENABLE_SSE: true,
  ENABLE_OFFLINE_MODE: false,
} as const;

// Agent configuration
export const AGENT_CONFIG = {
  MAX_RETRIES: 3,
  POLLING_INTERVAL: 2000,
  SSE_RECONNECT_DELAY: 5000,
  MAX_CONCURRENT_AGENTS: 4,
} as const;

// Task configuration
export const TASK_CONFIG = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  MAX_ATTACHMENTS: 5,
} as const;
