# Library Utilities

This directory contains shared utility functions and helpers used across the application.

## Current Contents

### `utils.ts`

Utility functions for common operations:

- **`cn()`** - Merge Tailwind CSS classes with proper precedence handling using `clsx` and `tailwind-merge`

```typescript
import { cn } from '@/lib/utils';

// Example
const buttonClass = cn('px-4 py-2 rounded', isActive && 'bg-blue-500', 'text-white');
```

## What Was Here (Removed)

The following files were moved to the new `src/hooks/` directory structure for better organization:

### Removed in refactor:

- ✌️ `api-hooks.ts` → Moved to `src/hooks/lib/create-hooks.ts`
- ✌️ `api.ts` → Replaced by auto-generated client in `src/api/generated/`
- ✌️ `auth-hooks.ts` → Moved to `src/hooks/api/use-auth.ts`
- ✌️ `hooks.ts` → Moved to `src/hooks/index.ts`
- ✌️ `tasks-hooks.ts` → Moved to `src/hooks/api/use-tasks.ts`

## Future Additions

Add utility functions here for:

- API response transformations
- Data formatting
- Date/time helpers
- Validation helpers
- Constants
- Types and interfaces

## See Also

- [Hooks Structure](../hooks/README.md) - All hook-related code
- [API Usage Guide](../API_USAGE_GUIDE.md) - How to use the generated API client
