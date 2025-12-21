import type { ComponentType } from 'react';
import { Brain, Code, TestTube, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AgentStatusBadge } from './agent-status-badge';
import { CircularProgress } from '@/components/ui/progress';
import type { AgentType, AgentStatus } from '@/lib/guards';
import { cn } from '@/lib/utils';

const agentIcons: Record<AgentType, ComponentType<{ className?: string }>> = {
  planning: Brain,
  coding: Code,
  testing: TestTube,
  review: CheckCircle,
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
        isRunning && 'border-info ring-1 ring-info/20',
        isCompleted && 'border-success/50',
        isFailed && 'border-danger/50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isRunning && 'bg-info/10 text-info',
            isCompleted && 'bg-success/10 text-success',
            isFailed && 'bg-danger/10 text-danger',
            status === 'idle' && 'bg-secondary text-text-secondary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary capitalize">{type} Agent</h3>
            <AgentStatusBadge status={status} size="sm" />
          </div>
          <p className="text-xs text-text-tertiary">{agentDescriptions[type]}</p>
        </div>

        {isRunning && <CircularProgress value={progress} size={36} variant="info" showValue />}
      </CardHeader>

      {message && (
        <CardContent className="pt-0">
          <p className="text-sm text-text-secondary">{message}</p>
        </CardContent>
      )}
    </Card>
  );
}
