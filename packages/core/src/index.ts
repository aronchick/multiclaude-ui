/**
 * @multiclaude/core - Core library for multiclaude daemon communication.
 *
 * This package provides:
 * - TypeScript types matching the multiclaude Go types
 * - Zod schemas for runtime validation
 * - DaemonClient for socket communication
 * - StateReader for watching state.json
 * - MessageReader for watching inter-agent messages
 *
 * @example
 * ```typescript
 * import {
 *   DaemonClient,
 *   StateReader,
 *   MessageReader,
 *   type State,
 *   type Agent,
 * } from '@multiclaude/core';
 *
 * // Socket communication
 * const client = new DaemonClient();
 * const status = await client.status();
 *
 * // State file watching
 * const stateReader = new StateReader();
 * stateReader.on('change', (state) => console.log(state));
 * await stateReader.watch();
 *
 * // Message watching
 * const messageReader = new MessageReader({ repo: 'my-repo' });
 * messageReader.on('message', (msg) => console.log(msg));
 * await messageReader.watch();
 * ```
 */

// Types
export {
  AgentType,
  TrackMode,
  TaskStatus,
  PERSISTENT_AGENT_TYPES,
  isPersistentAgentType,
  DEFAULT_MERGE_QUEUE_CONFIG,
  DEFAULT_PR_SHEPHERD_CONFIG,
} from './types.js';

export type {
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
  ListReposResponse,
  ListAgentsResponse,
  TaskHistoryResponse,
} from './types.js';

// Schemas
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
  SocketRequestSchema,
  SocketResponseSchema,
  DaemonStatusSchema,
  ListReposResponseSchema,
  ListAgentsResponseSchema,
  TaskHistoryResponseSchema,
  parseState,
  safeParseState,
  parseAgent,
  parseRepository,
} from './schemas.js';

// Client
export { DaemonClient, DaemonError } from './client.js';
export type { DaemonClientOptions } from './client.js';

// State Reader
export { StateReader } from './state.js';
export type {
  StateReaderOptions,
  StateReaderEvent,
  StateChangeHandler,
  StateErrorHandler,
  StateReadyHandler,
} from './state.js';

// Message Reader
export { MessageReader, MessageSchema } from './messages.js';
export type {
  Message,
  MessageReaderOptions,
  MessageReaderEvent,
  MessageHandler,
  MessageErrorHandler,
  MessageReadyHandler,
} from './messages.js';
