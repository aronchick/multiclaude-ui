/**
 * @multiclaude/core - Shared utilities for multiclaude daemon communication
 *
 * This package provides TypeScript types, Zod schemas, and utilities for
 * interacting with the multiclaude daemon.
 */

// Re-export all types
export type {
  AgentType,
  TaskStatus,
  TrackMode,
  MessageStatus,
  DaemonState,
  Repository,
  Agent,
  TaskHistoryEntry,
  MergeQueueConfig,
  PRShepherdConfig,
  ForkConfig,
  AgentMessage,
  SocketRequest,
  SocketResponse,
} from './types.js';

// Re-export schemas and parse functions
export {
  AgentTypeSchema,
  TaskStatusSchema,
  TrackModeSchema,
  MessageStatusSchema,
  AgentSchema,
  TaskHistoryEntrySchema,
  MergeQueueConfigSchema,
  PRShepherdConfigSchema,
  ForkConfigSchema,
  RepositorySchema,
  DaemonStateSchema,
  AgentMessageSchema,
  SocketRequestSchema,
  SocketResponseSchema,
  parseDaemonState,
  parseAgentMessage,
  safeParseDaemonState,
  safeParseAgentMessage,
} from './schemas.js';

// Constants
export const MULTICLAUDE_DIR = '~/.multiclaude';
export const STATE_FILE = '~/.multiclaude/state.json';
export const DAEMON_SOCKET = '~/.multiclaude/daemon.sock';
export const MESSAGES_DIR = '~/.multiclaude/messages';
