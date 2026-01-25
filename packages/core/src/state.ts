/**
 * StateReader - Watch and read multiclaude state file
 *
 * Provides reactive access to daemon state via file watching.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { State } from './types.js';
import { safeParseState, parseState } from './schemas.js';

/**
 * Default state file path
 */
export const DEFAULT_STATE_PATH = join(homedir(), '.multiclaude', 'state.json');

/**
 * Event types emitted by StateReader
 */
export type StateReaderEvent = 'change' | 'error' | 'ready';

/**
 * Event handler types
 */
export type StateChangeHandler = (state: State) => void;
export type StateErrorHandler = (error: Error) => void;
export type StateReadyHandler = () => void;

/**
 * Options for StateReader
 */
export interface StateReaderOptions {
  /** Path to state file (default: ~/.multiclaude/state.json) */
  statePath?: string;
  /** Debounce delay in ms for rapid updates (default: 100) */
  debounceMs?: number;
}

/**
 * Reactive reader for multiclaude state file
 *
 * @example
 * ```ts
 * const reader = new StateReader();
 *
 * reader.on('change', (state) => {
 *   console.log('State updated:', state.repos);
 * });
 *
 * await reader.start();
 *
 * // Get current state
 * const state = reader.getState();
 *
 * // Stop watching
 * reader.stop();
 * ```
 */
export class StateReader {
  private readonly statePath: string;
  private readonly debounceMs: number;

  private watcher: FSWatcher | null = null;
  private state: State | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private changeHandlers: StateChangeHandler[] = [];
  private errorHandlers: StateErrorHandler[] = [];
  private readyHandlers: StateReadyHandler[] = [];

  constructor(options: StateReaderOptions = {}) {
    this.statePath = options.statePath ?? DEFAULT_STATE_PATH;
    this.debounceMs = options.debounceMs ?? 100;
  }

  /**
   * Register an event handler
   */
  on(event: 'change', handler: StateChangeHandler): this;
  on(event: 'error', handler: StateErrorHandler): this;
  on(event: 'ready', handler: StateReadyHandler): this;
  on(
    event: StateReaderEvent,
    handler: StateChangeHandler | StateErrorHandler | StateReadyHandler
  ): this {
    switch (event) {
      case 'change':
        this.changeHandlers.push(handler as StateChangeHandler);
        break;
      case 'error':
        this.errorHandlers.push(handler as StateErrorHandler);
        break;
      case 'ready':
        this.readyHandlers.push(handler as StateReadyHandler);
        break;
    }
    return this;
  }

  /**
   * Remove an event handler
   */
  off(event: 'change', handler: StateChangeHandler): this;
  off(event: 'error', handler: StateErrorHandler): this;
  off(event: 'ready', handler: StateReadyHandler): this;
  off(
    event: StateReaderEvent,
    handler: StateChangeHandler | StateErrorHandler | StateReadyHandler
  ): this {
    switch (event) {
      case 'change':
        this.changeHandlers = this.changeHandlers.filter((h) => h !== handler);
        break;
      case 'error':
        this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
        break;
      case 'ready':
        this.readyHandlers = this.readyHandlers.filter((h) => h !== handler);
        break;
    }
    return this;
  }

  /**
   * Start watching the state file
   */
  async start(): Promise<void> {
    if (this.watcher) {
      return; // Already watching
    }

    // Initial read
    await this.reload();

    // Set up file watcher
    this.watcher = watch(this.statePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('change', () => {
      this.debouncedReload();
    });

    this.watcher.on('error', (err) => {
      this.emitError(err);
    });

    this.watcher.on('ready', () => {
      for (const handler of this.readyHandlers) {
        handler();
      }
    });
  }

  /**
   * Stop watching the state file
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Get the current state (may be null if not yet loaded)
   */
  getState(): State | null {
    return this.state;
  }

  /**
   * Check if the state file exists
   */
  exists(): boolean {
    return existsSync(this.statePath);
  }

  /**
   * Force reload the state from disk
   */
  async reload(): Promise<State | null> {
    try {
      if (!this.exists()) {
        this.state = null;
        return null;
      }

      const content = await readFile(this.statePath, 'utf-8');
      const json = JSON.parse(content);
      const state = parseState(json);

      const changed = JSON.stringify(this.state) !== JSON.stringify(state);
      this.state = state;

      if (changed) {
        this.emitChange(state);
      }

      return state;
    } catch (err) {
      this.emitError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }

  private debouncedReload(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.reload();
    }, this.debounceMs);
  }

  private emitChange(state: State): void {
    for (const handler of this.changeHandlers) {
      try {
        handler(state);
      } catch (err) {
        console.error('Error in state change handler:', err);
      }
    }
  }

  private emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    }
  }
}

/**
 * Read state file once (convenience function)
 */
export async function readState(statePath?: string): Promise<State | null> {
  const path = statePath ?? DEFAULT_STATE_PATH;

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = await readFile(path, 'utf-8');
    return safeParseState(JSON.parse(content));
  } catch {
    return null;
  }
}
