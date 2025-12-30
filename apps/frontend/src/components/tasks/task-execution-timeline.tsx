/**
 * Visual timeline showing agent execution progress.
 *
 * Displays the workflow stages with current progress and completion status.
 */

import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/solid';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useExecutionStore } from '@/stores/execution-store.ts';
import { cn } from '@/lib/utils';
import type { AgentType } from '@/hooks/api/tasks/mutations';

interface TaskExecutionTimelineProps {
  className?: string;
}

const agents: { type: AgentType; label: string; description: string }[] = [
  {
    type: 'planner',
    label: 'Planner',
    description: 'Analyzing task and creating execution plan',
  },
  {
    type: 'coder',
    label: 'Coder',
    description: 'Generating code from plan',
  },
  {
    type: 'tester',
    label: 'Tester',
    description: 'Creating test suite',
  },
  {
    type: 'reviewer',
    label: 'Reviewer',
    description: 'Reviewing code quality',
  },
];

export function TaskExecutionTimeline({ className }: TaskExecutionTimelineProps) {
  const { agentProgress, currentAgent } = useExecutionStore();

  const getStatusIcon = (type: AgentType) => {
    const status = agentProgress[type];
    const isCurrent = currentAgent === type;

    if (status === 'completed') {
      return <CheckCircleIcon className="h-6 w-6 text-success" />;
    }
    if (status === 'failed') {
      return <ExclamationCircleIcon className="h-6 w-6 text-danger" />;
    }
    if (status === 'running' || isCurrent) {
      return <PlayCircleIcon className="h-6 w-6 animate-pulse text-primary" />;
    }
    return <ClockIcon className="text-muted-foreground h-6 w-6" />;
  };

  const getStatusColor = (type: AgentType) => {
    const status = agentProgress[type];
    const isCurrent = currentAgent === type;

    if (status === 'completed') return 'border-success bg-success/10';
    if (status === 'failed') return 'border-danger bg-danger/10';
    if (status === 'running' || isCurrent) return 'border-primary bg-primary/10';
    return 'border-muted bg-muted/30';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-sm font-medium">Execution Timeline</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, index) => {
            const status = agentProgress[agent.type];
            const isCurrent = currentAgent === agent.type;
            const isLast = index === agents.length - 1;

            return (
              <div key={agent.type} className="relative">
                {/* Timeline connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute top-8 left-3 h-full w-0.5',
                      status === 'completed'
                        ? 'bg-success'
                        : status === 'failed'
                          ? 'bg-danger'
                          : 'bg-muted'
                    )}
                  />
                )}

                {/* Agent step */}
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-all',
                    getStatusColor(agent.type),
                    isCurrent && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="shrink-0">{getStatusIcon(agent.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{agent.label}</h4>
                      {status === 'running' && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                          Running
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
                          Completed
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
                          Failed
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{agent.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
