/**
 * @multiclaude/core - Core library for communicating with multiclaude daemon.
 *
 * This package provides TypeScript types, Zod schemas, and client utilities
 * for integrating with the multiclaude daemon via its Unix socket API
 * and state file.
 *
 * @packageDocumentation
 */

// Re-export all types
export type {
  AgentType,
  TrackMode,
  TaskStatus,
  MergeQueueConfig,
  PRShepherdConfig,
  ForkConfig,
  TaskHistoryEntry,
  Agent,
  Repository,
  State,
  SocketRequest,
  SocketResponse,
  DaemonStatus,
} from './types.js';

export { isPersistentAgentType, defaultMergeQueueConfig, defaultPRShepherdConfig } from './types.js';

// Re-export schemas
export {
  AgentTypeSchema,
  TrackModeSchema,
  TaskStatusSchema,
  MergeQueueConfigSchema,
  PRShepherdConfigSchema,
  ForkConfigSchema,
  TaskHistoryEntrySchema,
  AgentSchema,
  RepositorySchema,
  StateSchema,
  SocketResponseSchema,
  DaemonStatusSchema,
  parseState,
  safeParseState,
  parseRepository,
  parseAgent,
  parseSocketResponse,
  parseDaemonStatus,
} from './schemas.js';

// Re-export state reader
export { StateReader, defaultStatePath } from './state.js';
export type { StateReaderEvents, StateReaderOptions } from './state.js';

// Re-export daemon client
export { DaemonClient, DaemonError, defaultSocketPath } from './client.js';
export type { DaemonClientOptions } from './client.js';

// Re-export message reader
export { MessageReader, MessageSchema, defaultMessagesPath } from './messages.js';
export type { Message, MessageReaderEvents, MessageReaderOptions } from './messages.js';
