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
import en_admin from './en/admin.yaml';
import en_metrics from './en/metrics.yaml';
import en_webhooks from './en/webhooks.yaml';
import en_settings from './en/settings.yaml';

import nl_common from './nl/common.yaml';
import nl_auth from './nl/auth.yaml';
import nl_tasks from './nl/tasks.yaml';
import nl_errors from './nl/errors.yaml';
import nl_admin from './nl/admin.yaml';
import nl_metrics from './nl/metrics.yaml';
import nl_webhooks from './nl/webhooks.yaml';
import nl_settings from './nl/settings.yaml';

import de_common from './de/common.yaml';
import de_auth from './de/auth.yaml';
import de_tasks from './de/tasks.yaml';
import de_errors from './de/errors.yaml';
import de_admin from './de/admin.yaml';
import de_metrics from './de/metrics.yaml';
import de_webhooks from './de/webhooks.yaml';
import de_settings from './de/settings.yaml';

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
    ns: ['common', 'auth', 'tasks', 'errors', 'admin', 'metrics', 'webhooks', 'settings'],

    // Resources (translations)
    resources: {
      en: {
        common: en_common,
        auth: en_auth,
        tasks: en_tasks,
        errors: en_errors,
        admin: en_admin,
        metrics: en_metrics,
        webhooks: en_webhooks,
        settings: en_settings,
      },
      nl: {
        common: nl_common,
        auth: nl_auth,
        tasks: nl_tasks,
        errors: nl_errors,
        admin: nl_admin,
        metrics: nl_metrics,
        webhooks: nl_webhooks,
        settings: nl_settings,
      },
      de: {
        common: de_common,
        auth: de_auth,
        tasks: de_tasks,
        errors: de_errors,
        admin: de_admin,
        metrics: de_metrics,
        webhooks: de_webhooks,
        settings: de_settings,
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

// Ensure i18n is initialized synchronously
if (!i18n.isInitialized) {
  // Force synchronous initialization if async init hasn't completed
  const lng = localStorage.getItem('i18nextLng') || 'en';
  i18n.changeLanguage(lng);
}

export default i18n;
