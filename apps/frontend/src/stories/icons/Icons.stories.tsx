import type { Meta, StoryObj } from '@storybook/react';
import {
  Icon,
  // Standard icons
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  // Custom variants
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
  LoadingIcon,
  // Brand icons
  GithubIcon,
  GoogleIcon,
  MicrosoftIcon,
  AppleIcon,
} from '@/components/icons';

const meta = {
  title: 'Icons/System',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Heroicons integrated icon system with size and color variants. Includes standard icons, custom variants, and brand logos.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Icon size variant',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'muted'],
      description: 'Color variant with light/dark mode support',
    },
    label: {
      control: 'text',
      description: 'Accessibility label (aria-label)',
    },
  },
  args: {
    icon: CheckCircleIcon,
    size: 'md',
    variant: 'default',
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// SIZE VARIANTS
// ============================================================

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="xs" variant="primary" />
        <span className="text-xs text-gray-600">xs (12px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="sm" variant="primary" />
        <span className="text-xs text-gray-600">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="md" variant="primary" />
        <span className="text-xs text-gray-600">md (20px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="lg" variant="primary" />
        <span className="text-xs text-gray-600">lg (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="xl" variant="primary" />
        <span className="text-xs text-gray-600">xl (32px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="2xl" variant="primary" />
        <span className="text-xs text-gray-600">2xl (48px)</span>
      </div>
    </div>
  ),
};

// ============================================================
// COLOR VARIANTS
// ============================================================

export const ColorVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="lg" variant="default" />
        <span className="text-xs text-gray-600">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="lg" variant="primary" />
        <span className="text-xs text-gray-600">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="lg" variant="success" />
        <span className="text-xs text-gray-600">Success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={ExclamationCircleIcon} size="lg" variant="warning" />
        <span className="text-xs text-gray-600">Warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={XCircleIcon} size="lg" variant="danger" />
        <span className="text-xs text-gray-600">Danger</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={InformationCircleIcon} size="lg" variant="muted" />
        <span className="text-xs text-gray-600">Muted</span>
      </div>
    </div>
  ),
};

// ============================================================
// STANDARD ICONS
// ============================================================

export const StandardIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircleIcon} size="lg" variant="success" />
        <span className="text-xs text-gray-600">CheckCircle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={XCircleIcon} size="lg" variant="danger" />
        <span className="text-xs text-gray-600">XCircle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={ExclamationCircleIcon} size="lg" variant="warning" />
        <span className="text-xs text-gray-600">ExclamationCircle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={InformationCircleIcon} size="lg" variant="primary" />
        <span className="text-xs text-gray-600">InformationCircle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={PlusIcon} size="lg" />
        <span className="text-xs text-gray-600">Plus</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={TrashIcon} size="lg" />
        <span className="text-xs text-gray-600">Trash</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={PencilIcon} size="lg" />
        <span className="text-xs text-gray-600">Pencil</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={EyeIcon} size="lg" />
        <span className="text-xs text-gray-600">Eye</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={SearchIcon} size="lg" />
        <span className="text-xs text-gray-600">Search</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckIcon} size="lg" />
        <span className="text-xs text-gray-600">Check</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={ChevronLeftIcon} size="lg" />
        <span className="text-xs text-gray-600">ChevronLeft</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={ChevronRightIcon} size="lg" />
        <span className="text-xs text-gray-600">ChevronRight</span>
      </div>
    </div>
  ),
};

// ============================================================
// CUSTOM VARIANT ICONS
// ============================================================

export const CustomVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="flex flex-col items-center gap-2">
        <SuccessIcon size="lg" />
        <span className="text-xs text-gray-600">SuccessIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ErrorIcon size="lg" />
        <span className="text-xs text-gray-600">ErrorIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <WarningIcon size="lg" />
        <span className="text-xs text-gray-600">WarningIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InfoIcon size="lg" />
        <span className="text-xs text-gray-600">InfoIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingIcon size="lg" />
        <span className="text-xs text-gray-600">LoadingIcon</span>
      </div>
    </div>
  ),
};

// ============================================================
// BRAND ICONS
// ============================================================

export const BrandIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      <div className="flex flex-col items-center gap-2">
        <GithubIcon className="h-12 w-12" />
        <span className="text-xs text-gray-600">GitHub</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <GoogleIcon className="h-12 w-12" />
        <span className="text-xs text-gray-600">Google</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <MicrosoftIcon className="h-12 w-12" />
        <span className="text-xs text-gray-600">Microsoft</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AppleIcon className="h-12 w-12" />
        <span className="text-xs text-gray-600">Apple</span>
      </div>
    </div>
  ),
};

// ============================================================
// INDIVIDUAL ICON STORIES
// ============================================================

export const Default: Story = {
  args: {
    icon: CheckCircleIcon,
    variant: 'default',
  },
};

export const Primary: Story = {
  args: {
    icon: InformationCircleIcon,
    variant: 'primary',
  },
};

export const Success: Story = {
  args: {
    icon: CheckCircleIcon,
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    icon: ExclamationCircleIcon,
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    icon: XCircleIcon,
    variant: 'danger',
  },
};

export const WithLabel: Story = {
  args: {
    icon: CheckCircleIcon,
    variant: 'success',
    label: 'Task completed successfully',
  },
};

export const LargeSize: Story = {
  args: {
    icon: CheckCircleIcon,
    size: 'xl',
    variant: 'success',
  },
};
