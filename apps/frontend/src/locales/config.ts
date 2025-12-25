/**
 * i18next configuration.
 * Sets up internationalization with language detection and persistence.
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation namespaces
import en_common from './en/common.yaml';
import en_auth from './en/auth.yaml';
import en_tasks from './en/tasks.yaml';
import en_errors from './en/errors.yaml';

import nl_common from './nl/common.yaml';
import nl_auth from './nl/auth.yaml';
import nl_tasks from './nl/tasks.yaml';
import nl_errors from './nl/errors.yaml';

import de_common from './de/common.yaml';
import de_auth from './de/auth.yaml';
import de_tasks from './de/tasks.yaml';
import de_errors from './de/errors.yaml';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language from browser settings
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    // Fallback language
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[],

    // Default namespace
    defaultNS: 'common',

    // Namespaces to load
    ns: ['common', 'auth', 'tasks', 'errors'],

    // Resources (translations)
    resources: {
      en: {
        common: en_common,
        auth: en_auth,
        tasks: en_tasks,
        errors: en_errors,
      },
      nl: {
        common: nl_common,
        auth: nl_auth,
        tasks: nl_tasks,
        errors: nl_errors,
      },
      de: {
        common: de_common,
        auth: de_auth,
        tasks: de_tasks,
        errors: de_errors,
      },
    },

    // Language detection order
    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator'],
      caches: ['localStorage', 'sessionStorage'],
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React-specific settings
    react: {
      useSuspense: false, // Don't use Suspense for translations
    },
  });

export default i18n;
