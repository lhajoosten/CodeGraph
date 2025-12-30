import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SlashIcon } from '@heroicons/react/24/outline';

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: 'select',
      options: ['chevron', 'slash', 'arrow'],
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic breadcrumb navigation
 */
export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
      { label: 'Account', href: '/settings/account' },
      { label: 'Security' },
    ],
  },
};

/**
 * Breadcrumbs with custom separator
 */
export const WithSlashSeparator: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'My App', href: '/projects/my-app' },
      { label: 'Settings' },
    ],
    separator: <SlashIcon className="h-4 w-4" />,
  },
};

/**
 * Breadcrumbs with custom separator (arrow)
 */
export const WithArrowSeparator: Story = {
  args: {
    items: [
      { label: 'Workspace', href: '/' },
      { label: 'Tasks', href: '/tasks' },
      { label: 'In Progress', href: '/tasks?status=in-progress' },
      { label: 'Implement Auth' },
    ],
    separator: <span className="mx-2 text-text-secondary">→</span>,
  },
};

/**
 * Long breadcrumb path (shows ellipsis on mobile)
 */
export const LongPath: Story = {
  args: {
    items: [
      { label: 'Root', href: '/' },
      { label: 'Level 1', href: '/level1' },
      { label: 'Level 2', href: '/level2' },
      { label: 'Level 3', href: '/level3' },
      { label: 'Level 4', href: '/level4' },
      { label: 'Level 5' },
    ],
  },
};

/**
 * Breadcrumbs with click handlers
 */
export const Interactive: Story = {
  args: {
    items: [
      {
        label: 'Home',
        onClick: () => console.log('Navigate to home'),
      },
      {
        label: 'Settings',
        onClick: () => console.log('Navigate to settings'),
      },
      {
        label: 'Profile',
        onClick: () => console.log('Navigate to profile'),
      },
      {
        label: 'Edit',
      },
    ],
  },
};

/**
 * Single item (just current page)
 */
export const SingleItem: Story = {
  args: {
    items: [{ label: 'Dashboard' }],
  },
};

/**
 * Two item navigation path
 */
export const TwoItems: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Settings' }],
  },
};
