/**
 * Main task execution panel component.
 *
 * Combines execution controls, timeline, and output display.
 * Orchestrates the task execution UI and state management.
 */

import { useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskExecutionControls } from './task-execution-controls';
import { TaskExecutionOutput } from './task-execution-output';
import { TaskExecutionTimeline } from './task-execution-timeline';
import { useExecutionStore } from '@/stores/execution-store.ts';
import { useFetchTaskHistory } from '@/hooks/api/tasks/queries';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/openapi/types.gen';

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

  return (
    <div className={cn('space-y-4', className)}>
      {/* Execution Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Task Execution</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Execute AI agents to work on this task
              </p>
            </div>
            <TaskExecutionControls taskId={taskId} taskStatus={taskStatus} />
          </div>
        </CardHeader>
      </Card>

      {/* Execution UI Tabs */}
      <Tabs defaultValue="output" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="output" className="flex-1">
            Output
            {isExecuting && (
              <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">
            Logs
            {logs.length > 0 && (
              <span className="text-muted-foreground ml-2 text-xs">({logs.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            History
            {history && (
              <span className="text-muted-foreground ml-2 text-xs">
                ({(history as { runs?: unknown[] }).runs?.length || 0})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="mt-4">
          <TaskExecutionOutput taskId={taskId} isExecuting={isExecuting} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TaskExecutionTimeline />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium">Execution Logs</h3>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-muted-foreground flex h-[200px] items-center justify-center">
                  <p>No logs yet. Start execution to see logs.</p>
                </div>
              ) : (
                <div className="max-h-[500px] space-y-2 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'flex items-start gap-3 rounded-md border p-3 text-sm',
                        log.type === 'error' && 'border-danger bg-danger/10',
                        log.type === 'warning' && 'border-warning bg-warning/10',
                        log.type === 'success' && 'border-success bg-success/10',
                        log.type === 'info' && 'border-muted bg-muted/30'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {log.agent && (
                            <span className="text-xs font-medium text-primary uppercase">
                              {log.agent}
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium">Execution History</h3>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : !history ||
                !(history as { runs?: unknown[] }).runs ||
                (history as { runs?: unknown[] }).runs?.length === 0 ? (
                <div className="text-muted-foreground flex h-[200px] items-center justify-center">
                  <p>No execution history yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
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
                  ).map((run) => (
                    <div
                      key={run.id}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">{run.agent_type}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              run.status === 'completed' && 'bg-success/20 text-success',
                              run.status === 'failed' && 'bg-danger/20 text-danger',
                              run.status === 'running' && 'bg-primary/20 text-primary'
                            )}
                          >
                            {run.status}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                          <span>Tokens: {run.tokens_used?.toLocaleString()}</span>
                          <span>Latency: {run.total_latency_ms}ms</span>
                          {run.cost_usd && <span>Cost: ${run.cost_usd.toFixed(4)}</span>}
                        </div>
                      </div>
                      {run.completed_at && (
                        <span className="text-muted-foreground text-xs">
                          {new Date(run.completed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
