/**
 * @multiclaude/core - Core library for multiclaude daemon communication
 *
 * @example
 * ```ts
 * import { DaemonClient, StateReader } from '@multiclaude/core';
 *
 * // Watch state changes
 * const reader = new StateReader();
 * reader.on('change', (state) => {
 *   console.log('Repos:', Object.keys(state.repos));
 * });
 * await reader.start();
 *
 * // Spawn a worker
 * const client = new DaemonClient();
 * await client.spawnWorker('my-repo', 'Fix login bug');
 * ```
 */

// Types
export * from './types.js';

// Zod schemas
export * from './schemas.js';

// State reader
export { StateReader, readState, getDefaultStatePath } from './state.js';
export type { StateReaderOptions, StateChangeHandler, StateErrorHandler } from './state.js';

// Daemon client
export {
  DaemonClient,
  DaemonConnectionError,
  DaemonCommandError,
  getDefaultSocketPath,
} from './client.js';
export type { DaemonClientOptions } from './client.js';

// Message reader
export { MessageReader, getDefaultMessagesPath } from './messages.js';
export type { Message, MessageReaderOptions, MessageHandler, MessageErrorHandler } from './messages.js';
