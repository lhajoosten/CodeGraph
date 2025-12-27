# E2E Authentication Tests

Comprehensive end-to-end tests for the CodeGraph authentication system using [Playwright](https://playwright.dev/).

## Overview

These tests verify complete user journeys through the authentication system covering:

- **Login Flow** - Email/password login, validation, 2FA redirect
- **Registration Flow** - User registration, validation, email verification
- **Password Reset Flow** - Forgot password, reset with token
- **Two-Factor Authentication** - 2FA setup, verification, backup codes
- **OAuth Flow** - Google, GitHub, Microsoft authentication
- **Protected Routes** - Access control and session management

## Test Architecture

```
tests/e2e/
|-- fixtures/           # Test data and API response stubs
|   |-- users.ts       # User test data constants
|   |-- api-stubs.ts   # API response templates
|   |-- index.ts       # Central exports
|
|-- helpers/           # Reusable test utilities
|   |-- mock-api.ts    # API mocking utilities
|   |-- test-utils.ts  # Common test helpers
|   |-- index.ts       # Central exports
|
|-- pages/             # Page Object Models
|   |-- base.page.ts   # Base page with common methods
|   |-- login.page.ts  # Login page object
|   |-- register.page.ts
|   |-- forgot-password.page.ts
|   |-- reset-password.page.ts
|   |-- two-factor.page.ts
|   |-- index.ts       # Central exports
|
|-- specs/             # Test specifications
|   |-- auth-login.spec.ts
|   |-- auth-registration.spec.ts
|   |-- auth-password-reset.spec.ts
|   |-- auth-2fa.spec.ts
|   |-- auth-oauth.spec.ts
|
|-- README.md          # This file
```

## Quick Start

### Prerequisites

```bash
# Install Playwright browsers
npx playwright install chromium

# Install system dependencies (Ubuntu/Debian)
sudo npx playwright install-deps chromium
```

### Running Tests

```bash
# Run all E2E tests
npm run e2e

# Run in headed mode (see browser)
npm run e2e:headed

# Run in debug mode (step through tests)
npm run e2e:debug

# Run with UI mode (interactive)
npm run e2e:ui

# Run specific test file
npx playwright test auth-login.spec.ts

# Run tests matching pattern
npx playwright test --grep "Login"
```

## Test Design Philosophy

### 1. User-Centric Testing

Tests focus on real user behavior, not implementation details:

```typescript
// Good: Tests what users see
await page.getByRole('button', { name: /sign in/i }).click();
await expect(page).toHaveURL('/dashboard');

// Avoid: Tests implementation details
await page.locator('.btn-primary').click();
await expect(localStorage.getItem('token')).not.toBeNull();
```

### 2. Page Object Model

Each page has a dedicated class encapsulating all interactions:

```typescript
// pages/login.page.ts
export class LoginPage extends BasePage {
  get emailInput() { return this.page.getByLabel(/email/i); }
  get submitButton() { return this.page.getByRole('button', { name: /sign in/i }); }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// In tests
const loginPage = new LoginPage(page);
await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
```

### 3. API Mocking Strategy

Tests mock API responses for deterministic, fast execution:

```typescript
// Mock successful login
await mockLoginSuccess(page, EXISTING_USER);

// Mock error scenarios
await mockLoginInvalidCredentials(page);

// Mock rate limiting
await mockRateLimited(page, '/api/v1/auth/login');
```

### 4. Deterministic Test Data

All test data is predefined in fixtures:

```typescript
// fixtures/users.ts
export const EXISTING_USER = {
  email: 'existing.user@codegraph.dev',
  password: 'ExistingPass123!',
  firstName: 'Existing',
  lastName: 'User',
};

export const TEST_2FA_CODES = {
  valid: '000000',
  invalid: '999999',
};
```

## Writing Tests

### Test Structure

Tests follow the AAA pattern (Arrange, Act, Assert):

```typescript
test('should login successfully with valid credentials', async ({ page }) => {
  // ARRANGE - Set up test state
  const loginPage = new LoginPage(page);
  await setupLoginFlowMocks(page, EXISTING_USER);

  // ACT - Perform the action
  await loginPage.navigate();
  await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);

  // ASSERT - Verify the outcome
  await loginPage.expectRedirectToDashboard();
});
```

### Using Page Objects

```typescript
import { LoginPage } from '../pages/login.page';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should display form', async () => {
    await loginPage.expectFormDisplayed();
  });
});
```

### Mocking API Responses

```typescript
import { mockLoginSuccess, mockLoginInvalidCredentials } from '../helpers';

// Success scenario
await mockLoginSuccess(page, EXISTING_USER);
await loginPage.login(email, password);
await loginPage.expectRedirectToDashboard();

// Error scenario
await mockLoginInvalidCredentials(page);
await loginPage.login(email, wrongPassword);
await loginPage.expectErrorMessage(/invalid/i);
```

### Composite Flow Mocks

For complex flows requiring multiple endpoints:

```typescript
// Sets up all mocks for complete login flow
await setupLoginFlowMocks(page, user);

// Sets up all mocks for 2FA login
await setup2FALoginFlowMocks(page, user);

// Sets up all mocks for password reset
await setupPasswordResetFlowMocks(page);
```

## Authentication State Management

The application uses Zustand with localStorage persistence for authentication state. To properly test protected routes and 2FA flows, you need to set up the correct authentication state in `localStorage['auth-store']`.

### Available State Helpers

These helpers in `test-utils.ts` set up the authentication state and navigate to the page:

```typescript
// Set user authenticated with no 2FA
await setAuthenticatedState(page, user);

// Set user that requires 2FA setup
await setRequires2FASetupState(page, user);

// Set user that requires 2FA verification
await setRequires2FAVerificationState(page, user);

// Set fully authenticated user (with 2FA verified)
await setFullyAuthenticatedState(page, user);

// Clear all authentication state
await clearAuthenticatedState(page);
```

### Auth State Structure

The app expects this state in `localStorage['auth-store']`:

```typescript
{
  state: {
    isAuthenticated: boolean;           // Is user logged in?
    emailVerified: boolean;             // Is email verified?
    user: {                             // User data
      id: string;
      email: string;
      email_verified: boolean;
      first_name?: string;
      last_name?: string;
      // ... other user fields
    } | null;
    oauthProvider: string | null;       // 'google', 'github', 'microsoft'
    twoFactorEnabled: boolean;          // Has user enabled 2FA?
    twoFactorVerified: boolean;         // Is 2FA verified this session?
    requiresTwoFactorSetup: boolean;    // Must user set up 2FA?
  },
  version: 0
}
```

### Example: Testing 2FA Setup Flow

```typescript
test('should display 2FA setup page for users requiring setup', async ({ page }) => {
  // Navigate to /setup-2fa and set auth state for 2FA setup
  await setRequires2FASetupState(page, EXISTING_USER);
  await mock2FASetupSuccess(page);

  // Now user is on /setup-2fa with proper auth state
  await setupPage.expectQRCodeDisplayed();
});
```

### Example: Testing Protected Routes

```typescript
test('should redirect unauthenticated users to login', async ({ page }) => {
  // Don't set auth state - user is unauthenticated
  await page.goto('/dashboard');

  // Should redirect to login page
  await expect(page).toHaveURL(/\/login(\?.*)?$/);
});
```

### Important Notes

1. **Navigate first**: Auth state helpers handle navigation internally, so don't call `.navigate()` separately
2. **Clear state between tests**: Use independent tests that don't rely on state from previous tests
3. **Mock API responses**: Always mock the endpoints your route will call
4. **Query parameters**: URLs may include `?redirect=` parameters - use flexible assertions

## Test Data

### User Fixtures

| Fixture | Description |
|---------|-------------|
| `VALID_USER` | Standard valid user for registration |
| `EXISTING_USER` | Already registered user for login |
| `USER_WITH_2FA` | User with 2FA enabled |
| `USER_UNVERIFIED_EMAIL` | User with unverified email |
| `OAUTH_USER_GOOGLE` | Google OAuth user |
| `OAUTH_USER_GITHUB` | GitHub OAuth user |
| `OAUTH_USER_MICROSOFT` | Microsoft OAuth user |

### Validation Test Data

| Fixture | Description |
|---------|-------------|
| `WEAK_PASSWORDS` | Various weak passwords for validation testing |
| `INVALID_EMAILS` | Various invalid email formats |
| `TEST_2FA_CODES` | Valid/invalid 2FA codes |
| `TEST_RESET_TOKENS` | Valid/expired reset tokens |
| `TEST_OAUTH_STATE` | OAuth state tokens |

## Best Practices

### Do's

- Use semantic selectors (role, label, text)
- Wait for specific conditions, not arbitrary timeouts
- Test one thing per test
- Use fixtures for test data
- Mock all API calls
- Keep tests independent

### Don'ts

- Don't use CSS class selectors
- Don't use `page.waitForTimeout()`
- Don't share state between tests
- Don't make real API calls
- Don't test implementation details

### Selector Priority

1. `getByRole()` - Most accessible, most stable
2. `getByLabel()` - For form inputs
3. `getByText()` - For visible text
4. `getByTestId()` - When semantics don't apply (last resort)

## Debugging

### Debug Mode

```bash
npm run e2e:debug
```

Launches Playwright Inspector for stepping through tests.

### UI Mode

```bash
npm run e2e:ui
```

Interactive test runner with timeline view.

### Traces

Traces are automatically collected on test failure. View with:

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots

Failed tests automatically capture screenshots in `test-results/`.

## CI/CD Integration

Tests run automatically in CI. Key configurations:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npm run e2e
  env:
    CI: true

- name: Upload test report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Browser**: Chromium (Firefox/WebKit available)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure only
- **Traces**: On first retry

## Troubleshooting

### Port 5173 in use

```bash
lsof -ti :5173 | xargs kill -9
```

### Browser launch errors (WSL)

```bash
sudo apt-get install -y libasound2 libxdamage1 libxcomposite1
```

### Flaky tests

1. Check for race conditions
2. Use proper wait conditions
3. Ensure test independence
4. Increase specific timeouts if needed

### Tests timeout

1. Ensure dev server is running
2. Check network connectivity
3. Increase timeout in config if needed

## Contributing

When adding new tests:

1. Place in appropriate spec file or create new one
2. Use existing page objects or create new ones
3. Add test data to fixtures if needed
4. Add mock utilities for new API endpoints
5. Follow naming conventions
6. Document test purpose

### Naming Conventions

- **Spec files**: `auth-<feature>.spec.ts`
- **Page objects**: `<feature>.page.ts`
- **Test names**: Start with "should"
- **Describe blocks**: Use feature/scenario names

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
