import { useEffect, useCallback } from 'react';

type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta';

interface KeyboardShortcutOptions {
  key: string;
  modifiers?: KeyModifier[];
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * Registers a keyboard shortcut handler.
 *
 * @param options - Keyboard shortcut configuration
 * @param handler - Function to call when the shortcut is triggered
 *
 * @example
 * ```tsx
 * // Ctrl+S to save
 * useKeyboardShortcut(
 *   { key: 's', modifiers: ['ctrl'], preventDefault: true },
 *   () => saveDocument()
 * );
 *
 * // Escape to close modal
 * useKeyboardShortcut(
 *   { key: 'Escape' },
 *   () => closeModal()
 * );
 * ```
 */
export function useKeyboardShortcut(options: KeyboardShortcutOptions, handler: () => void): void {
  const { key, modifiers = [], preventDefault = false, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check modifiers
      const ctrlRequired = modifiers.includes('ctrl');
      const altRequired = modifiers.includes('alt');
      const shiftRequired = modifiers.includes('shift');
      const metaRequired = modifiers.includes('meta');

      const ctrlPressed = event.ctrlKey || event.metaKey; // Handle Cmd on Mac
      const altPressed = event.altKey;
      const shiftPressed = event.shiftKey;
      const metaPressed = event.metaKey;

      if (ctrlRequired && !ctrlPressed) return;
      if (altRequired && !altPressed) return;
      if (shiftRequired && !shiftPressed) return;
      if (metaRequired && !metaPressed) return;

      // Check key
      if (event.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler();
      }
    },
    [key, modifiers, preventDefault, enabled, handler]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Registers multiple keyboard shortcuts at once.
 */
export function useKeyboardShortcuts(
  shortcuts: Array<KeyboardShortcutOptions & { handler: () => void }>
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, modifiers = [], preventDefault = false, enabled = true, handler } = shortcut;

        if (!enabled) continue;

        const ctrlRequired = modifiers.includes('ctrl');
        const altRequired = modifiers.includes('alt');
        const shiftRequired = modifiers.includes('shift');
        const metaRequired = modifiers.includes('meta');

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const altPressed = event.altKey;
        const shiftPressed = event.shiftKey;
        const metaPressed = event.metaKey;

        if (ctrlRequired && !ctrlPressed) continue;
        if (altRequired && !altPressed) continue;
        if (shiftRequired && !shiftPressed) continue;
        if (metaRequired && !metaPressed) continue;

        if (event.key.toLowerCase() === key.toLowerCase()) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
