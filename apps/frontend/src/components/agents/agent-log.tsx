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
              isRunning && 'border-brand-cyan/30 bg-brand-cyan/5',
              isCompleted && 'border-success/30 bg-success/5',
              isFailed && 'border-error/30 bg-error/5',
              !isRunning &&
                !isCompleted &&
                !isFailed &&
                `
                border-border-steel bg-bg-elevated-lum/50
              `
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isRunning && 'bg-brand-cyan/10 text-brand-cyan',
                isCompleted && 'bg-success/10 text-success',
                isFailed && 'bg-error/10 text-error',
                !isRunning &&
                  !isCompleted &&
                  !isFailed &&
                  `
                  bg-bg-elevated-lum text-text-secondary-lum
                `
              )}
            >
              <AgentIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`
                  text-text-primary-lum text-sm font-medium capitalize
                `}
                >
                  {update.agent} Agent
                </span>
                <StatusIcon
                  className={cn(
                    'h-3.5 w-3.5',
                    isRunning && 'animate-spin text-brand-cyan',
                    isCompleted && 'text-success',
                    isFailed && 'text-error'
                  )}
                />
              </div>
              <p className="text-text-secondary-lum text-sm">{update.message}</p>
            </div>

            <span className="text-text-secondary-lum shrink-0 text-xs">
              {formatTime(update.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
