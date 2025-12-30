import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    currentPage: {
      control: 'number',
      min: 1,
    },
    totalPages: {
      control: 'number',
      min: 1,
    },
    itemsPerPage: {
      control: 'number',
      min: 1,
    },
    totalItems: {
      control: 'number',
      min: 0,
    },
    showFirstLast: {
      control: 'boolean',
    },
    showItemsPerPageSelector: {
      control: 'boolean',
    },
  },
  args: {
    currentPage: 1,
    totalPages: 10,
    itemsPerPage: 20,
    totalItems: 200,
    showFirstLast: true,
    showItemsPerPageSelector: true,
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for Default story with state management
function DefaultPaginationWrapper() {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  return (
    <div className="space-y-4">
      <Pagination
        currentPage={page}
        totalPages={10}
        itemsPerPage={itemsPerPage}
        totalItems={200}
        showFirstLast={true}
        showItemsPerPageSelector={true}
        onPageChange={setPage}
        onItemsPerPageChange={setItemsPerPage}
      />
      <p className="text-text-secondary-lum text-sm">
        Current page: {page} | Items per page: {itemsPerPage}
      </p>
    </div>
  );
}

/**
 * Default Pagination with all features
 */
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
  render: () => <DefaultPaginationWrapper />,
};

// Wrapper component for ManyPages story with state management
function ManyPagesPaginationWrapper() {
  const [page, setPage] = useState(50);

  return (
    <div className="space-y-4">
      <Pagination
        currentPage={page}
        totalPages={100}
        itemsPerPage={10}
        totalItems={1000}
        showFirstLast={true}
        showItemsPerPageSelector={false}
        onPageChange={setPage}
      />
      <p className="text-text-secondary-lum text-sm">
        Current page: {page} | Showing pages with ellipsis for large ranges
      </p>
    </div>
  );
}

/**
 * Pagination with many pages (shows ellipsis)
 */
export const ManyPages: Story = {
  args: {
    currentPage: 50,
    totalPages: 100,
    onPageChange: () => {},
  },
  render: () => <ManyPagesPaginationWrapper />,
};

// Wrapper component for Minimal story with state management
function MinimalPaginationWrapper() {
  const [page, setPage] = useState(3);

  return (
    <Pagination
      currentPage={page}
      totalPages={8}
      showFirstLast={false}
      showItemsPerPageSelector={false}
      onPageChange={setPage}
    />
  );
}

/**
 * Minimal Pagination (no first/last buttons)
 */
export const Minimal: Story = {
  args: {
    currentPage: 3,
    totalPages: 8,
    onPageChange: () => {},
  },
  render: () => <MinimalPaginationWrapper />,
};

/**
 * Single page (navigation disabled)
 */
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    onPageChange: () => {},
  },
  render: () => (
    <Pagination
      currentPage={1}
      totalPages={1}
      itemsPerPage={50}
      totalItems={50}
      showFirstLast={true}
      showItemsPerPageSelector={true}
      onPageChange={() => {}}
    />
  ),
};

/**
 * First page (previous disabled)
 */
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 20,
    onPageChange: () => {},
  },
  render: () => (
    <Pagination
      currentPage={1}
      totalPages={20}
      itemsPerPage={25}
      totalItems={500}
      showFirstLast={true}
      showItemsPerPageSelector={false}
      onPageChange={() => {}}
    />
  ),
};

/**
 * Last page (next disabled)
 */
export const LastPage: Story = {
  args: {
    currentPage: 20,
    totalPages: 20,
    onPageChange: () => {},
  },
  render: () => (
    <Pagination
      currentPage={20}
      totalPages={20}
      itemsPerPage={25}
      totalItems={500}
      showFirstLast={true}
      showItemsPerPageSelector={false}
      onPageChange={() => {}}
    />
  ),
};
