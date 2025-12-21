import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, AGENT_CONFIG } from '@/lib/constants';

type EventSourceStatus = 'connecting' | 'open' | 'closed' | 'error';

interface UseEventSourceOptions<T> {
  url: string;
  onMessage?: (data: T) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
  withCredentials?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseEventSourceReturn<T> {
  status: EventSourceStatus;
  data: T | null;
  messages: T[];
  error: Event | null;
  reconnect: () => void;
  close: () => void;
}

/**
 * Hook for consuming Server-Sent Events (SSE).
 *
 * @param options - Configuration options for the event source
 * @returns Object with status, data, messages, and control functions
 *
 * @example
 * ```tsx
 * const { status, messages } = useEventSource<AgentUpdate>({
 *   url: `/api/v1/tasks/${taskId}/stream`,
 *   onMessage: (data) => console.log('Received:', data),
 * });
 * ```
 */
export function useEventSource<T = unknown>(
  options: UseEventSourceOptions<T>
): UseEventSourceReturn<T> {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    enabled = true,
    withCredentials = true,
    reconnectInterval = AGENT_CONFIG.SSE_RECONNECT_DELAY,
    maxReconnectAttempts = AGENT_CONFIG.MAX_RETRIES,
  } = options;

  const [status, setStatus] = useState<EventSourceStatus>('closed');
  const [data, setData] = useState<T | null>(null);
  const [messages, setMessages] = useState<T[]>([]);
  const [error, setError] = useState<Event | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();

    if (!enabled) return;

    setStatus('connecting');

    const eventSource = new EventSource(fullUrl, { withCredentials });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('open');
      setError(null);
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData: T = JSON.parse(event.data);
        setData(parsedData);
        setMessages((prev) => [...prev, parsedData]);
        onMessage?.(parsedData);
      } catch {
        console.error('Failed to parse SSE data:', event.data);
      }
    };

    eventSource.onerror = (event) => {
      setError(event);
      setStatus('error');
      onError?.(event);

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        setStatus('closed');
        onClose?.();
      }
    };
  }, [
    fullUrl,
    enabled,
    withCredentials,
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval,
    maxReconnectAttempts,
    cleanup,
  ]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const close = useCallback(() => {
    cleanup();
    setStatus('closed');
    onClose?.();
  }, [cleanup, onClose]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return cleanup;
  }, [enabled, connect, cleanup]);

  return {
    status,
    data,
    messages,
    error,
    reconnect,
    close,
  };
}

/**
 * Specialized hook for agent task streaming.
 */
export interface AgentUpdate {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function useAgentStream(taskId: number, enabled = true) {
  return useEventSource<AgentUpdate>({
    url: `/api/v1/tasks/${taskId}/stream`,
    enabled,
  });
}
