import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Provides copy-to-clipboard functionality with status tracking.
 *
 * @param timeout - Time in ms before `copied` resets to false (default: 2000ms)
 * @returns Object with copy function and copied status
 *
 * @example
 * ```tsx
 * const { copied, copy } = useCopyToClipboard();
 *
 * return (
 *   <Button onClick={() => copy('Hello world')}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </Button>
 * );
 * ```
 */
export function useCopyToClipboard(timeout = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator.clipboard) {
        console.warn('Clipboard API not available');
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        setCopied(false);
        return false;
      }
    },
    [timeout]
  );

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
