import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebhookEventsSelector } from './webhook-events-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WebhookCreate, WebhookUpdate, WebhookStatus } from '@/openapi/types.gen';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WebhookFormProps {
  initialData?: {
    name?: string;
    url?: string;
    events?: string[];
    status?: WebhookStatus;
    headers?: Record<string, string> | null;
    retry_count?: number;
    timeout_seconds?: number;
  };
  onSubmit: (data: WebhookCreate | WebhookUpdate) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showStatus?: boolean;
}

interface HeaderEntry {
  key: string;
  value: string;
}

export function WebhookForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = 'Create Webhook',
  showStatus = false,
}: WebhookFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [events, setEvents] = useState<string[]>(initialData?.events || []);
  const [status, setStatus] = useState<WebhookStatus>(initialData?.status || 'active');
  const [retryCount, setRetryCount] = useState(initialData?.retry_count?.toString() || '3');
  const [timeoutSeconds, setTimeoutSeconds] = useState(
    initialData?.timeout_seconds?.toString() || '30'
  );

  // Convert headers object to array for easier editing
  const [headers, setHeaders] = useState<HeaderEntry[]>(() => {
    const initialHeaders = initialData?.headers || {};
    return Object.entries(initialHeaders).map(([key, value]) => ({ key, value }));
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          newErrors.url = 'URL must use HTTP or HTTPS protocol';
        }
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (events.length === 0) {
      newErrors.events = 'At least one event must be selected';
    }

    const retry = parseInt(retryCount, 10);
    if (isNaN(retry) || retry < 0 || retry > 10) {
      newErrors.retryCount = 'Retry count must be between 0 and 10';
    }

    const timeout = parseInt(timeoutSeconds, 10);
    if (isNaN(timeout) || timeout < 1 || timeout > 300) {
      newErrors.timeoutSeconds = 'Timeout must be between 1 and 300 seconds';
    }

    // Validate headers
    const headerKeys = headers.filter((h) => h.key.trim()).map((h) => h.key.trim());
    const duplicateKeys = headerKeys.filter((key, index) => headerKeys.indexOf(key) !== index);
    if (duplicateKeys.length > 0) {
      newErrors.headers = `Duplicate header keys: ${duplicateKeys.join(', ')}`;
    }

    headers.forEach((header, index) => {
      if (header.key.trim() && !header.value.trim()) {
        newErrors[`header_${index}_value`] = 'Value is required';
      }
      if (!header.key.trim() && header.value.trim()) {
        newErrors[`header_${index}_key`] = 'Key is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Convert headers array to object, filtering out empty entries
    const headersObject = headers
      .filter((h) => h.key.trim() && h.value.trim())
      .reduce(
        (acc, h) => {
          acc[h.key.trim()] = h.value.trim();
          return acc;
        },
        {} as Record<string, string>
      );

    const data: WebhookCreate | WebhookUpdate = {
      name: name.trim(),
      url: url.trim(),
      events,
      headers: Object.keys(headersObject).length > 0 ? headersObject : null,
      retry_count: parseInt(retryCount, 10),
      timeout_seconds: parseInt(timeoutSeconds, 10),
    };

    if (showStatus) {
      (data as WebhookUpdate).status = status;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-error">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Webhook"
          className={errors.name ? 'border-error' : ''}
        />
        {errors.name && <p className="text-sm text-error">{errors.name}</p>}
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">
          URL <span className="text-error">*</span>
        </Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/webhooks"
          className={errors.url ? 'border-error' : ''}
        />
        {errors.url && <p className="text-sm text-error">{errors.url}</p>}
        <p className="text-xs text-text-muted-lum">Must be a valid HTTP or HTTPS URL</p>
      </div>

      {/* Status (only for edit mode) */}
      {showStatus && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as WebhookStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Events */}
      <div className="space-y-2">
        <Label>
          Events <span className="text-error">*</span>
        </Label>
        <WebhookEventsSelector
          selectedEvents={events}
          onChange={setEvents}
          error={!!errors.events}
        />
        {errors.events && <p className="text-sm text-error">{errors.events}</p>}
      </div>

      {/* Custom Headers */}
      <div className="space-y-2">
        <Label>Custom Headers (Optional)</Label>
        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                className={`flex-1 ${errors[`header_${index}_key`] ? 'border-error' : ''}`}
              />
              <Input
                placeholder="Header value"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                className={`flex-1 ${errors[`header_${index}_value`] ? 'border-error' : ''}`}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addHeader} className="w-full">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Header
          </Button>
        </div>
        {errors.headers && <p className="text-sm text-error">{errors.headers}</p>}
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="retryCount">Retry Count</Label>
          <Input
            id="retryCount"
            type="number"
            min="0"
            max="10"
            value={retryCount}
            onChange={(e) => setRetryCount(e.target.value)}
            className={errors.retryCount ? 'border-error' : ''}
          />
          {errors.retryCount && <p className="text-sm text-error">{errors.retryCount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeoutSeconds">Timeout (seconds)</Label>
          <Input
            id="timeoutSeconds"
            type="number"
            min="1"
            max="300"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(e.target.value)}
            className={errors.timeoutSeconds ? 'border-error' : ''}
          />
          {errors.timeoutSeconds && <p className="text-sm text-error">{errors.timeoutSeconds}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
