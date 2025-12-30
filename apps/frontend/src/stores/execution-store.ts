/**
 * Zustand store for task execution state management.
 *
 * Manages the current execution state including:
 * - Active agent and workflow stage
 * - Streaming output from LLMs
 * - Execution logs and events
 * - Error states
 *
 * @example
 * const { currentAgent, streamingOutput, addLog } = useExecutionStore();
 */

import { create } from 'zustand';
import type { AgentStreamEvent, AgentType } from '@/hooks/api/tasks/mutations';

export interface ExecutionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  agent?: AgentType;
  message: string;
  data?: Record<string, unknown>;
}

interface ExecutionState {
  // Current execution state
  taskId: number | null;
  currentAgent: AgentType | null;
  currentStage: string | null;
  isExecuting: boolean;
  iteration: number;

  // Streaming data
  streamingOutput: string;
  llmChunks: string[];

  // Logs and events
  logs: ExecutionLog[];
  events: AgentStreamEvent[];

  // Error state
  error: string | null;

  // Progress tracking
  agentProgress: {
    planner: 'pending' | 'running' | 'completed' | 'failed';
    coder: 'pending' | 'running' | 'completed' | 'failed';
    tester: 'pending' | 'running' | 'completed' | 'failed';
    reviewer: 'pending' | 'running' | 'completed' | 'failed';
  };

  // Actions
  startExecution: (taskId: number) => void;
  stopExecution: () => void;
  setCurrentAgent: (agent: AgentType | null) => void;
  setCurrentStage: (stage: string | null) => void;
  appendStreamOutput: (chunk: string) => void;
  clearStreamOutput: () => void;
  addLog: (log: Omit<ExecutionLog, 'id'>) => void;
  addEvent: (event: AgentStreamEvent) => void;
  setError: (error: string | null) => void;
  setIteration: (iteration: number) => void;
  updateAgentProgress: (agent: AgentType, status: 'pending' | 'running' | 'completed' | 'failed') => void;
  reset: () => void;
}

const initialAgentProgress = {
  planner: 'pending' as const,
  coder: 'pending' as const,
  tester: 'pending' as const,
  reviewer: 'pending' as const,
};

export const useExecutionStore = create<ExecutionState>((set) => ({
  // Initial state
  taskId: null,
  currentAgent: null,
  currentStage: null,
  isExecuting: false,
  iteration: 0,
  streamingOutput: '',
  llmChunks: [],
  logs: [],
  events: [],
  error: null,
  agentProgress: initialAgentProgress,

  // Actions
  startExecution: (taskId) =>
    set({
      taskId,
      isExecuting: true,
      error: null,
      logs: [],
      events: [],
      streamingOutput: '',
      llmChunks: [],
      agentProgress: initialAgentProgress,
      iteration: 0,
    }),

  stopExecution: () =>
    set({
      isExecuting: false,
      currentAgent: null,
      currentStage: null,
    }),

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  setCurrentStage: (stage) => set({ currentStage: stage }),

  appendStreamOutput: (chunk) =>
    set((state) => ({
      streamingOutput: state.streamingOutput + chunk,
      llmChunks: [...state.llmChunks, chunk],
    })),

  clearStreamOutput: () =>
    set({
      streamingOutput: '',
      llmChunks: [],
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...log,
          id: `${Date.now()}-${Math.random()}`,
        },
      ],
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  setError: (error) => set({ error }),

  setIteration: (iteration) => set({ iteration }),

  updateAgentProgress: (agent, status) =>
    set((state) => ({
      agentProgress: {
        ...state.agentProgress,
        [agent]: status,
      },
    })),

  reset: () =>
    set({
      taskId: null,
      currentAgent: null,
      currentStage: null,
      isExecuting: false,
      iteration: 0,
      streamingOutput: '',
      llmChunks: [],
      logs: [],
      events: [],
      error: null,
      agentProgress: initialAgentProgress,
    }),
}));
