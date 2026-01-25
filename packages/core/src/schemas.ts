/**
 * Zod schemas for runtime validation of multiclaude state.
 *
 * These schemas can validate JSON data from ~/.multiclaude/state.json
 * and provide type-safe parsing with detailed error messages.
 *
 * The types exported from types.ts are manually kept in sync with these
 * schemas. Use the parse functions to validate unknown data at runtime.
 */

import { z } from 'zod';
import type {
  Agent,
  Message,
  Repository,
  SocketResponse,
  State,
  TaskHistoryEntry,
} from './types';

// ============================================================================
// Agent Type Schema
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

// ============================================================================
// Track Mode Schema
// ============================================================================

export const TrackModeSchema = z.enum(['all', 'author', 'assigned']);

// ============================================================================
// Task Status Schema
// ============================================================================

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
// Task History Schema
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
  created_at: z.string(),
  completed_at: z.string().optional(),
});

// ============================================================================
// Agent Schema
// ============================================================================

export const AgentSchema = z.object({
  type: AgentTypeSchema,
  worktree_path: z.string(),
  tmux_window: z.string(),
  session_id: z.string(),
  pid: z.number().int().nonnegative(),
  task: z.string().optional(),
  summary: z.string().optional(),
  failure_reason: z.string().optional(),
  created_at: z.string(),
  last_nudge: z.string().optional(),
  ready_for_cleanup: z.boolean().optional(),
});

// ============================================================================
// Repository Schema
// ============================================================================

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

// ============================================================================
// State Schema
// ============================================================================

export const StateSchema = z.object({
  repos: z.record(z.string(), RepositorySchema),
  current_repo: z.string().optional(),
});

// ============================================================================
// Message Schema
// ============================================================================

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  timestamp: z.string(),
  acknowledged: z.boolean().optional(),
});

// ============================================================================
// Socket API Schemas
// ============================================================================

export const SocketRequestSchema = z.object({
  command: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const SocketResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Parse and validate a State object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseState(data: unknown): State {
  return StateSchema.parse(data) as State;
}

/**
 * Safely parse a State object, returning null if validation fails.
 */
export function safeParseState(data: unknown): State | null {
  const result = StateSchema.safeParse(data);
  return result.success ? (result.data as State) : null;
}

/**
 * Parse and validate a Repository object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseRepository(data: unknown): Repository {
  return RepositorySchema.parse(data) as Repository;
}

/**
 * Safely parse a Repository object, returning null if validation fails.
 */
export function safeParseRepository(data: unknown): Repository | null {
  const result = RepositorySchema.safeParse(data);
  return result.success ? (result.data as Repository) : null;
}

/**
 * Parse and validate an Agent object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseAgent(data: unknown): Agent {
  return AgentSchema.parse(data) as Agent;
}

/**
 * Safely parse an Agent object, returning null if validation fails.
 */
export function safeParseAgent(data: unknown): Agent | null {
  const result = AgentSchema.safeParse(data);
  return result.success ? (result.data as Agent) : null;
}

/**
 * Parse and validate a Message object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseMessage(data: unknown): Message {
  return MessageSchema.parse(data) as Message;
}

/**
 * Safely parse a Message object, returning null if validation fails.
 */
export function safeParseMessage(data: unknown): Message | null {
  const result = MessageSchema.safeParse(data);
  return result.success ? (result.data as Message) : null;
}

/**
 * Parse and validate a TaskHistoryEntry object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseTaskHistoryEntry(data: unknown): TaskHistoryEntry {
  return TaskHistoryEntrySchema.parse(data) as TaskHistoryEntry;
}

/**
 * Safely parse a TaskHistoryEntry object, returning null if validation fails.
 */
export function safeParseTaskHistoryEntry(
  data: unknown
): TaskHistoryEntry | null {
  const result = TaskHistoryEntrySchema.safeParse(data);
  return result.success ? (result.data as TaskHistoryEntry) : null;
}

/**
 * Parse and validate a SocketResponse object from unknown data.
 * Throws ZodError if validation fails.
 */
export function parseSocketResponse(data: unknown): SocketResponse {
  return SocketResponseSchema.parse(data) as SocketResponse;
}

/**
 * Safely parse a SocketResponse object, returning null if validation fails.
 */
export function safeParseSocketResponse(data: unknown): SocketResponse | null {
  const result = SocketResponseSchema.safeParse(data);
  return result.success ? (result.data as SocketResponse) : null;
}
