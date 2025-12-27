/**
 * CSRF (Cross-Site Request Forgery) token utilities.
 *
 * The CSRF token is stored in a non-HTTP-only cookie that JavaScript can read.
 * This token must be included in the X-CSRF-Token header for all state-changing requests.
 */

/**
 * Get the CSRF token from cookies.
 *
 * @returns The CSRF token or null if not found
 */
export const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Check if CSRF token exists.
 *
 * @returns True if CSRF token is present
 */
export const hasCsrfToken = (): boolean => {
  return getCsrfToken() !== null;
};
