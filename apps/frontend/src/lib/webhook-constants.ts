/**
 * Webhook-related constants and type definitions
 */

import type { WebhookStatus, DeliveryStatus } from '@/openapi/types.gen';

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Task events
  TASK_CREATED: 'task.created',
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  TASK_CANCELLED: 'task.cancelled',

  // Agent events
  AGENT_STARTED: 'agent.started',
  AGENT_COMPLETED: 'agent.completed',
  AGENT_FAILED: 'agent.failed',

  // Workflow events
  WORKFLOW_PLANNING_COMPLETED: 'workflow.planning_completed',
  WORKFLOW_CODING_COMPLETED: 'workflow.coding_completed',
  WORKFLOW_TESTING_COMPLETED: 'workflow.testing_completed',
  WORKFLOW_REVIEW_COMPLETED: 'workflow.review_completed',
  WORKFLOW_REVIEW_APPROVED: 'workflow.review_approved',
  WORKFLOW_REVIEW_REJECTED: 'workflow.review_rejected',
  WORKFLOW_REVIEW_REVISION_REQUESTED: 'workflow.review_revision_requested',
  WORKFLOW_ITERATION_STARTED: 'workflow.iteration_started',
  WORKFLOW_MAX_ITERATIONS_REACHED: 'workflow.max_iterations_reached',
} as const;

export const WEBHOOK_EVENT_GROUPS = {
  task: [
    WEBHOOK_EVENTS.TASK_CREATED,
    WEBHOOK_EVENTS.TASK_STARTED,
    WEBHOOK_EVENTS.TASK_COMPLETED,
    WEBHOOK_EVENTS.TASK_FAILED,
    WEBHOOK_EVENTS.TASK_CANCELLED,
  ],
  agent: [
    WEBHOOK_EVENTS.AGENT_STARTED,
    WEBHOOK_EVENTS.AGENT_COMPLETED,
    WEBHOOK_EVENTS.AGENT_FAILED,
  ],
  workflow: [
    WEBHOOK_EVENTS.WORKFLOW_PLANNING_COMPLETED,
    WEBHOOK_EVENTS.WORKFLOW_CODING_COMPLETED,
    WEBHOOK_EVENTS.WORKFLOW_TESTING_COMPLETED,
    WEBHOOK_EVENTS.WORKFLOW_REVIEW_COMPLETED,
    WEBHOOK_EVENTS.WORKFLOW_REVIEW_APPROVED,
    WEBHOOK_EVENTS.WORKFLOW_REVIEW_REJECTED,
    WEBHOOK_EVENTS.WORKFLOW_REVIEW_REVISION_REQUESTED,
    WEBHOOK_EVENTS.WORKFLOW_ITERATION_STARTED,
    WEBHOOK_EVENTS.WORKFLOW_MAX_ITERATIONS_REACHED,
  ],
} as const;

// All events array
export const ALL_WEBHOOK_EVENTS = Object.values(WEBHOOK_EVENTS);

// Labels for webhook statuses
export const WEBHOOK_STATUS_LABELS: Record<WebhookStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  disabled: 'Disabled',
};

// Badge variants for webhook statuses
export const WEBHOOK_STATUS_VARIANTS: Record<
  WebhookStatus,
  'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
> = {
  active: 'success',
  paused: 'warning',
  disabled: 'secondary',
};

// Labels for delivery statuses
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  success: 'Success',
  failed: 'Failed',
  retrying: 'Retrying',
};

// Badge variants for delivery statuses
export const DELIVERY_STATUS_VARIANTS: Record<
  DeliveryStatus,
  'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
> = {
  pending: 'secondary',
  success: 'success',
  failed: 'danger',
  retrying: 'warning',
};

// Event labels for display
export const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  [WEBHOOK_EVENTS.TASK_CREATED]: 'Task Created',
  [WEBHOOK_EVENTS.TASK_STARTED]: 'Task Started',
  [WEBHOOK_EVENTS.TASK_COMPLETED]: 'Task Completed',
  [WEBHOOK_EVENTS.TASK_FAILED]: 'Task Failed',
  [WEBHOOK_EVENTS.TASK_CANCELLED]: 'Task Cancelled',
  [WEBHOOK_EVENTS.AGENT_STARTED]: 'Agent Started',
  [WEBHOOK_EVENTS.AGENT_COMPLETED]: 'Agent Completed',
  [WEBHOOK_EVENTS.AGENT_FAILED]: 'Agent Failed',
  [WEBHOOK_EVENTS.WORKFLOW_PLANNING_COMPLETED]: 'Planning Completed',
  [WEBHOOK_EVENTS.WORKFLOW_CODING_COMPLETED]: 'Coding Completed',
  [WEBHOOK_EVENTS.WORKFLOW_TESTING_COMPLETED]: 'Testing Completed',
  [WEBHOOK_EVENTS.WORKFLOW_REVIEW_COMPLETED]: 'Review Completed',
  [WEBHOOK_EVENTS.WORKFLOW_REVIEW_APPROVED]: 'Review Approved',
  [WEBHOOK_EVENTS.WORKFLOW_REVIEW_REJECTED]: 'Review Rejected',
  [WEBHOOK_EVENTS.WORKFLOW_REVIEW_REVISION_REQUESTED]: 'Revision Requested',
  [WEBHOOK_EVENTS.WORKFLOW_ITERATION_STARTED]: 'Iteration Started',
  [WEBHOOK_EVENTS.WORKFLOW_MAX_ITERATIONS_REACHED]: 'Max Iterations Reached',
};
