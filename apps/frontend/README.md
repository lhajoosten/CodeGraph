# CodeGraph Frontend

React frontend for the CodeGraph AI coding agent platform.

## Overview

Modern React application built with TypeScript, Vite, and Tailwind CSS. Provides a user interface for managing coding tasks and monitoring AI agent execution.

## Tech Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Strict type checking for better code quality
- **Vite**: Fast development server and optimized builds
- **TanStack Query**: Server state management and caching
- **Zustand**: Lightweight client state management
- **React Router v6**: Client-side routing
- **Shadcn/ui**: Beautiful, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Monaco Editor**: Code editor for viewing/editing code
- **Zod**: Schema validation for forms

## Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Start development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Development

### Running in Development Mode

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Linting

```bash
pnpm lint
```

### Running Tests

```bash
pnpm test
```

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── ui/         # Shadcn/ui components
│   ├── layout/     # Layout components
│   ├── tasks/      # Task-specific components
│   └── agents/     # Agent-related components
├── features/        # Feature-based modules
│   ├── auth/       # Authentication feature
│   ├── tasks/      # Tasks feature
│   └── agents/     # Agents feature
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── services/        # API service layer
├── stores/          # Zustand stores
├── types/           # TypeScript type definitions
└── pages/           # Page components (routes)
```

## Key Features

- **Authentication**: JWT-based authentication with persistent sessions
- **Task Management**: Create, view, update, and manage coding tasks
- **Real-time Updates**: Live agent execution status via WebSocket (TODO)
- **Code Viewing**: Monaco editor integration for code display
- **Responsive Design**: Mobile-friendly interface

## Contributing

Please follow the coding standards defined in `.clinerules` and ensure all TypeScript types are properly defined.

## License

See the LICENSE file in the root directory.
