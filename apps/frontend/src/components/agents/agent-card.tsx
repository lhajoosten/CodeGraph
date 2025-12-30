import type { ComponentType } from 'react';
import { CodeBracketIcon, BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AgentStatusBadge } from './agent-status-badge';
import { CircularProgress } from '@/components/ui/progress';
import type { AgentType, AgentStatus } from '@/lib/guards';
import { cn } from '@/lib/utils';

const agentIcons: Record<AgentType, ComponentType<{ className?: string }>> = {
  planning: CodeBracketIcon,
  coding: CodeBracketIcon,
  testing: BeakerIcon,
  review: CheckCircleIcon,
};

const agentDescriptions: Record<AgentType, string> = {
  planning: 'Analyzes requirements and creates implementation plan',
  coding: 'Implements code changes based on the plan',
  testing: 'Generates and runs tests for the implementation',
  review: 'Reviews code quality and suggests improvements',
};

interface AgentCardProps {
  type: AgentType;
  status: AgentStatus;
  progress?: number;
  message?: string;
  className?: string;
}

export function AgentCard({ type, status, progress = 0, message, className }: AgentCardProps) {
  const Icon = agentIcons[type];
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isRunning && 'border-brand-cyan/50 ring-1 ring-brand-cyan/20',
        isCompleted && 'border-success/50',
        isFailed && 'border-error/50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isRunning && 'bg-brand-cyan/10 text-brand-cyan',
            isCompleted && 'bg-success/10 text-success',
            isFailed && 'bg-error/10 text-error',
            status === 'idle' && 'bg-bg-steel text-text-secondary-lum'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-text-primary font-semibold capitalize">{type} Agent</h3>
            <AgentStatusBadge status={status} size="sm" />
          </div>
          <p className="text-text-secondary-lum text-xs">{agentDescriptions[type]}</p>
        </div>

        {isRunning && <CircularProgress value={progress} size={36} variant="default" showValue />}
      </CardHeader>

      {message && (
        <CardContent className="pt-0">
          <p className="text-text-secondary text-sm">{message}</p>
        </CardContent>
      )}
    </Card>
  );
}
