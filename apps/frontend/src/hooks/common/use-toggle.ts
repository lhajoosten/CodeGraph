/**
 * Hook for managing boolean state (open/closed, show/hide, etc.)
 */

import { useState, useCallback } from 'react';

/**
 * Manage a boolean toggle state.
 *
 * @param initialValue - Initial state (default: false)
 * @returns State and control functions
 *
 * @example
 * const modal = useToggle();
 * return (
 *   <>
 *     <button onClick={modal.open}>Open Modal</button>
 *     {modal.isOpen && <Modal onClose={modal.close} />}
 *   </>
 * );
 */
export const useToggle = (initialValue = false) => {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
