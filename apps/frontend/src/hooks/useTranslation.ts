/**
 * Custom useTranslation hook.
 * Wrapper around i18next's useTranslation for consistent usage across the app.
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Hook for accessing translations in components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <h1>{t('common:nav.dashboard')}</h1>;
 * }
 * ```
 */
export function useTranslation(namespace?: string | string[]) {
  return useI18nTranslation(namespace);
}

/**
 * Hook for accessing a specific namespace's translations.
 *
 * @example
 * ```tsx
 * function AuthForm() {
 *   const { t } = useTranslationNamespace('auth');
 *   return <button>{t('login.submit')}</button>;
 * }
 * ```
 */
export function useTranslationNamespace(namespace: string) {
  return useI18nTranslation(namespace);
}
