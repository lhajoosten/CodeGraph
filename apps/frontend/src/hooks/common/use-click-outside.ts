import { useEffect, useRef, type RefObject } from 'react';

/**
 * Detects clicks outside of the referenced element and calls the handler.
 *
 * @param handler - Function to call when a click outside is detected
 * @param enabled - Whether the listener is enabled (default: true)
 * @returns A ref to attach to the element
 *
 * @example
 * ```tsx
 * const { isOpen, close } = useDisclosure();
 * const ref = useClickOutside<HTMLDivElement>(close);
 *
 * return isOpen ? (
 *   <div ref={ref} className="dropdown">
 *     Dropdown content
 *   </div>
 * ) : null;
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled = true
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, enabled]);

  return ref;
}

/**
 * Variant that accepts multiple refs - clicks outside all of them trigger the handler.
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const isOutside = refs.every((ref) => {
        return !ref.current || !ref.current.contains(event.target as Node);
      });

      if (isOutside) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [refs, handler, enabled]);
}
