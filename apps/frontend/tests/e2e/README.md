# E2E Authentication Tests

Comprehensive end-to-end tests for the CodeGraph authentication system using [Playwright](https://playwright.dev/).

## Overview

These tests verify complete user journeys through the authentication system with **141 total tests** covering:

- **Registration Flow** (32 tests) - User registration, validation, email verification pending
- **Login Flow** (18 tests) - Login, invalid credentials, remember me, session persistence
- **2FA Flow** (21 tests) - Setup, verification, QR codes, backup codes, OTP input
- **Email Verification** (20 tests) - Token validation, resend, rate limiting
- **OAuth Flow** (25 tests) - Google, GitHub, Microsoft authentication
- **Password Reset** (25 tests) - Request, reset, validation, security

## Installation

Playwright is already installed. To install browser binaries:

```bash
npx playwright install
```

### System Dependencies

Playwright requires system libraries to run browsers. Depending on your environment:

**Ubuntu/Debian:**
```bash
sudo npx playwright install-deps
```

**WSL2 (Windows Subsystem for Linux):**
WSL2 lacks some system libraries by default. Options:
1. Use Docker (recommended) - See Docker Setup below
2. Install minimal dependencies:
   ```bash
   sudo apt-get install -y libasound2 libxdamage1 libxcomposite1
   ```
3. Use native Windows/Mac for E2E testing

**macOS:**
No additional setup needed - Playwright handles dependencies automatically.

### Docker Setup

If system dependencies are problematic, run E2E tests in Docker:

```bash
# Build Docker image
docker build -t codegraph-e2e .

# Run tests in Docker
docker run --rm -v $(pwd):/app codegraph-e2e npm run e2e
```

## Running Tests

### Basic Commands

```bash
# Run all E2E tests in headless mode
npm run e2e

# Run with browser visible (headed mode)
npm run e2e:headed

# Run in debug mode (interactive)
npm run e2e:debug

# Run with UI mode (recommended for development)
npm run e2e:ui
```

### Running Specific Tests

```bash
# Run only registration tests
npx playwright test --grep "Registration Flow"

# Run a single test file
npx playwright test auth.spec.ts

# Run tests on a specific browser
npx playwright test --project=chromium

# Run with verbose output
npx playwright test --verbose
```

## Test Structure

```
tests/e2e/
├── fixtures/           # Test data and mock responses
│   ├── users.ts       # User test data constants
│   ├── oauth-mocks.ts # OAuth provider mock responses
│   ├── api-stubs.ts   # API response templates
│   └── index.ts       # Central exports
├── helpers/           # Reusable test utilities
│   ├── auth-helpers.ts    # Authentication flow helpers
│   ├── page-helpers.ts    # Page interaction helpers
│   ├── assertions.ts      # Common assertion functions
│   ├── mock-utils.ts      # API mocking utilities
│   └── index.ts           # Central exports
└── specs/            # Test specifications
    ├── auth-registration.spec.ts       # Registration flow tests (32 tests)
    ├── auth-login.spec.ts              # Login flow tests (18 tests)
    ├── auth-2fa.spec.ts                # 2FA flow tests (21 tests)
    ├── auth-email-verification.spec.ts # Email verification tests (20 tests)
    ├── auth-oauth.spec.ts              # OAuth flow tests (25 tests)
    └── auth-password-reset.spec.ts     # Password reset tests (25 tests)
```

### Test Categories

#### Registration Flow (32 tests)
- Display registration form
- Successful registration
- Email/password validation (empty, invalid format, weak password)
- Password confirmation matching
- Terms acceptance requirement
- Email already exists error
- Special characters in names
- Password strength indicator
- Password visibility toggle
- Submit button states
- Email verification pending page
- Resend verification email
- Rate limiting

#### Login Flow (18 tests)
- Display login form
- Successful login
- Invalid credentials error
- Unverified email error
- 2FA redirect
- Email/password validation
- Remember me functionality
- Password visibility toggle
- Submit button states
- Protected route access
- Redirect after login
- Session persistence across reloads/tabs
- OAuth button display

#### 2FA Flow (21 tests)
- Display 2FA setup introduction
- Skip 2FA option
- QR code display
- Successful verification and enablement
- Invalid verification code errors
- Backup codes display and copying
- 2FA verification during login
- Valid/invalid login codes
- Auto-submit on complete input
- OTP input behavior (focus, advance, backspace, paste)
- Backup code login option
- 2FA management in settings

#### Email Verification (20 tests)
- Successful verification with valid token
- Invalid token error
- Expired token error
- Already verified message
- Resend verification option
- Redirect to 2FA setup after verification
- Skip to dashboard option
- Email verification pending display
- Resend with rate limiting
- Email change verification
- Network/server error handling
- Missing token parameter
- Accessibility (ARIA labels, keyboard navigation)

#### OAuth Flow (25 tests)
- Display all OAuth provider buttons
- Google OAuth (login, register, error, cancellation)
- GitHub OAuth (login, register, error)
- Microsoft OAuth (login, register, error)
- Profile completion for new OAuth users
- State parameter validation
- Missing code parameter
- Already authenticated handling
- Network/server error handling
- Provider-specific errors
- OAuth from registration page

#### Password Reset (25 tests)
- Display forgot password form
- Successful reset request
- Email validation
- Non-existent email handling (security)
- Rate limiting
- Submit button states
- Sent confirmation screen
- Resend reset email
- Display reset form with token
- Successful password reset
- Password validation (empty, weak, mismatch)
- Invalid/expired/used token errors
- Password strength indicator
- Password visibility toggle
- Missing token parameter
- Post-reset login with new password
- Old password invalidation
- Network/server error handling

## Test Data

All test data is in `fixtures/users.ts`:

```typescript
// Primary test users
VALID_USER                  // Standard valid user
EXISTING_USER              // User already in system
USER_WITH_2FA              // User with 2FA enabled
USER_UNVERIFIED_EMAIL      // User with unverified email
OAUTH_USER_GOOGLE          // Google OAuth user
OAUTH_USER_GITHUB          // GitHub OAuth user
OAUTH_USER_MICROSOFT       // Microsoft OAuth user

// Edge cases
USER_WITH_SPECIAL_CHARS    // Special characters in name
USER_WITH_MAX_LENGTH       // Maximum length fields

// Test codes
TEST_2FA_CODES.valid       // "000000"
TEST_2FA_CODES.invalid     // "999999"
TEST_VERIFICATION_TOKENS   // Email verification tokens
TEST_RESET_TOKENS          // Password reset tokens

// Invalid data
WEAK_PASSWORDS             // Various weak passwords
INVALID_EMAILS             // Various invalid email formats
```

## Configuration

Configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit
- **Dev Server**: Automatically started before tests
- **Timeout**: 30 seconds per test

## Usage Patterns

### Using Fixtures

```typescript
import { VALID_USER, EXISTING_USER, TEST_2FA_CODES } from '../fixtures/users';
import { GOOGLE_OAUTH } from '../fixtures/oauth-mocks';
import { LOGIN_STUBS } from '../fixtures/api-stubs';

// Use in tests
await page.getByLabel(/email/i).fill(VALID_USER.email);
await fill2FACode(page, TEST_2FA_CODES.valid);
```

### Using Helpers

```typescript
import {
  registerUser,
  loginWithCredentials,
  setup2FA,
  verifyEmail,
} from '../helpers/auth-helpers';

// Encapsulate entire flows
await registerUser(page, VALID_USER);
await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);
await setup2FA(page);
await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);
```

### Using Assertions

```typescript
import {
  assertRedirectToDashboard,
  assertSuccessToast,
  assertFieldHasError,
  assert2FAQRCodeDisplayed,
} from '../helpers/assertions';

// Common assertions
await assertRedirectToDashboard(page);
await assertSuccessToast(page, /login successful/i);
await assertFieldHasError(page, /email/i, /required/i);
await assert2FAQRCodeDisplayed(page);
```

### Using Mocks

```typescript
import {
  mockLoginSuccess,
  mockRegisterEmailTaken,
  setup2FAFlowMocks,
  setupOAuthFlowMocks,
} from '../helpers/mock-utils';

// Mock API responses
await mockLoginSuccess(page, EXISTING_USER);
await mockRegisterEmailTaken(page);
await setup2FAFlowMocks(page, user);
await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);
```

## Best Practices

### Do's
- ✅ Use deterministic test data from fixtures
- ✅ Test user behavior, not implementation details
- ✅ Use semantic locators (role, label, text)
- ✅ Handle async properly with `await`
- ✅ Mock external dependencies (API calls)
- ✅ Test error states and edge cases
- ✅ Keep tests independent
- ✅ Use helper functions to avoid duplication
- ✅ Write descriptive test names with "should"

### Don'ts
- ❌ Don't use random data
- ❌ Don't test implementation details
- ❌ Don't use brittle selectors (class names, IDs)
- ❌ Don't create test interdependencies
- ❌ Don't skip error testing
- ❌ Don't make real API calls
- ❌ Don't use hard timeouts (`waitForTimeout`)

### Writing New Tests

1. **Choose appropriate fixture data**
   ```typescript
   import { VALID_USER } from '../fixtures/users';
   ```

2. **Use helper functions**
   ```typescript
   await loginWithCredentials(page, email, password);
   ```

3. **Mock API responses**
   ```typescript
   await mockLoginSuccess(page, EXISTING_USER);
   ```

4. **Write descriptive test names**
   ```typescript
   test('should show error for invalid credentials', async ({ page }) => {
     // Test implementation
   });
   ```

5. **Test error paths**
   ```typescript
   await mockLoginInvalidCredentials(page);
   await assertErrorToast(page, /invalid email or password/i);
   ```

## Debugging

### Debug Mode
```bash
npm run e2e:debug
```
- Launches inspector to step through tests
- Can pause, resume, and inspect state

### UI Mode
```bash
npm run e2e:ui
```
- Visual test runner
- See test execution in real-time
- Timeline view of actions

### Logs and Traces
```bash
# Run with trace collection
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI/CD Integration

For GitHub Actions, add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Common Issues

### Browser launch errors (WSL2)
**Error**: `error while loading shared libraries: libasound.so.2`

**Solutions**:
1. **Docker**: Easiest - run tests in Docker container
   ```bash
   docker run --rm --workdir /app -v $(pwd):/app node:18 npm run e2e
   ```

2. **Install minimal deps**:
   ```bash
   sudo apt-get install -y libasound2
   ```

3. **Use headless=false** (for development/debugging):
   ```bash
   npx playwright test --headed
   ```

4. **Check available disk space** - Playwright needs ~500MB for browser binaries

### Tests timeout
- Ensure dev server is running on `http://localhost:5173`
- Check browser is not blocked by firewall
- Increase timeout in `playwright.config.ts` if needed

### Tests fail in CI
- Tests may fail if backend API is not available
- Use test doubles/mocks for API responses if needed
- Ensure consistent test data
- For GitHub Actions, ensure workflow runs `npm run dev` or similar

### Flaky tests
- Avoid hard timeouts (`waitForTimeout`)
- Use proper wait conditions (`waitFor`, `expect`)
- Make tests independent and idempotent

### Port 5173 already in use
**Error**: `EADDRINUSE: address already in use :::5173`

**Solution**:
```bash
# Find process using port 5173
lsof -ti :5173 | xargs kill -9
# Or configure Playwright to use different port
# Edit playwright.config.ts and change baseURL
```

## Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## Contributing

When adding new E2E tests:

1. Place tests in `tests/e2e/`
2. Follow naming convention: `*.spec.ts`
3. Group related tests in `describe()` blocks
4. Use semantic selectors and accessibility queries
5. Create helper functions for common actions
6. Document test purpose and expected behavior

## Troubleshooting

### Port 5173 already in use
```bash
# Kill process on port 5173
lsof -ti :5173 | xargs kill -9
```

### Browser cache issues
```bash
# Clear Playwright cache
rm -rf ~/.cache/ms-playwright/
npx playwright install
```

### Tests not finding elements
1. Check CSS selectors with browser inspector
2. Ensure page fully loaded before interactions
3. Use `waitForNavigation()` after page changes
