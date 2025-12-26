/**
 * Test setup file for Vitest.
 * Extends Vitest's expect with jest-dom matchers and configures mocks.
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * Polyfill ResizeObserver for jsdom environment.
 * Radix UI components depend on ResizeObserver which is not available in jsdom.
 */
global.ResizeObserver = class ResizeObserver {
  observe() {
    // noop
  }

  unobserve() {
    // noop
  }

  disconnect() {
    // noop
  }
};

/**
 * Mock TanStack Router module globally for all tests.
 * This prevents "ReferenceError: Cannot use 'in' operator to search for X in undefined" errors
 * when components try to use router hooks without proper context.
 */
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useSearch: vi.fn(() => ({})),
  useLocation: vi.fn(() => ({
    pathname: '/',
    search: {},
    hash: '',
    state: {},
    key: 'test',
  })),
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
    current: { pathname: '/' },
  })),
  useParams: vi.fn(() => ({})),
}));
