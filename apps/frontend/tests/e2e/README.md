# E2E Tests for CodeGraph Frontend

End-to-end tests for the CodeGraph frontend authentication flows using [Playwright](https://playwright.dev/).

## Overview

These tests verify complete user journeys through the authentication system, including:

- **Registration Flow** - User registration, validation, and email verification
- **Login Flow** - User login and navigation to dashboard/verification page
- **Forgot Password** - Password reset request and confirmation
- **Form Validation** - Real-time validation and error handling
- **Loading States** - Visual feedback during form submission
- **Accessibility** - Keyboard navigation and screen reader compatibility

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

### Test Files
- `auth.spec.ts` - All authentication flow tests

### Test Categories

1. **Registration Flow** (3 tests)
   - Complete registration with form submission and navigation
   - Error handling for invalid data
   - Validation of all required fields

2. **Login Flow** (3 tests)
   - Complete login flow with navigation
   - Invalid credentials handling
   - Redirect URL preservation

3. **Remember Me** (1 test)
   - Remember me checkbox functionality

4. **Form Validation** (2 tests)
   - Real-time email validation
   - Error clearing on correction

5. **Loading States** (2 tests)
   - Login form loading state
   - Registration form loading state

6. **Accessibility** (2 tests)
   - Keyboard-only navigation in login
   - Keyboard-only navigation in registration

7. **Forgot Password** (2 tests)
   - Forgot password flow
   - Ability to reset another email

## Test Data

Tests use various email addresses for testing:
- `john.doe@example.com` - Registration tests
- `jane.smith@example.com` - Login tests
- `test@example.com` - Generic tests
- `nonexistent@example.com` - Error handling tests

## Configuration

Configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit
- **Dev Server**: Automatically started before tests
- **Timeout**: 30 seconds per test

## Best Practices

### Writing Tests

1. **Use semantic selectors**
   ```typescript
   // Good - uses accessible labels
   await page.fill('input[type="email"]', 'user@example.com');

   // Avoid - uses implementation details
   await page.fill('input.email-field', 'user@example.com');
   ```

2. **Create reusable helpers**
   ```typescript
   async function fillAndSubmitLoginForm(page, email, password) {
     // Helper logic
   }
   ```

3. **Use explicit waits**
   ```typescript
   // Good
   await expect(page.locator('text=Check Your Email')).toBeVisible();

   // Avoid
   await page.waitForTimeout(1000);
   ```

4. **Test user behavior, not implementation**
   ```typescript
   // Good - tests what user sees
   await expect(page).toHaveURL('/verify-email-pending');

   // Avoid - tests internal state
   await expect(store.isAuthenticated).toBe(true);
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
