/**
 * @multiclaude/core - Shared library for multiclaude daemon communication
 *
 * @example
 * ```typescript
 * import {
 *   DaemonClient,
 *   StateReader,
 *   MessageReader,
 *   getActiveWorkers,
 * } from '@multiclaude/core';
 *
 * // Connect to daemon
 * const client = new DaemonClient();
 * const status = await client.status();
 *
 * // Watch state changes
 * const state = new StateReader();
 * state.on('change', (s) => console.log('Updated!'));
 * await state.watch();
 *
 * // Watch messages
 * const messages = new MessageReader({ repo: 'my-app' });
 * messages.on('message', (msg) => console.log(msg.content));
 * await messages.watch();
 * ```
 */

// Types
export type {
  Agent,
  AgentType,
  DaemonStatus,
  ForkConfig,
  MergeQueueConfig,
  PRShepherdConfig,
  Repository,
  SocketRequest,
  SocketResponse,
  State,
  TaskHistoryEntry,
  TaskStatus,
  TrackMode,
} from './types.js';

export {
  isPersistentAgentType,
  DEFAULT_MERGE_QUEUE_CONFIG,
  DEFAULT_PR_SHEPHERD_CONFIG,
} from './types.js';

// Schemas
export {
  AgentSchema,
  AgentTypeSchema,
  DaemonStatusSchema,
  ForkConfigSchema,
  MergeQueueConfigSchema,
  PRShepherdConfigSchema,
  RepositorySchema,
  StateSchema,
  TaskHistoryEntrySchema,
  TaskStatusSchema,
  TrackModeSchema,
  createSocketResponseSchema,
  parseDaemonStatus,
  parseState,
  safeParseState,
} from './schemas.js';

// Client
export {
  DaemonClient,
  DaemonNotRunningError,
  CommandError,
  type DaemonClientConfig,
} from './client.js';

// State
export {
  StateReader,
  getActiveWorkers,
  getRecentTasks,
  calculateSuccessRate,
  type StateReaderConfig,
  type StateReaderEvents,
} from './state.js';

// Messages
export {
  MessageReader,
  type Message,
  type MessageReaderConfig,
  type MessageReaderEvents,
} from './messages.js';
