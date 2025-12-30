/**
 * Main task execution panel component.
 *
 * Combines execution controls, timeline, and output display.
 * Orchestrates the task execution UI and state management.
 */

import { useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TaskExecutionControls } from './task-execution-controls';
import { TaskExecutionOutput } from './task-execution-output';
import { TaskExecutionTimeline } from './task-execution-timeline';
import { useExecutionStore } from '@/stores/execution-store.ts';
import { useFetchTaskHistory } from '@/hooks/api/tasks/queries';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/openapi/types.gen';
import {
  PlayIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface TaskExecutionPanelProps {
  taskId: number;
  taskStatus: TaskStatus;
  className?: string;
}

export function TaskExecutionPanel({ taskId, taskStatus, className }: TaskExecutionPanelProps) {
  const { isExecuting, reset, logs } = useExecutionStore();

  // Fetch execution history
  const { data: history, isLoading: historyLoading } = useFetchTaskHistory(taskId, {
    enabled: taskStatus === 'completed' || taskStatus === 'failed',
  });

  // Reset execution store when task changes
  useEffect(() => {
    return () => reset();
  }, [taskId, reset]);

  const historyCount = (history as { runs?: unknown[] })?.runs?.length || 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Execution Controls Card */}
      <Card className="border-accent-top shadow-card transition-shadow hover:shadow-card-hover">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-gradient-teal flex h-10 w-10 items-center justify-center rounded-lg shadow-button">
                  <PlayIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Task Execution</h2>
              </div>
              <p className="text-sm text-text-secondary">
                Execute AI agents to work on this task autonomously
              </p>
            </div>
            <TaskExecutionControls taskId={taskId} taskStatus={taskStatus} />
          </div>
        </CardHeader>
      </Card>

      {/* Execution UI Tabs */}
      <Card className="overflow-hidden shadow-card">
        <Tabs defaultValue="output" className="w-full">
          <div className="border-b border-border-primary bg-surface-secondary/50">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-none bg-transparent p-2">
              <TabsTrigger
                value="output"
                className={cn(
                  'relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  'data-[state=active]:bg-surface data-[state=active]:text-brand-teal data-[state=active]:shadow-sm',
                  'hover:bg-surface/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="h-4 w-4" />
                  <span>Output</span>
                  {isExecuting && (
                    <div className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    'bg-gradient-teal absolute right-0 bottom-0 left-0 h-0.5 opacity-0 transition-opacity',
                    'data-[state=active]:opacity-100'
                  )}
                  data-state={isExecuting ? 'active' : 'inactive'}
                />
              </TabsTrigger>

              <TabsTrigger
                value="timeline"
                className={cn(
                  'relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  'data-[state=active]:bg-surface data-[state=active]:text-brand-teal data-[state=active]:shadow-sm',
                  'hover:bg-surface/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Timeline</span>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="logs"
                className={cn(
                  'relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  'data-[state=active]:bg-surface data-[state=active]:text-brand-teal data-[state=active]:shadow-sm',
                  'hover:bg-surface/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Logs</span>
                  {logs.length > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-1">
                      {logs.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className={cn(
                  'relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  'data-[state=active]:bg-surface data-[state=active]:text-brand-teal data-[state=active]:shadow-sm',
                  'hover:bg-surface/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>History</span>
                  {historyCount > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-1">
                      {historyCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Output Tab */}
          <TabsContent value="output" className="m-0 p-4">
            <TaskExecutionOutput taskId={taskId} isExecuting={isExecuting} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="m-0 p-4">
            <TaskExecutionTimeline />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="m-0 p-4">
            {logs.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-secondary bg-surface-secondary/30 p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle">
                  <DocumentTextIcon className="h-8 w-8 text-brand-teal" />
                </div>
                <p className="mb-1 text-sm font-medium text-text-primary">No logs yet</p>
                <p className="text-sm text-text-muted">
                  Start execution to see real-time agent logs
                </p>
              </div>
            ) : (
              <div className="scroll-area max-h-[600px] space-y-3 overflow-y-auto pr-2">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={cn(
                      'hc-skel-item group relative overflow-hidden rounded-lg border p-4 transition-all',
                      log.type === 'error' && 'border-error/30 bg-error-bg',
                      log.type === 'warning' && 'border-warning/30 bg-warning-bg',
                      log.type === 'success' && 'border-success/30 bg-success-bg',
                      log.type === 'info' && 'border-border bg-surface-secondary/50',
                      'hover:shadow-md'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Accent line */}
                    <div
                      className={cn(
                        'absolute top-0 left-0 h-full w-1',
                        log.type === 'error' && 'bg-error',
                        log.type === 'warning' && 'bg-warning',
                        log.type === 'success' && 'bg-success',
                        log.type === 'info' && 'bg-brand-teal'
                      )}
                    />

                    <div className="ml-3 min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {log.agent && (
                          <Badge
                            variant="default"
                            size="sm"
                            className="bg-gradient-teal text-white shadow-button"
                          >
                            <CpuChipIcon className="mr-1 h-3 w-3" />
                            {log.agent}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-text-primary">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="m-0 p-4">
            {historyLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-subtle border-t-brand-teal" />
                  <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-4 border-brand-teal opacity-20" />
                </div>
              </div>
            ) : !history || historyCount === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-secondary bg-surface-secondary/30 p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle">
                  <ChartBarIcon className="h-8 w-8 text-brand-teal" />
                </div>
                <p className="mb-1 text-sm font-medium text-text-primary">No execution history</p>
                <p className="text-sm text-text-muted">Completed executions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(
                  (
                    history as {
                      runs: Array<{
                        id: number;
                        agent_type: string;
                        status: string;
                        tokens_used?: number;
                        total_latency_ms?: number;
                        cost_usd?: number;
                        completed_at?: string;
                      }>;
                    }
                  ).runs || []
                ).map((run, index) => (
                  <div
                    key={run.id}
                    className={cn(
                      'hc-skel-item group relative overflow-hidden rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand-teal/30 hover:shadow-card-hover'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status indicator line */}
                    <div
                      className={cn(
                        'absolute top-0 left-0 h-full w-1 transition-all',
                        run.status === 'completed' && 'bg-success',
                        run.status === 'failed' && 'bg-error',
                        run.status === 'running' && 'bg-brand-teal',
                        'group-hover:w-1.5'
                      )}
                    />

                    <div className="ml-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      {/* Left side - Agent info and status */}
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-text-primary capitalize">
                            {run.agent_type}
                          </span>
                          <Badge
                            variant={
                              run.status === 'completed'
                                ? 'success'
                                : run.status === 'failed'
                                  ? 'danger'
                                  : 'default'
                            }
                            size="sm"
                            dot
                          >
                            {run.status}
                          </Badge>
                        </div>

                        {/* Metrics */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                              />
                            </svg>
                            <span className="font-medium">
                              {run.tokens_used?.toLocaleString() || 0} tokens
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span className="font-medium">{run.total_latency_ms || 0}ms</span>
                          </div>
                          {run.cost_usd !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-medium">${run.cost_usd.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Timestamp */}
                      {run.completed_at && (
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(run.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

// Additional icon import for history tab
import { CalendarIcon } from '@heroicons/react/24/outline';
