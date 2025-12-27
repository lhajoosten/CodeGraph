# Standard Icons

This directory contains re-exports of commonly used Heroicons with standardized naming conventions.

## Icon Naming Convention

Icons are renamed from Heroicons to match project conventions:

| Heroicons Name            | Standard Name             | Usage                       |
| ------------------------- | ------------------------- | --------------------------- |
| `Squares2X2Icon`          | `LayoutDashboardIcon`     | Dashboard/layout view       |
| `CheckCircleIcon`         | `CheckSquareIcon`         | Checkboxes, task completion |
| `Cog6ToothIcon`           | `SettingsIcon`            | Settings/configuration      |
| `PencilIcon`              | `PencilIcon`              | Edit action                 |
| `TrashIcon`               | `TrashIcon`               | Delete action               |
| `EyeIcon`                 | `EyeIcon`                 | Show/visibility             |
| `EyeSlashIcon`            | `EyeSlashIcon`            | Hide/visibility toggle      |
| `PlusIcon`                | `PlusIcon`                | Add/create action           |
| `MinusIcon`               | `MinusIcon`               | Remove/subtract action      |
| `XMarkIcon`               | `XIcon` or `ClearIcon`    | Close/clear action          |
| `CheckIcon`               | `CheckIcon`               | Confirmation/success        |
| `CheckCircleIcon`         | `CheckCircleIcon`         | Success status              |
| `XCircleIcon`             | `XCircleIcon`             | Error/failure status        |
| `ExclamationCircleIcon`   | `ExclamationCircleIcon`   | Warning status              |
| `ExclamationTriangleIcon` | `ExclamationTriangleIcon` | Alert/caution               |
| `InformationCircleIcon`   | `InformationCircleIcon`   | Info/notice                 |
| `ArrowPathIcon`           | `SpinnerIcon`             | Loading indicator           |
| `MagnifyingGlassIcon`     | `SearchIcon`              | Search action               |
| `ChevronLeftIcon`         | `ChevronLeftIcon`         | Left navigation             |
| `ChevronRightIcon`        | `ChevronRightIcon`        | Right navigation            |
| `ChevronUpIcon`           | `ChevronUpIcon`           | Up navigation/collapse      |
| `ChevronDownIcon`         | `ChevronDownIcon`         | Down navigation/expand      |
| `EllipsisHorizontalIcon`  | `MoreHorizontalIcon`      | More options menu           |
| `UserIcon`                | `UserIcon`                | User/profile                |
| `EnvelopeIcon`            | `MailIcon`                | Email/message               |
| `LockClosedIcon`          | `LockIcon`                | Security/locked             |
| `BellIcon`                | `NotificationIcon`        | Notifications               |

## Usage

### Basic Usage

```typescript
import { CheckCircleIcon, PlusIcon } from '@/components/icons/standard';
import { Icon } from '@/components/icons';

// Direct import (without Icon wrapper)
<CheckCircleIcon className="h-5 w-5" />

// With Icon wrapper for consistent sizing and variants
<Icon icon={CheckCircleIcon} size="lg" variant="success" />
<Icon icon={PlusIcon} size="md" variant="primary" />
```

### With Icon Wrapper

The `Icon` wrapper component provides consistent sizing and color variants:

```typescript
<Icon
  icon={CheckCircleIcon}
  size="lg"           // xs, sm, md, lg, xl, 2xl
  variant="success"   // default, primary, success, warning, danger, muted
  label="Task completed"  // For accessibility
/>
```

### Size Reference

| Size  | Tailwind Classes | Pixels (approx) |
| ----- | ---------------- | --------------- |
| `xs`  | `h-3 w-3`        | 12px            |
| `sm`  | `h-4 w-4`        | 16px            |
| `md`  | `h-5 w-5`        | 20px (default)  |
| `lg`  | `h-6 w-6`        | 24px            |
| `xl`  | `h-8 w-8`        | 32px            |
| `2xl` | `h-12 w-12`      | 48px            |

### Color Variants

| Variant   | Light Mode | Dark Mode  |
| --------- | ---------- | ---------- |
| `default` | gray-900   | gray-100   |
| `primary` | blue-600   | blue-400   |
| `success` | green-600  | green-400  |
| `warning` | yellow-600 | yellow-400 |
| `danger`  | red-600    | red-400    |
| `muted`   | gray-500   | gray-400   |

## Solid Variants

For situations requiring solid icons, use the `*SolidIcon` variants:

```typescript
import { CheckCircleSolidIcon } from '@/components/icons/standard';

<Icon icon={CheckCircleSolidIcon} variant="success" />
```

## Adding New Icons

When adding new icons:

1. Export from Heroicons in the appropriate category
2. Use a meaningful alias matching the project naming convention
3. Update this README with the mapping
4. Update `Icon Mapping Reference` in the root implementation plan

## Available Icon Sources

- **Outline Icons**: 24px, outlined style (default)
- **Solid Icons**: 24px, filled style
- **Mini Icons**: 20px, compact size (use when space is constrained)

See [Heroicons documentation](https://heroicons.com/) for the complete icon library.
