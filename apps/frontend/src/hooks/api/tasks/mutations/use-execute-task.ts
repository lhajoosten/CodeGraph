/**
 * Execute a task with SSE streaming support.
 *
 * Streams real-time updates from agent workflow execution.
 * Use with useEventSource hook for consuming the SSE stream.
 *
 * @returns Hook for initiating task execution
 *
 * @example
 * const { execute, isExecuting } = useExecuteTask(taskId);
 * const { messages, status } = useEventSource({
 *   url: `/api/v1/tasks/${taskId}/execute`,
 *   enabled: isExecuting,
 * });
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/constants';
import { taskQueryKeys } from '../keys';
import { addToast } from '@/lib/toast';

export interface AgentStreamEvent {
  event_type: StreamEventType;
  agent_type?: AgentType;
  data: Record<string, unknown>;
  timestamp: string;
}

export type StreamEventType =
  | 'workflow_start'
  | 'workflow_complete'
  | 'workflow_error'
  | 'node_start'
  | 'node_end'
  | 'llm_start'
  | 'llm_stream'
  | 'llm_end'
  | 'tool_start'
  | 'tool_end'
  | 'status_update'
  | 'iteration_update';

export type AgentType = 'planner' | 'coder' | 'tester' | 'reviewer';

export interface UseExecuteTaskReturn {
  execute: () => void;
  cancel: () => void;
  isExecuting: boolean;
  error: Error | null;
}

export function useExecuteTask(taskId: number): UseExecuteTaskReturn {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const execute = useCallback(() => {
    if (isExecuting) return;

    setIsExecuting(true);
    setError(null);

    const url = `${API_BASE_URL}/api/v1/tasks/${taskId}/execute`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      addToast({
        title: 'Execution Started',
        description: 'Agent workflow execution has started',
        color: 'info',
      });
    };

    es.onmessage = (event) => {
      try {
        const data: AgentStreamEvent = JSON.parse(event.data);

        // Handle workflow completion
        if (data.event_type === 'workflow_complete') {
          addToast({
            title: 'Execution Complete',
            description: 'Task execution completed successfully',
            color: 'success',
          });
          es.close();
          setIsExecuting(false);
          // Invalidate task queries to refresh data
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) });
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.execution(taskId) });
        }

        // Handle errors
        if (data.event_type === 'workflow_error') {
          const errorMessage = (data.data.error as string) || 'Execution failed';
          addToast({
            title: 'Execution Failed',
            description: errorMessage,
            color: 'danger',
          });
          es.close();
          setIsExecuting(false);
          setError(new Error(errorMessage));
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) });
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError(new Error('Connection error'));
      addToast({
        title: 'Connection Error',
        description: 'Lost connection to server. Please try again.',
        color: 'danger',
      });
      es.close();
      setIsExecuting(false);
    };

    setEventSource(es);
  }, [taskId, isExecuting, queryClient]);

  const cancel = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsExecuting(false);
  }, [eventSource]);

  return {
    execute,
    cancel,
    isExecuting,
    error,
  };
}
