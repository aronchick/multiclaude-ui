/**
 * Zod schemas for runtime validation of multiclaude state
 *
 * These schemas validate data parsed from state.json or received via socket API.
 * They mirror the TypeScript types in types.ts but add runtime validation.
 */

import { z } from 'zod';

// Enum schemas
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

// Task history entry schema
export const TaskHistoryEntrySchema = z.object({
  name: z.string(),
  task: z.string(),
  branch: z.string(),
  pr_url: z.string().optional(),
  pr_number: z.number().int().positive().optional(),
  status: TaskStatusSchema,
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string(), // ISO 8601 timestamp (flexible parsing)
  completed_at: z.string().optional(),
});

// Agent schema
export const AgentSchema = z.object({
  type: AgentTypeSchema,
  worktree_path: z.string(),
  tmux_window: z.string(),
  session_id: z.string(),
  pid: z.number().int(),
  task: z.string().optional(),
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string(),
  last_nudge: z.string().optional(),
  ready_for_cleanup: z.boolean().optional(),
});

// Repository schema
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

// Full state schema
export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

// Inferred types from schemas (useful for consumers who prefer Zod inference)
export type ZodAgent = z.infer<typeof AgentSchema>;
export type ZodRepository = z.infer<typeof RepositorySchema>;
export type ZodState = z.infer<typeof StateSchema>;

/**
 * Parse and validate state JSON
 * @throws {z.ZodError} if validation fails
 */
export function parseState(data: unknown): ZodState {
  return StateSchema.parse(data);
}

/**
 * Safely parse state JSON, returning null on failure
 */
export function safeParseState(data: unknown): ZodState | null {
  const result = StateSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Parse and validate a single agent
 * @throws {z.ZodError} if validation fails
 */
export function parseAgent(data: unknown): ZodAgent {
  return AgentSchema.parse(data);
}

/**
 * Parse and validate a single repository
 * @throws {z.ZodError} if validation fails
 */
export function parseRepository(data: unknown): ZodRepository {
  return RepositorySchema.parse(data);
}
