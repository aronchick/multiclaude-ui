/**
 * StateReader - Watch and parse ~/.multiclaude/state.json
 */

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { State } from './types.js';
import { parseState, safeParseState } from './schemas.js';

export type StateChangeHandler = (state: State) => void;
export type StateErrorHandler = (error: Error) => void;

export interface StateReaderOptions {
  /** Path to state.json (default: ~/.multiclaude/state.json) */
  path?: string;
  /** Debounce interval in ms for rapid file changes (default: 100) */
  debounceMs?: number;
  /** Whether to validate state with Zod schemas (default: true) */
  validate?: boolean;
}

/**
 * StateReader watches the multiclaude state file for changes
 * and emits parsed state objects.
 *
 * @example
 * ```ts
 * const reader = new StateReader();
 * reader.on('change', (state) => {
 *   console.log('Active agents:', Object.keys(state.repos).length);
 * });
 * await reader.start();
 * ```
 */
export class StateReader {
  private readonly path: string;
  private readonly debounceMs: number;
  private readonly validate: boolean;

  private watcher: FSWatcher | null = null;
  private state: State | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private changeHandlers: StateChangeHandler[] = [];
  private errorHandlers: StateErrorHandler[] = [];

  constructor(options: StateReaderOptions = {}) {
    this.path = options.path ?? join(homedir(), '.multiclaude', 'state.json');
    this.debounceMs = options.debounceMs ?? 100;
    this.validate = options.validate ?? true;
  }

  /**
   * Register a handler for state changes
   */
  on(event: 'change', handler: StateChangeHandler): this;
  on(event: 'error', handler: StateErrorHandler): this;
  on(event: 'change' | 'error', handler: StateChangeHandler | StateErrorHandler): this {
    if (event === 'change') {
      this.changeHandlers.push(handler as StateChangeHandler);
    } else {
      this.errorHandlers.push(handler as StateErrorHandler);
    }
    return this;
  }

  /**
   * Remove a handler
   */
  off(event: 'change', handler: StateChangeHandler): this;
  off(event: 'error', handler: StateErrorHandler): this;
  off(event: 'change' | 'error', handler: StateChangeHandler | StateErrorHandler): this {
    if (event === 'change') {
      this.changeHandlers = this.changeHandlers.filter((h) => h !== handler);
    } else {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    }
    return this;
  }

  /**
   * Start watching the state file
   */
  async start(): Promise<void> {
    // Initial read
    await this.reload();

    // Start watching
    this.watcher = watch(this.path, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', () => {
      this.handleFileChange();
    });

    this.watcher.on('error', (error) => {
      this.emitError(error);
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
   * Get the current state (may be stale if not watching)
   */
  getState(): State | null {
    return this.state;
  }

  /**
   * Force a reload of the state file
   */
  async reload(): Promise<State> {
    try {
      const content = await readFile(this.path, 'utf-8');
      const data: unknown = JSON.parse(content);

      if (this.validate) {
        this.state = parseState(data);
      } else {
        this.state = safeParseState(data) ?? (data as State);
      }

      return this.state;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitError(err);
      throw err;
    }
  }

  private handleFileChange(): void {
    // Debounce rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.reload()
        .then((state) => {
          this.emitChange(state);
        })
        .catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emitError(err);
        });
    }, this.debounceMs);
  }

  private emitChange(state: State): void {
    for (const handler of this.changeHandlers) {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in state change handler:', error);
      }
    }
  }

  private emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    }
  }
}

/**
 * Convenience function to read state once without watching
 */
export async function readState(path?: string): Promise<State> {
  const reader = new StateReader({ path });
  return reader.reload();
}

/**
 * Get default state file path
 */
export function getDefaultStatePath(): string {
  return join(homedir(), '.multiclaude', 'state.json');
}
