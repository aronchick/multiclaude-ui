/**
 * @multiclaude/core - Core library for multiclaude daemon communication
 *
 * This package provides TypeScript types, Zod schemas, and reactive readers
 * for integrating with the multiclaude daemon.
 *
 * @example
 * ```ts
 * import {
 *   DaemonClient,
 *   StateReader,
 *   MessageReader,
 *   type State,
 *   type Agent,
 * } from '@multiclaude/core';
 *
 * // Socket API client
 * const client = new DaemonClient();
 * const status = await client.status();
 *
 * // State file watcher
 * const stateReader = new StateReader();
 * stateReader.on('change', (state) => {
 *   console.log('Repos:', Object.keys(state.repos));
 * });
 * await stateReader.start();
 *
 * // Message watcher
 * const msgReader = new MessageReader();
 * msgReader.on('message', (msg, repo, agent) => {
 *   console.log(`Message for ${agent}:`, msg.content);
 * });
 * await msgReader.start();
 * ```
 */

// Types
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

export { isPersistentAgent, defaultMergeQueueConfig, defaultPRShepherdConfig } from './types.js';

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
  SocketResponseSchema,
  DaemonStatusSchema,
  parseState,
  safeParseState,
  parseSocketResponse,
} from './schemas.js';

// Re-export inferred types with shorter names
export type {
  AgentTypeZ,
  TrackModeZ,
  TaskStatusZ,
  MergeQueueConfigZ,
  PRShepherdConfigZ,
  ForkConfigZ,
  TaskHistoryEntryZ,
  AgentZ,
  RepositoryZ,
  StateZ,
} from './schemas.js';

// Client
export {
  DaemonClient,
  DEFAULT_SOCKET_PATH,
  isDaemonRunning,
  type DaemonClientOptions,
} from './client.js';

// State reader
export {
  StateReader,
  DEFAULT_STATE_PATH,
  readState,
  type StateReaderOptions,
  type StateReaderEvent,
  type StateChangeHandler,
  type StateErrorHandler,
  type StateReadyHandler,
} from './state.js';

// Message reader
export {
  MessageReader,
  MessageSchema,
  DEFAULT_MESSAGES_PATH,
  type Message,
  type MessageReaderOptions,
  type MessageReaderEvent,
  type MessageHandler,
  type MessageErrorHandler,
  type MessageReadyHandler,
} from './messages.js';
