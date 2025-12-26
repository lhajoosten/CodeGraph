import * as React from 'react';
import {
  CodeBracketIcon,
  BeakerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { AgentUpdate } from '@/hooks';
import type { AgentType, AgentStatus } from '@/lib/guards';
import { formatTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const agentIcons: Record<AgentType, React.ComponentType<{ className?: string }>> = {
  planning: CodeBracketIcon,
  coding: CodeBracketIcon,
  testing: BeakerIcon,
  review: CheckCircleIcon,
};

const statusIcons: Record<AgentStatus, React.ComponentType<{ className?: string }>> = {
  idle: ArrowPathIcon,
  running: ArrowPathIcon,
  completed: CheckCircleIcon,
  failed: ExclamationCircleIcon,
};

interface AgentLogProps {
  updates: AgentUpdate[];
  maxItems?: number;
  className?: string;
}

export function AgentLog({ updates, maxItems = 50, className }: AgentLogProps) {
  const displayedUpdates = updates.slice(-maxItems);
  const logRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new updates
  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [updates.length]);

  return (
    <div
      ref={logRef}
      className={cn(
        `
      scroll-area max-h-64 space-y-2 overflow-y-auto
    `,
        className
      )}
    >
      {displayedUpdates.map((update, index) => {
        const AgentIcon = agentIcons[update.agent as AgentType] || CodeBracketIcon;
        const StatusIcon = statusIcons[update.status as AgentStatus] || ArrowPathIcon;
        const isRunning = update.status === 'running';
        const isCompleted = update.status === 'completed';
        const isFailed = update.status === 'failed';

        return (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 rounded-md border p-3',
              isRunning && 'border-info/30 bg-info/5',
              isCompleted && 'border-success/30 bg-success/5',
              isFailed && 'border-danger/30 bg-danger/5',
              !isRunning &&
                !isCompleted &&
                !isFailed &&
                `
                border-border bg-secondary/50
              `
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isRunning && 'bg-info/10 text-info',
                isCompleted && 'bg-success/10 text-success',
                isFailed && 'bg-danger/10 text-danger',
                !isRunning &&
                  !isCompleted &&
                  !isFailed &&
                  `
                  bg-secondary text-text-secondary
                `
              )}
            >
              <AgentIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`
                  text-sm font-medium text-text-primary capitalize
                `}
                >
                  {update.agent} Agent
                </span>
                <StatusIcon
                  className={cn(
                    'h-3.5 w-3.5',
                    isRunning && 'animate-spin text-info',
                    isCompleted && 'text-success',
                    isFailed && 'text-danger'
                  )}
                />
              </div>
              <p className="text-sm text-text-secondary">{update.message}</p>
            </div>

            <span className="shrink-0 text-xs text-text-tertiary">
              {formatTime(update.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
