import { useState } from 'react';
import {
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { addToast } from '@/lib/toast';

interface WebhookSecretDisplayProps {
  secret: string;
  className?: string;
}

export function WebhookSecretDisplay({ secret, className }: WebhookSecretDisplayProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      addToast({
        title: 'Copied to Clipboard',
        description: 'Webhook secret copied successfully.',
        color: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        title: 'Failed to Copy',
        description: 'Could not copy to clipboard.',
        color: 'danger',
      });
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Input
          type={showSecret ? 'text' : 'password'}
          value={secret}
          readOnly
          className="pr-10 font-mono text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
          onClick={() => setShowSecret(!showSecret)}
        >
          {showSecret ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </Button>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={handleCopy} disabled={copied}>
        {copied ? (
          <CheckIcon className="text-success h-4 w-4" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
