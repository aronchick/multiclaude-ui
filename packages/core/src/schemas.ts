/**
 * Zod schemas for runtime validation of multiclaude state data
 */

import { z } from 'zod';

/** Agent type schema */
export const AgentTypeSchema = z.enum([
  'supervisor',
  'worker',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'review',
  'generic-persistent',
]);

/** Track mode schema */
export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

/** Task status schema */
export const TaskStatusSchema = z.enum(['open', 'merged', 'closed', 'no-pr', 'failed', 'unknown']);

/** Merge queue config schema */
export const MergeQueueConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/** PR shepherd config schema */
export const PRShepherdConfigSchema = z.object({
  enabled: z.boolean(),
  track_mode: TrackModeSchema,
});

/** Fork config schema */
export const ForkConfigSchema = z.object({
  is_fork: z.boolean(),
  upstream_url: z.string().optional(),
  upstream_owner: z.string().optional(),
  upstream_repo: z.string().optional(),
  force_fork_mode: z.boolean().optional(),
});

/** Task history entry schema */
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

/** Agent schema */
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

/** Repository schema */
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

/** State schema */
export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

/** Socket request schema */
export const SocketRequestSchema = z.object({
  command: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

/** Socket response schema */
export const SocketResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

/** Daemon status schema */
export const DaemonStatusSchema = z.object({
  running: z.boolean(),
  pid: z.number(),
  repos: z.number(),
  agents: z.number(),
  socket_path: z.string(),
});

/**
 * Parse and validate state data, throwing on invalid input
 */
export function parseState(data: unknown) {
  return StateSchema.parse(data);
}

/**
 * Safely parse state data, returning null on invalid input
 */
export function safeParseState(data: unknown) {
  const result = StateSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Parse and validate socket response
 */
export function parseSocketResponse(data: unknown) {
  return SocketResponseSchema.parse(data);
}

/**
 * Parse and validate daemon status
 */
export function parseDaemonStatus(data: unknown) {
  return DaemonStatusSchema.parse(data);
}

// Re-export inferred types from schemas for consistency
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
