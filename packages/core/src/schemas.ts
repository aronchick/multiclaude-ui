/**
 * Zod schemas for runtime validation of multiclaude state.
 *
 * These schemas validate JSON data from state.json and socket responses.
 * Use parse() to validate and get typed data, or safeParse() for error handling.
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas
// ============================================================================

export const AgentTypeSchema = z.enum([
  'supervisor',
  'worker',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'review',
  'generic-persistent',
]);

export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

export const TaskStatusSchema = z.enum([
  'open',
  'merged',
  'closed',
  'no-pr',
  'failed',
  'unknown',
]);

// ============================================================================
// Configuration Schemas
// ============================================================================

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

// ============================================================================
// Core Schemas
// ============================================================================

export const TaskHistoryEntrySchema = z.object({
  name: z.string(),
  task: z.string(),
  branch: z.string(),
  pr_url: z.string().optional(),
  pr_number: z.number().int().positive().optional(),
  status: TaskStatusSchema,
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
  completed_at: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

export const AgentSchema = z.object({
  type: AgentTypeSchema,
  worktree_path: z.string(),
  tmux_window: z.string(),
  session_id: z.string(),
  pid: z.number().int().nonnegative(),
  task: z.string().optional(),
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
  last_nudge: z.string().datetime({ offset: true }).or(z.string()).optional(),
  ready_for_cleanup: z.boolean().optional(),
});

export const RepositorySchema = z.object({
  github_url: z.string().url(),
  tmux_session: z.string(),
  agents: z.record(z.string(), AgentSchema),
  task_history: z.array(TaskHistoryEntrySchema).optional(),
  merge_queue_config: MergeQueueConfigSchema.optional(),
  pr_shepherd_config: PRShepherdConfigSchema.optional(),
  fork_config: ForkConfigSchema.optional(),
  target_branch: z.string().optional(),
});

export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

// ============================================================================
// Socket API Schemas
// ============================================================================

export const SocketRequestSchema = z.object({
  command: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const SocketResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export const DaemonStatusSchema = z.object({
  running: z.boolean(),
  pid: z.number().int(),
  repos: z.number().int().nonnegative(),
  agents: z.number().int().nonnegative(),
  socket_path: z.string(),
});

export const ListReposResponseSchema = z.object({
  repos: z.array(z.string()),
});

export const ListAgentsResponseSchema = z.object({
  agents: z.record(z.string(), AgentSchema),
});

export const TaskHistoryResponseSchema = z.object({
  history: z.array(TaskHistoryEntrySchema),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type AgentTypeFromSchema = z.infer<typeof AgentTypeSchema>;
export type TrackModeFromSchema = z.infer<typeof TrackModeSchema>;
export type TaskStatusFromSchema = z.infer<typeof TaskStatusSchema>;
export type MergeQueueConfigFromSchema = z.infer<typeof MergeQueueConfigSchema>;
export type PRShepherdConfigFromSchema = z.infer<typeof PRShepherdConfigSchema>;
export type ForkConfigFromSchema = z.infer<typeof ForkConfigSchema>;
export type TaskHistoryEntryFromSchema = z.infer<typeof TaskHistoryEntrySchema>;
export type AgentFromSchema = z.infer<typeof AgentSchema>;
export type RepositoryFromSchema = z.infer<typeof RepositorySchema>;
export type StateFromSchema = z.infer<typeof StateSchema>;

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Parse and validate state JSON. Throws ZodError on invalid data.
 */
export function parseState(data: unknown) {
  return StateSchema.parse(data);
}

/**
 * Safely parse state JSON. Returns success/error result.
 */
export function safeParseState(data: unknown) {
  return StateSchema.safeParse(data);
}

/**
 * Parse and validate a single agent. Throws ZodError on invalid data.
 */
export function parseAgent(data: unknown) {
  return AgentSchema.parse(data);
}

/**
 * Parse and validate a single repository. Throws ZodError on invalid data.
 */
export function parseRepository(data: unknown) {
  return RepositorySchema.parse(data);
}
