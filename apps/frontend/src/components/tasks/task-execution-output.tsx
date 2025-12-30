/**
 * Displays streaming output from task execution.
 *
 * Shows real-time LLM output and agent logs with syntax highlighting
 * and collapsible sections.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExecutionStore } from '@/stores/execution-store.ts';
import { useEventSource } from '@/hooks/common/use-event-source';
import type { AgentStreamEvent } from '@/hooks/api/tasks/mutations';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';

interface TaskExecutionOutputProps {
  taskId: number;
  isExecuting: boolean;
  className?: string;
}

export function TaskExecutionOutput({ taskId, isExecuting, className }: TaskExecutionOutputProps) {
  const {
    streamingOutput,
    appendStreamOutput,
    clearStreamOutput,
    addLog,
    setCurrentAgent,
    updateAgentProgress,
  } = useExecutionStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);

  // Use SSE for streaming output
  const { status, messages } = useEventSource<AgentStreamEvent>({
    url: `${API_BASE_URL}/api/v1/tasks/${taskId}/execute`,
    enabled: isExecuting,
    onMessage: (event) => {
      // Handle different event types
      switch (event.event_type) {
        case 'node_start':
          if (event.agent_type) {
            setCurrentAgent(event.agent_type);
            updateAgentProgress(event.agent_type, 'running');
            addLog({
              timestamp: event.timestamp,
              type: 'info',
              agent: event.agent_type,
              message: `${event.agent_type} agent started`,
            });
          }
          break;

        case 'node_end':
          if (event.agent_type) {
            updateAgentProgress(event.agent_type, 'completed');
            addLog({
              timestamp: event.timestamp,
              type: 'success',
              agent: event.agent_type,
              message: `${event.agent_type} agent completed`,
            });
          }
          break;

        case 'llm_stream':
          if (event.data.token) {
            appendStreamOutput(event.data.token as string);
          }
          break;

        case 'status_update':
          addLog({
            timestamp: event.timestamp,
            type: 'info',
            message: `Status: ${event.data.old_status} → ${event.data.new_status}`,
          });
          break;

        case 'workflow_error':
          addLog({
            timestamp: event.timestamp,
            type: 'error',
            message: (event.data.error as string) || 'Workflow error occurred',
          });
          break;
      }
    },
  });

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current && isExpanded) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamingOutput, isExpanded]);

  // Clear output when execution starts
  useEffect(() => {
    if (isExecuting) {
      clearStreamOutput();
    }
  }, [isExecuting, clearStreamOutput]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Output</h3>
          {isExecuting && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Streaming...</span>
            </div>
          )}
          {status === 'error' && <span className="text-xs text-danger">Connection error</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div
            ref={outputRef}
            className={cn(
              'max-h-[600px] min-h-[300px] overflow-y-auto',
              'rounded-md border bg-muted/30 p-4',
              'font-mono text-sm'
            )}
          >
            {streamingOutput ? (
              <pre className="break-words whitespace-pre-wrap">{streamingOutput}</pre>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {isExecuting ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p>Waiting for output...</p>
                  </div>
                ) : (
                  <p>No output yet. Click Execute to start.</p>
                )}
              </div>
            )}
          </div>

          {/* Message count indicator */}
          {messages.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {messages.length} event{messages.length !== 1 ? 's' : ''} received
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
