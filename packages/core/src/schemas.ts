/**
 * Zod schemas for runtime validation of multiclaude state
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
export const TaskStatusSchema = z.enum([
  'open',
  'merged',
  'closed',
  'no-pr',
  'failed',
  'unknown',
]);

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

/** Root state schema */
export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

/** Daemon status schema */
export const DaemonStatusSchema = z.object({
  running: z.boolean(),
  pid: z.number(),
  repos: z.number(),
  agents: z.number(),
  socket_path: z.string(),
});

/** Inferred types from schemas */
export type AgentTypeInferred = z.infer<typeof AgentTypeSchema>;
export type TrackModeInferred = z.infer<typeof TrackModeSchema>;
export type TaskStatusInferred = z.infer<typeof TaskStatusSchema>;
export type MergeQueueConfigInferred = z.infer<typeof MergeQueueConfigSchema>;
export type PRShepherdConfigInferred = z.infer<typeof PRShepherdConfigSchema>;
export type ForkConfigInferred = z.infer<typeof ForkConfigSchema>;
export type TaskHistoryEntryInferred = z.infer<typeof TaskHistoryEntrySchema>;
export type AgentInferred = z.infer<typeof AgentSchema>;
export type RepositoryInferred = z.infer<typeof RepositorySchema>;
export type StateInferred = z.infer<typeof StateSchema>;
export type DaemonStatusInferred = z.infer<typeof DaemonStatusSchema>;

/** Socket response schema factory */
export function createSocketResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });
}

/** Parse and validate state JSON */
export function parseState(data: unknown): StateInferred {
  return StateSchema.parse(data);
}

/** Safe parse that returns result object */
export function safeParseState(data: unknown) {
  return StateSchema.safeParse(data);
}

/** Parse daemon status response */
export function parseDaemonStatus(data: unknown): DaemonStatusInferred {
  return DaemonStatusSchema.parse(data);
}
