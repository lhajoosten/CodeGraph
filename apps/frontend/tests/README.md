# Frontend Tests

Centralized test directory for the CodeGraph frontend. Tests are organized by type and feature.

## Directory Structure

```
tests/
├── unit/                          # Unit and component tests
│   ├── components/                # React component tests
│   │   └── auth/                  # Authentication components
│   ├── hooks/                     # Custom React hooks
│   │   └── api/auth/              # Auth API hooks
│   ├── stores/                    # Zustand store tests
│   ├── fixtures/                  # Mock data and factories
│   ├── utils/                     # Test utilities
│   └── TESTING_STRATEGY.md        # Testing guidelines
│
├── integration/                   # Integration tests
│   └── auth-flow.test.tsx         # Auth flow integration tests
│
└── e2e/                           # End-to-end tests (Playwright)
    ├── auth.spec.ts               # Authentication E2E tests
    └── README.md                  # E2E testing guide
```

## Running Tests

### Full Test Suite (All Tests)
```bash
# Run unit + integration + E2E tests
npm run test:all
```

### Unit and Integration Tests Only
```bash
# Run all unit and integration tests
npm run test

# Run in watch mode
npm run test -- --watch

# Run with UI
npm run test -- --ui

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test -- tests/unit/components/auth/login-form.test.tsx
```

### E2E Tests Only
```bash
# Run all E2E tests (requires npm run dev running)
npm run e2e

# Run in headed mode (visible browser)
npm run e2e:headed

# Run in debug mode
npm run e2e:debug

# Run with UI
npm run e2e:ui
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **Components**: React component rendering, user interactions, state changes
- **Hooks**: Custom React hooks, data fetching, state management
- **Stores**: Zustand store state management and persistence
- **Fixtures & Utils**: Mock data, factory functions, test utilities

### Integration Tests (`tests/integration/`)
- Multi-component flows
- Store integration with components
- Complex user journeys

### E2E Tests (`tests/e2e/`)
- Complete authentication flows in real browser
- User navigation and page transitions
- Form submission and error handling
- Accessibility and keyboard navigation

## Test Data

Mock data and factories are in `tests/unit/fixtures/`:
- `auth-fixtures.ts` - Mock user data and auth objects
- `factories.ts` - Factory functions for creating test objects

## Test Utilities

Reusable test helpers in `tests/unit/utils/`:
- `test-utils.tsx` - Custom rendering functions, query client setup
- Zustand store testing helpers
- TanStack Router mocking utilities

## Coverage

Target coverage for frontend code:
- **Components**: 80%+
- **Hooks**: 90%+
- **Stores**: 95%+

Run coverage report:
```bash
npm run test -- --coverage
```

## Best Practices

1. **Use semantic queries**: Prefer `getByRole`, `getByText` over `getByTestId`
2. **Test behavior, not implementation**: Focus on what users see/do
3. **Keep tests focused**: One assertion per test when possible
4. **Use fixtures for consistency**: Reuse mock data across tests
5. **Test error cases**: Include failure paths and edge cases
6. **Organize tests logically**: Group related tests with `describe`

## Debugging Tests

### Unit Tests
```bash
# Run tests in debug mode
node --inspect-brk ./node_modules/vitest/vitest.mjs run tests/unit/components/auth/login-form.test.tsx

# Then open chrome://inspect in Chrome
```

### E2E Tests
```bash
# Run with UI to see test execution
npm run e2e:ui

# Or use debug mode
npm run e2e:debug
```

## Adding New Tests

1. Create test file in appropriate directory:
   - Component test: `tests/unit/components/[feature]/[component].test.tsx`
   - Hook test: `tests/unit/hooks/[category]/[hook].test.tsx`
   - Store test: `tests/unit/stores/[store].test.tsx`
   - Integration test: `tests/integration/[flow].test.tsx`
   - E2E test: Add to `tests/e2e/auth.spec.ts` or create new file

2. Use fixtures for mock data
3. Use test utilities for common setup
4. Follow existing test patterns
5. Update this README if adding new categories

## Troubleshooting

### Tests fail with import errors
- Ensure relative import paths are correct
- Check fixture and utility imports in test file
- Run `npm install` to ensure dependencies are installed

### Tests timeout
- Increase timeout in test file: `{ timeout: 10000 }`
- Check if async operations are properly awaited
- Use `waitFor` for elements that appear asynchronously

### E2E tests won't start
- Ensure dev server is running: `npm run dev`
- Check if port 5173 is available
- See `tests/e2e/README.md` for environment setup

## Related Files

- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `src/test/setup.ts` - Global test setup (mocks, polyfills)
