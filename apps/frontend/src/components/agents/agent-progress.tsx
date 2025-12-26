import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Progress } from '@/components/ui/progress';
import type { AgentType, AgentStatus } from '@/lib/guards';
import { AGENT_TYPE_LABELS } from '@/lib/guards';
import { cn } from '@/lib/utils';

interface AgentStep {
  type: AgentType;
  status: AgentStatus;
  progress: number;
}

interface AgentProgressProps {
  steps: AgentStep[];
  className?: string;
}

export function AgentProgress({ steps, className }: AgentProgressProps) {
  const totalProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">Overall Progress</span>
          <span className="text-text-secondary">{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} size="lg" />
      </div>

      {/* Step indicators */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-border" />

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isRunning = step.status === 'running';
            const isFailed = step.status === 'failed';
            const isPending = step.status === 'idle';

            return (
              <div key={step.type} className="relative flex items-start gap-4">
                {/* Step indicator */}
                <div
                  className={cn(
                    `
                      relative z-10 flex h-8 w-8 shrink-0 items-center
                      justify-center rounded-full border-2
                    `,
                    isCompleted && 'border-success bg-success text-white',
                    isRunning && 'border-info bg-info/10 text-info',
                    isFailed && 'border-danger bg-danger/10 text-danger',
                    isPending &&
                      `
                      border-border bg-background-2 text-text-tertiary
                    `
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : isRunning ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium',
                        isCompleted && 'text-success',
                        isRunning && 'text-text-primary',
                        isFailed && 'text-danger',
                        isPending && 'text-text-tertiary'
                      )}
                    >
                      {AGENT_TYPE_LABELS[step.type]}
                    </span>
                    {isRunning && (
                      <span className="text-xs text-text-secondary">{step.progress}%</span>
                    )}
                  </div>
                  {isRunning && (
                    <Progress
                      value={step.progress}
                      size="sm"
                      variant="info"
                      className={`
                      mt-2
                    `}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
