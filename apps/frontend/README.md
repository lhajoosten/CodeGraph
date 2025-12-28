# CodeGraph Frontend

React frontend for the CodeGraph AI coding agent platform.

## Overview

Modern React 19 application built with TypeScript, Vite, and Tailwind CSS v4. Provides a user interface for managing coding tasks, monitoring AI agent execution, and user authentication with 2FA support.

## Tech Stack

- **React 19**: Latest React with compiler optimizations
- **TypeScript 5.9**: Strict type checking for better code quality
- **Vite 7**: Fast development server and optimized builds
- **TanStack Router**: Type-safe file-based routing
- **TanStack Query**: Server state management and caching
- **Zustand**: Lightweight client state management
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS v4**: Utility-first CSS framework
- **Monaco Editor**: VS Code's editor for code viewing/editing
- **React Hook Form + Zod**: Form handling with schema validation
- **i18next**: Internationalization (EN, NL, DE)
- **Vitest**: Unit and component testing
- **Playwright**: End-to-end testing
- **Storybook**: Component documentation and development
- **OpenAPI TypeScript**: Auto-generated API client from backend schema

## Features

- **Authentication**: JWT-based auth with refresh tokens and persistent sessions
- **Two-Factor Authentication**: TOTP setup with QR codes and backup codes
- **OAuth Login**: GitHub, Google, and Microsoft sign-in
- **Task Management**: Create, view, update, and manage coding tasks
- **Real-time Updates**: Live agent execution status via SSE
- **Code Viewing**: Monaco editor integration for code display
- **Multi-language**: Support for English, Dutch, and German
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Mode**: Theme switching support

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:scan         # Dev server with React Scan enabled

# Building
npm run build            # Production build (tsc + vite)
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run Vitest tests
npm run test:coverage    # Tests with coverage report
npm run test:all         # Unit + E2E tests

# E2E Testing (Playwright)
npm run e2e              # Run E2E tests
npm run e2e:headed       # E2E with browser visible
npm run e2e:debug        # E2E in debug mode
npm run e2e:ui           # E2E with Playwright UI

# Storybook
npm run storybook        # Start Storybook (port 6006)
npm run build-storybook  # Build static Storybook

# API Client
npm run api:generate     # Generate API client from OpenAPI spec
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── layout/         # Layout components (navbar, sidebar, etc.)
│   ├── auth/           # Authentication components
│   ├── tasks/          # Task-specific components
│   ├── agents/         # Agent execution components
│   ├── settings/       # Settings page components
│   ├── two-factor/     # 2FA setup components
│   └── icons/          # Icon components
├── routes/              # TanStack Router file-based routes
│   ├── _protected/     # Authenticated routes
│   ├── _public/        # Public routes (login, register)
│   ├── __root.tsx      # Root layout
│   └── $404.tsx        # 404 page
├── hooks/               # Custom React hooks
│   ├── api/            # API-related hooks
│   └── common/         # Common utility hooks
├── stores/              # Zustand stores
│   └── auth-store.ts   # Authentication state
├── openapi/             # Generated API client
│   ├── client.gen.ts   # API client
│   ├── schemas.gen.ts  # Request/response schemas
│   ├── types.gen.ts    # TypeScript types
│   └── zod.gen.ts      # Zod validation schemas
├── locales/             # i18n translations
│   ├── en/             # English
│   ├── nl/             # Dutch
│   └── de/             # German
├── lib/                 # Utility functions
│   ├── api-client.ts   # Axios client setup
│   ├── error-handler.ts # Error handling utilities
│   ├── toast.ts        # Toast notifications (Sonner)
│   ├── csrf.ts         # CSRF token handling
│   ├── utils.ts        # General utilities
│   └── validators.ts   # Form validators
├── stories/             # Storybook stories
│   ├── components/     # Component stories
│   ├── compositions/   # Composite component stories
│   └── foundations/    # Design system stories
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── routeTree.gen.ts    # Auto-generated route tree

tests/
├── components/          # Component tests
├── hooks/               # Hook tests
├── stores/              # Store tests
├── utils/               # Test utilities
├── fixtures/            # Test fixtures
└── setup.ts            # Vitest setup
```

## API Client Generation

The frontend uses auto-generated TypeScript clients from the backend's OpenAPI schema:

```bash
# Regenerate API client (requires backend running)
npm run api:generate
```

This generates:
- Type-safe API client functions
- Request/response TypeScript types
- Zod validation schemas
- TanStack Query integration

## Internationalization

The app supports multiple languages via i18next:

- **English** (en) - Default
- **Dutch** (nl)
- **German** (de)

Translation files are in `src/locales/{lang}/`. To add translations:

1. Add keys to `src/locales/en/*.json`
2. Copy to other language folders
3. Translate the values

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run e2e

# Run with browser visible
npm run e2e:headed

# Debug mode
npm run e2e:debug

# Playwright UI
npm run e2e:ui
```

## Storybook

Component documentation and visual testing:

```bash
# Start Storybook
npm run storybook
```

Access at `http://localhost:6006`

Stories are organized by:
- **Foundations**: Colors, typography, spacing
- **Components**: Individual UI components
- **Compositions**: Complex component combinations

## Configuration

### Environment Variables

```env
# Required
VITE_API_URL=http://localhost:8000

# Optional
VITE_ENABLE_SCAN=false  # Enable React Scan for performance debugging
```

### TanStack Router

Routes are file-based in `src/routes/`:
- `_protected/` - Routes requiring authentication
- `_public/` - Public routes (login, register, etc.)
- `__root.tsx` - Root layout with providers

Route tree is auto-generated in `routeTree.gen.ts`.

## Contributing

Please follow the coding standards defined in `.clinerules` and ensure:
- All TypeScript types are properly defined
- Components have Storybook stories
- Tests are written for new features
- Translations are added for user-facing text

## License

See the LICENSE file in the root directory.
