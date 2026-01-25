/**
 * @multiclaude/core - Shared daemon communication library
 *
 * This package provides TypeScript types, Zod schemas, and utilities for
 * interacting with the multiclaude daemon. It enables external tools to:
 *
 * - Read and validate state from ~/.multiclaude/state.json
 * - Watch for real-time state changes
 * - Communicate with the daemon via Unix socket
 * - Read inter-agent messages
 *
 * @example
 * ```typescript
 * import { StateReader, parseState, type State } from '@multiclaude/core';
 *
 * // Watch state file for changes
 * const reader = new StateReader();
 * reader.on('change', (state: State) => {
 *   console.log(`Active repos: ${Object.keys(state.repos).length}`);
 * });
 * await reader.start();
 *
 * // Or parse state directly
 * const state = parseState(JSON.parse(fs.readFileSync(statePath, 'utf8')));
 * ```
 */

// ============================================================================
// Types
// ============================================================================

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
  Message,
  SocketRequest,
  SocketResponse,
} from './types';

export {
  PERSISTENT_AGENT_TYPES,
  TRANSIENT_AGENT_TYPES,
  isPersistentAgent,
  DEFAULT_MERGE_QUEUE_CONFIG,
  DEFAULT_PR_SHEPHERD_CONFIG,
} from './types';

// ============================================================================
// Schemas
// ============================================================================

export {
  // Schemas
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
  MessageSchema,
  SocketRequestSchema,
  SocketResponseSchema,
  // Parse functions
  parseState,
  safeParseState,
  parseRepository,
  safeParseRepository,
  parseAgent,
  safeParseAgent,
  parseMessage,
  safeParseMessage,
  parseTaskHistoryEntry,
  safeParseTaskHistoryEntry,
  parseSocketResponse,
  safeParseSocketResponse,
} from './schemas';

// ============================================================================
// State Reader (file watching)
// ============================================================================

export { StateReader, type StateReaderOptions, type StateReaderEvents } from './state';

// ============================================================================
// Daemon Client (socket communication)
// ============================================================================

export { DaemonClient, type DaemonClientOptions } from './client';

// ============================================================================
// Message Reader
// ============================================================================

export { MessageReader, type MessageReaderOptions, type MessageReaderEvents } from './messages';
