import { useCallback, useState } from 'react';

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manages disclosure state for modals, popovers, dropdowns, etc.
 *
 * @param defaultOpen - Initial open state (default: false)
 * @returns Object with isOpen state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useDisclosure();
 *
 * return (
 *   <>
 *     <Button onClick={open}>Open Modal</Button>
 *     <Dialog open={isOpen} onOpenChange={close}>
 *       <DialogContent>...</DialogContent>
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export function useDisclosure(defaultOpen = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), []);

  return { isOpen, open, close, toggle, onOpenChange };
}

/**
 * Manages controlled disclosure state.
 * Use when the parent component needs to control the open state.
 */
export interface UseControlledDisclosureProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useControlledDisclosure({
  isOpen,
  onOpenChange,
}: UseControlledDisclosureProps): UseDisclosureReturn {
  const open = useCallback(() => onOpenChange(true), [onOpenChange]);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const toggle = useCallback(() => onOpenChange(!isOpen), [isOpen, onOpenChange]);

  return { isOpen, open, close, toggle, onOpenChange };
}
