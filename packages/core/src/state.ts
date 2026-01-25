/**
 * StateReader - Watch ~/.multiclaude/state.json for changes
 *
 * This module is implemented by worker: jolly-penguin
 *
 * @example
 * ```typescript
 * const reader = new StateReader();
 * reader.on('change', (state) => console.log('State updated'));
 * await reader.start();
 * ```
 */

import { EventEmitter } from 'events';
import type { State } from './types';

/**
 * Options for creating a StateReader instance.
 */
export interface StateReaderOptions {
  /**
   * Path to the state file.
   * Defaults to ~/.multiclaude/state.json
   */
  path?: string;

  /**
   * Debounce interval in milliseconds for rapid file changes.
   * Defaults to 100ms.
   */
  debounceMs?: number;
}

/**
 * Events emitted by StateReader.
 */
export interface StateReaderEvents {
  /** Emitted when state changes */
  change: (state: State) => void;
  /** Emitted on errors */
  error: (error: Error) => void;
}

/**
 * StateReader watches the multiclaude state file for changes.
 *
 * Uses file system watching (chokidar) to detect changes and emits
 * events with the parsed state. Includes debouncing to handle
 * rapid updates during busy periods.
 *
 * @example
 * ```typescript
 * const reader = new StateReader({ debounceMs: 200 });
 *
 * reader.on('change', (state: State) => {
 *   for (const [name, repo] of Object.entries(state.repos)) {
 *     console.log(`${name}: ${Object.keys(repo.agents).length} agents`);
 *   }
 * });
 *
 * reader.on('error', (err) => {
 *   console.error('State read error:', err);
 * });
 *
 * await reader.start();
 *
 * // Later: stop watching
 * await reader.stop();
 * ```
 */
export class StateReader extends EventEmitter {
  // Options stored for use by implementer (jolly-penguin)
  private _options: Required<StateReaderOptions>;

  constructor(options: StateReaderOptions = {}) {
    super();
    this._options = {
      path: options.path ?? `${process.env.HOME}/.multiclaude/state.json`,
      debounceMs: options.debounceMs ?? 100,
    };
  }

  /**
   * Start watching the state file.
   * @throws Error if the state file doesn't exist
   */
  async start(): Promise<void> {
    // TODO: Implemented by jolly-penguin
    throw new Error('StateReader.start() not implemented - see worker: jolly-penguin');
  }

  /**
   * Stop watching the state file.
   */
  async stop(): Promise<void> {
    // TODO: Implemented by jolly-penguin
    throw new Error('StateReader.stop() not implemented - see worker: jolly-penguin');
  }

  /**
   * Get the current state synchronously.
   * @returns The current state, or null if not yet loaded
   */
  getState(): State | null {
    // TODO: Implemented by jolly-penguin
    throw new Error('StateReader.getState() not implemented - see worker: jolly-penguin');
  }

  /**
   * Read and parse the state file once (no watching).
   * @returns The current state
   * @throws Error if the file doesn't exist or is invalid
   */
  async readOnce(): Promise<State> {
    // TODO: Implemented by jolly-penguin
    throw new Error('StateReader.readOnce() not implemented - see worker: jolly-penguin');
  }
}
