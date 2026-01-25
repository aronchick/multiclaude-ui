/**
 * @multiclaude/core
 *
 * Shared daemon communication library for multiclaude UI components.
 * Provides TypeScript types, Zod schemas, and utilities for interacting
 * with the multiclaude daemon.
 */

// Types - all interfaces and type definitions
export type {
  Agent,
  AgentType,
  ForkConfig,
  MergeQueueConfig,
  PRShepherdConfig,
  Repository,
  State,
  TaskHistoryEntry,
  TaskStatus,
  TrackMode,
} from './types.js';

// Type utilities and constants
export {
  DEFAULT_MERGE_QUEUE_CONFIG,
  DEFAULT_PR_SHEPHERD_CONFIG,
  isPersistentAgentType,
  PERSISTENT_AGENT_TYPES,
} from './types.js';

// Zod schemas for runtime validation
export {
  AgentSchema,
  AgentTypeSchema,
  ForkConfigSchema,
  MergeQueueConfigSchema,
  parseAgent,
  parseRepository,
  parseState,
  PRShepherdConfigSchema,
  RepositorySchema,
  safeParseState,
  StateSchema,
  TaskHistoryEntrySchema,
  TaskStatusSchema,
  TrackModeSchema,
} from './schemas.js';
