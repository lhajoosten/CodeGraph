import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for FromRight story
function FromRightWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default">Open Sheet (Right)</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            <div>
              <label className="text-text-secondary mb-2 block text-sm font-medium">Name</label>
              <input
                type="text"
                defaultValue="John Doe"
                className="border-border-primary bg-surface text-text-primary w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-text-secondary mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="border-border-primary bg-surface text-text-primary w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="default">Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sheet sliding from right side
 */
export const FromRight: Story = {
  // @ts-expect-error - Story uses custom render with wrapper component
  args: {},
  render: () => <FromRightWrapper />,
};

// Wrapper component for FromLeft story
function FromLeftWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default">Open Sheet (Left)</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Access your workspace navigation from here.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <nav className="space-y-2">
            <button className="text-text-secondary w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-surface-secondary hover:text-text-primary">
              Dashboard
            </button>
            <button className="text-text-secondary w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-surface-secondary hover:text-text-primary">
              Tasks
            </button>
            <button className="text-text-secondary w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-surface-secondary hover:text-text-primary">
              Settings
            </button>
            <button className="text-text-secondary w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-surface-secondary hover:text-text-primary">
              Help
            </button>
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sheet sliding from left side
 */
export const FromLeft: Story = {
  // @ts-expect-error - Story uses custom render with wrapper component
  args: {},
  render: () => <FromLeftWrapper />,
};

// Wrapper component for FromTop story
function FromTopWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default">Open Sheet (Top)</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Quick Filters</SheetTitle>
          <SheetDescription>Filter tasks by priority and status.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="border-border-primary bg-surface text-text-secondary rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-brand-cyan/10 hover:text-brand-cyan">
                High Priority
              </button>
              <button className="border-border-primary bg-surface text-text-secondary rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-brand-cyan/10 hover:text-brand-cyan">
                In Progress
              </button>
              <button className="border-border-primary bg-surface text-text-secondary rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-brand-cyan/10 hover:text-brand-cyan">
                Today
              </button>
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sheet sliding from top
 */
export const FromTop: Story = {
  // @ts-expect-error - Story uses custom render with wrapper component
  args: {},
  render: () => <FromTopWrapper />,
};

// Wrapper component for FromBottom story
function FromBottomWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default">Open Sheet (Bottom)</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Share Task</SheetTitle>
          <SheetDescription>Invite team members to collaborate on this task.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Enter email address"
              className="border-border-primary bg-surface text-text-primary w-full rounded-lg border px-3 py-2 placeholder:text-text-muted"
            />
            <div className="flex gap-2">
              <button className="border-border-primary bg-surface text-text-secondary rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-surface-secondary">
                Can View
              </button>
              <button className="border-border-primary bg-surface text-text-secondary rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-surface-secondary">
                Can Edit
              </button>
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sheet sliding from bottom
 */
export const FromBottom: Story = {
  // @ts-expect-error - Story uses custom render with wrapper component
  args: {},
  render: () => <FromBottomWrapper />,
};

// Wrapper component for NoCloseButton story
function NoCloseButtonWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} closeOnOverlayClick={true}>
        <SheetHeader>
          <SheetTitle>Complete Action</SheetTitle>
          <SheetDescription>You must click outside to dismiss this sheet.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-text-secondary text-sm">
            This sheet has no close button. Click on the overlay to close it.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sheet with close button disabled (overlay click only)
 */
export const NoCloseButton: Story = {
  // @ts-expect-error - Story uses custom render with wrapper component
  args: {},
  render: () => <NoCloseButtonWrapper />,
};
