/**
 * Type guards and runtime type checking utilities
 */

// Generic type guards
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

// Array type guards
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(isNumber);
}

export function isNonEmptyArray<T>(value: T[] | undefined | null): value is [T, ...T[]] {
  return isArray(value) && value.length > 0;
}

// Error type guards
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isErrorWithMessage(value: unknown): value is { message: string } {
  return isObject(value) && 'message' in value && isString(value.message);
}

// API response type guards
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function isApiError(value: unknown): value is ApiError {
  return isObject(value) && 'message' in value && isString(value.message);
}

// Task type definitions and guards
export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'in_progress'
  | 'testing'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TASK_STATUSES: TaskStatus[] = [
  'pending',
  'planning',
  'in_progress',
  'testing',
  'reviewing',
  'completed',
  'failed',
  'cancelled',
];

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return isString(value) && TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return isString(value) && TASK_PRIORITIES.includes(value as TaskPriority);
}

// Labels for display
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  planning: 'Planning',
  in_progress: 'In Progress',
  testing: 'Testing',
  reviewing: 'Reviewing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Status/Priority badge variants
export const TASK_STATUS_VARIANTS: Record<
  TaskStatus,
  'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
> = {
  pending: 'secondary',
  planning: 'info',
  in_progress: 'warning',
  testing: 'info',
  reviewing: 'info',
  completed: 'success',
  failed: 'danger',
  cancelled: 'secondary',
};

export const TASK_PRIORITY_VARIANTS: Record<
  TaskPriority,
  'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'danger',
};

// Agent type definitions
export type AgentType = 'planning' | 'coding' | 'testing' | 'review';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export const AGENT_TYPES: AgentType[] = ['planning', 'coding', 'testing', 'review'];
export const AGENT_STATUSES: AgentStatus[] = ['idle', 'running', 'completed', 'failed'];

export function isAgentType(value: unknown): value is AgentType {
  return isString(value) && AGENT_TYPES.includes(value as AgentType);
}

export function isAgentStatus(value: unknown): value is AgentStatus {
  return isString(value) && AGENT_STATUSES.includes(value as AgentStatus);
}

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  planning: 'Planning Agent',
  coding: 'Coding Agent',
  testing: 'Testing Agent',
  review: 'Review Agent',
};

export const AGENT_STATUS_VARIANTS: Record<
  AgentStatus,
  'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
> = {
  idle: 'secondary',
  running: 'info',
  completed: 'success',
  failed: 'danger',
};

// Assertion utilities
export function assertNever(value: never, message?: string): never {
  throw new Error(message || `Unexpected value: ${value}`);
}

export function assertDefined<T>(
  value: T | undefined | null,
  message = 'Value is undefined or null'
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}
