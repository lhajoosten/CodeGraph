import { CheckboxWithLabel } from '@/components/ui/checkbox';
import { WEBHOOK_EVENT_GROUPS, WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import { cn } from '@/lib/utils';

interface WebhookEventsSelectorProps {
  selectedEvents: string[];
  onChange: (events: string[]) => void;
  error?: boolean;
  className?: string;
}

export function WebhookEventsSelector({
  selectedEvents,
  onChange,
  error,
  className,
}: WebhookEventsSelectorProps) {
  const allSelected = selectedEvents.includes('*');
  const taskEvents = WEBHOOK_EVENT_GROUPS.task;
  const agentEvents = WEBHOOK_EVENT_GROUPS.agent;
  const workflowEvents = WEBHOOK_EVENT_GROUPS.workflow;

  const handleAllEventsChange = (checked: boolean) => {
    if (checked) {
      onChange(['*']);
    } else {
      onChange([]);
    }
  };

  const handleEventChange = (event: string, checked: boolean) => {
    // If "All Events" is selected, unselect it first
    let newEvents = selectedEvents.filter((e) => e !== '*');

    if (checked) {
      newEvents = [...newEvents, event];
    } else {
      newEvents = newEvents.filter((e) => e !== event);
    }

    onChange(newEvents);
  };

  const handleGroupChange = (groupEvents: readonly string[], checked: boolean) => {
    // If "All Events" is selected, unselect it first
    let newEvents = selectedEvents.filter((e) => e !== '*');

    if (checked) {
      // Add all events from group that aren't already selected
      const eventsToAdd = groupEvents.filter((e) => !newEvents.includes(e));
      newEvents = [...newEvents, ...eventsToAdd];
    } else {
      // Remove all events from group
      newEvents = newEvents.filter((e) => !groupEvents.includes(e));
    }

    onChange(newEvents);
  };

  const isGroupFullySelected = (groupEvents: readonly string[]) => {
    if (allSelected) return true;
    return groupEvents.every((e) => selectedEvents.includes(e));
  };

  const isGroupPartiallySelected = (groupEvents: readonly string[]) => {
    if (allSelected) return false;
    const selectedCount = groupEvents.filter((e) => selectedEvents.includes(e)).length;
    return selectedCount > 0 && selectedCount < groupEvents.length;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-border-primary p-4">
        <CheckboxWithLabel
          label="All Events"
          description="Subscribe to all current and future events"
          checked={allSelected}
          onCheckedChange={handleAllEventsChange}
          error={error}
        />
      </div>

      {!allSelected && (
        <div className="space-y-4">
          {/* Task Events */}
          <div className="rounded-lg border border-border-primary p-4">
            <div className="mb-3">
              <CheckboxWithLabel
                label="All Task Events"
                checked={
                  isGroupPartiallySelected(taskEvents)
                    ? 'indeterminate'
                    : isGroupFullySelected(taskEvents)
                }
                onCheckedChange={(checked) => handleGroupChange(taskEvents, checked as boolean)}
                error={error}
              />
            </div>
            <div className="ml-6 space-y-2">
              {taskEvents.map((event) => (
                <CheckboxWithLabel
                  key={event}
                  label={WEBHOOK_EVENT_LABELS[event]}
                  checked={selectedEvents.includes(event)}
                  onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                  error={error}
                />
              ))}
            </div>
          </div>

          {/* Agent Events */}
          <div className="rounded-lg border border-border-primary p-4">
            <div className="mb-3">
              <CheckboxWithLabel
                label="All Agent Events"
                checked={
                  isGroupPartiallySelected(agentEvents)
                    ? 'indeterminate'
                    : isGroupFullySelected(agentEvents)
                }
                onCheckedChange={(checked) => handleGroupChange(agentEvents, checked as boolean)}
                error={error}
              />
            </div>
            <div className="ml-6 space-y-2">
              {agentEvents.map((event) => (
                <CheckboxWithLabel
                  key={event}
                  label={WEBHOOK_EVENT_LABELS[event]}
                  checked={selectedEvents.includes(event)}
                  onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                  error={error}
                />
              ))}
            </div>
          </div>

          {/* Workflow Events */}
          <div className="rounded-lg border border-border-primary p-4">
            <div className="mb-3">
              <CheckboxWithLabel
                label="All Workflow Events"
                checked={
                  isGroupPartiallySelected(workflowEvents)
                    ? 'indeterminate'
                    : isGroupFullySelected(workflowEvents)
                }
                onCheckedChange={(checked) => handleGroupChange(workflowEvents, checked as boolean)}
                error={error}
              />
            </div>
            <div className="ml-6 space-y-2">
              {workflowEvents.map((event) => (
                <CheckboxWithLabel
                  key={event}
                  label={WEBHOOK_EVENT_LABELS[event]}
                  checked={selectedEvents.includes(event)}
                  onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                  error={error}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-error">Please select at least one event</p>}
    </div>
  );
}
