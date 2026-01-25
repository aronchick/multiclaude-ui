/**
 * Zod schemas for runtime validation of multiclaude data structures.
 */

import { z } from 'zod';

// Enums as Zod schemas
export const AgentTypeSchema = z.enum([
  'supervisor',
  'worker',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'review',
  'generic-persistent',
]);

export const TaskStatusSchema = z.enum([
  'open',
  'merged',
  'closed',
  'no-pr',
  'failed',
  'unknown',
]);

export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

export const MessageStatusSchema = z.enum(['pending', 'delivered', 'read', 'acknowledged']);

// Agent schema
export const AgentSchema = z.object({
  type: AgentTypeSchema,
  worktree_path: z.string(),
  tmux_window: z.string(),
  session_id: z.string(),
  pid: z.number(),
  task: z.string().optional(),
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string(),
  last_nudge: z.string().optional(),
  ready_for_cleanup: z.boolean().optional(),
});

// Task history entry schema
export const TaskHistoryEntrySchema = z.object({
  name: z.string(),
  task: z.string(),
  branch: z.string(),
  pr_url: z.string().optional(),
  pr_number: z.number().optional(),
  status: TaskStatusSchema,
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string(),
  completed_at: z.string().optional(),
});

// Config schemas
export const MergeQueueConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

export const PRShepherdConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

export const ForkConfigSchema = z.object({
  is_fork: z.boolean(),
  upstream_url: z.string().optional(),
  upstream_owner: z.string().optional(),
  upstream_repo: z.string().optional(),
  force_fork_mode: z.boolean().optional(),
});

// Repository schema
export const RepositorySchema = z.object({
  github_url: z.string(),
  tmux_session: z.string(),
  agents: z.record(z.string(), AgentSchema),
  task_history: z.array(TaskHistoryEntrySchema).optional(),
  merge_queue_config: MergeQueueConfigSchema.optional(),
  pr_shepherd_config: PRShepherdConfigSchema.optional(),
  fork_config: ForkConfigSchema.optional(),
  target_branch: z.string().optional(),
});

// Root daemon state schema
export const DaemonStateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

// Message schema
export const AgentMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  timestamp: z.string(),
  body: z.string(),
  status: MessageStatusSchema,
});

// Socket API schemas
export const SocketRequestSchema = z.object({
  command: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const SocketResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

/**
 * Parse and validate daemon state from JSON
 * @throws {z.ZodError} if validation fails
 */
export function parseDaemonState(data: unknown) {
  return DaemonStateSchema.parse(data);
}

/**
 * Parse and validate an agent message from JSON
 * @throws {z.ZodError} if validation fails
 */
export function parseAgentMessage(data: unknown) {
  return AgentMessageSchema.parse(data);
}

/**
 * Safely parse daemon state, returning null on failure
 */
export function safeParseDaemonState(data: unknown) {
  const result = DaemonStateSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse agent message, returning null on failure
 */
export function safeParseAgentMessage(data: unknown) {
  const result = AgentMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
