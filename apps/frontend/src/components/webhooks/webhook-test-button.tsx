import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTestWebhook } from '@/hooks/api/webhooks/mutations/use-test-webhook';
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookTestResponse } from '@/openapi/types.gen';
import { cn } from '@/lib/utils';

interface WebhookTestButtonProps {
  webhookId: number;
  availableEvents: string[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function WebhookTestButton({
  webhookId,
  availableEvents,
  variant = 'outline',
  size = 'default',
  className,
}: WebhookTestButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [testResult, setTestResult] = useState<WebhookTestResponse | null>(null);

  const testMutation = useTestWebhook();

  const handleTest = () => {
    testMutation.mutate(
      {
        path: { webhook_id: webhookId },
        body: selectedEvent ? { event_type: selectedEvent } : {},
      },
      {
        onSuccess: (data) => {
          setTestResult(data);
        },
      }
    );
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTestResult(null);
    setSelectedEvent('');
  };

  // Filter available events based on webhook subscription
  const selectableEvents = availableEvents.includes('*')
    ? Object.values(WEBHOOK_EVENTS)
    : availableEvents;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={className}
      >
        <ArrowPathIcon className="mr-2 h-4 w-4" />
        Test Webhook
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test event to verify your webhook endpoint is working correctly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type (Optional)</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Random event" />
                </SelectTrigger>
                <SelectContent>
                  {selectableEvents.map((event) => (
                    <SelectItem key={event} value={event}>
                      {WEBHOOK_EVENT_LABELS[event] || event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-text-muted text-xs">
                Leave empty to use a random event from your subscribed events
              </p>
            </div>

            {testResult && (
              <div
                className={cn(
                  'rounded-lg border p-4',
                  testResult.success ? 'border-success bg-success/10' : 'border-error bg-error/10'
                )}
              >
                <h4
                  className={cn(
                    'mb-2 font-semibold',
                    testResult.success ? 'text-success' : 'text-error'
                  )}
                >
                  {testResult.success ? 'Success' : 'Failed'}
                </h4>
                <div className="space-y-1 text-sm">
                  {testResult.status_code && (
                    <p>
                      <span className="font-medium">Status Code:</span> {testResult.status_code}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Duration:</span> {testResult.duration_ms}ms
                  </p>
                  {testResult.error_message && (
                    <p className="text-error">
                      <span className="font-medium">Error:</span> {testResult.error_message}
                    </p>
                  )}
                  {testResult.response_body && (
                    <div className="mt-2">
                      <p className="font-medium">Response:</p>
                      <pre className="bg-surface mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                        {testResult.response_body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleTest} disabled={testMutation.isPending}>
              {testMutation.isPending ? 'Testing...' : 'Send Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
