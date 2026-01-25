/**
 * Zod schemas for runtime validation of multiclaude state and API responses.
 *
 * These schemas validate data read from state.json or received from the socket API,
 * providing type-safe parsing with helpful error messages.
 */

import { z } from 'zod';

/**
 * Agent type enum schema.
 */
export const AgentTypeSchema = z.enum([
  'supervisor',
  'worker',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'review',
  'generic-persistent',
]);

/**
 * Track mode enum schema.
 */
export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

/**
 * Task status enum schema.
 */
export const TaskStatusSchema = z.enum(['open', 'merged', 'closed', 'no-pr', 'failed', 'unknown']);

/**
 * Merge queue configuration schema.
 */
export const MergeQueueConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/**
 * PR shepherd configuration schema.
 */
export const PRShepherdConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/**
 * Fork configuration schema.
 */
export const ForkConfigSchema = z.object({
  is_fork: z.boolean(),
  upstream_url: z.string().optional(),
  upstream_owner: z.string().optional(),
  upstream_repo: z.string().optional(),
  force_fork_mode: z.boolean().optional(),
});

/**
 * Task history entry schema.
 */
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

/**
 * Agent schema.
 */
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

/**
 * Repository schema.
 */
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

/**
 * State schema (root).
 */
export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

/**
 * Socket response schema (generic).
 */
export const SocketResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

/**
 * Daemon status response schema.
 */
export const DaemonStatusSchema = z.object({
  running: z.boolean(),
  pid: z.number(),
  repos: z.number(),
  agents: z.number(),
  socket_path: z.string(),
});

/**
 * Parse and validate state data, throwing on invalid input.
 */
export function parseState(data: unknown) {
  return StateSchema.parse(data);
}

/**
 * Safely parse state data, returning null on invalid input.
 */
export function safeParseState(data: unknown) {
  const result = StateSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Parse and validate a repository, throwing on invalid input.
 */
export function parseRepository(data: unknown) {
  return RepositorySchema.parse(data);
}

/**
 * Parse and validate an agent, throwing on invalid input.
 */
export function parseAgent(data: unknown) {
  return AgentSchema.parse(data);
}

/**
 * Parse and validate a socket response, throwing on invalid input.
 */
export function parseSocketResponse(data: unknown) {
  return SocketResponseSchema.parse(data);
}

/**
 * Parse and validate daemon status, throwing on invalid input.
 */
export function parseDaemonStatus(data: unknown) {
  return DaemonStatusSchema.parse(data);
}

// Re-export inferred types for convenience
export type AgentType = z.infer<typeof AgentTypeSchema>;
export type TrackMode = z.infer<typeof TrackModeSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type MergeQueueConfig = z.infer<typeof MergeQueueConfigSchema>;
export type PRShepherdConfig = z.infer<typeof PRShepherdConfigSchema>;
export type ForkConfig = z.infer<typeof ForkConfigSchema>;
export type TaskHistoryEntry = z.infer<typeof TaskHistoryEntrySchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type State = z.infer<typeof StateSchema>;
export type DaemonStatus = z.infer<typeof DaemonStatusSchema>;
