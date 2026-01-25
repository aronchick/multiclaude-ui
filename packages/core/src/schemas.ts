/**
 * Zod schemas for runtime validation of multiclaude state
 *
 * These schemas validate JSON data from state.json and socket API responses.
 */

import { z } from 'zod';

/**
 * Agent type enum
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
 * Track mode enum
 */
export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

/**
 * Task status enum
 */
export const TaskStatusSchema = z.enum(['open', 'merged', 'closed', 'no-pr', 'failed', 'unknown']);

/**
 * Merge queue configuration
 */
export const MergeQueueConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/**
 * PR shepherd configuration
 */
export const PRShepherdConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/**
 * Fork configuration
 */
export const ForkConfigSchema = z.object({
  is_fork: z.boolean(),
  upstream_url: z.string().optional(),
  upstream_owner: z.string().optional(),
  upstream_repo: z.string().optional(),
  force_fork_mode: z.boolean().optional(),
});

/**
 * Task history entry
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
 * Agent state
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
 * Repository state
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
 * Complete daemon state
 */
export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

/**
 * Socket API response
 */
export const SocketResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

/**
 * Daemon status response
 */
export const DaemonStatusSchema = z.object({
  running: z.boolean(),
  pid: z.number(),
  repos: z.number(),
  agents: z.number(),
  socket_path: z.string(),
});

/**
 * Parse state JSON with validation
 * @throws {ZodError} if validation fails
 */
export function parseState(json: unknown) {
  return StateSchema.parse(json);
}

/**
 * Safely parse state JSON, returning null on failure
 */
export function safeParseState(json: unknown) {
  const result = StateSchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Parse socket response with validation
 * @throws {ZodError} if validation fails
 */
export function parseSocketResponse(json: unknown) {
  return SocketResponseSchema.parse(json);
}

// Export inferred types for convenience
export type AgentTypeZ = z.infer<typeof AgentTypeSchema>;
export type TrackModeZ = z.infer<typeof TrackModeSchema>;
export type TaskStatusZ = z.infer<typeof TaskStatusSchema>;
export type MergeQueueConfigZ = z.infer<typeof MergeQueueConfigSchema>;
export type PRShepherdConfigZ = z.infer<typeof PRShepherdConfigSchema>;
export type ForkConfigZ = z.infer<typeof ForkConfigSchema>;
export type TaskHistoryEntryZ = z.infer<typeof TaskHistoryEntrySchema>;
export type AgentZ = z.infer<typeof AgentSchema>;
export type RepositoryZ = z.infer<typeof RepositorySchema>;
export type StateZ = z.infer<typeof StateSchema>;
