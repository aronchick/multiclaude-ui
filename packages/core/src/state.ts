/**
 * StateReader - Watch ~/.multiclaude/state.json for changes.
 *
 * This module provides a reactive way to read the daemon's state file,
 * emitting events when the state changes.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import chokidar, { type FSWatcher } from 'chokidar';
import { parseState, safeParseState, type State } from './schemas.js';

/**
 * Events emitted by StateReader.
 */
export interface StateReaderEvents {
  /** Emitted when state changes. Passes the new state. */
  change: (state: State) => void;
  /** Emitted on read/parse errors. */
  error: (error: Error) => void;
  /** Emitted when the watcher is ready. */
  ready: () => void;
  /** Emitted when the watcher is closed. */
  close: () => void;
}

/**
 * Options for StateReader.
 */
export interface StateReaderOptions {
  /** Path to state.json. Defaults to ~/.multiclaude/state.json */
  statePath?: string;
  /** Debounce delay in ms for rapid updates. Defaults to 100ms. */
  debounceMs?: number;
  /** Whether to emit initial state on start. Defaults to true. */
  emitInitial?: boolean;
}

/**
 * Default path to the state file.
 */
export function defaultStatePath(): string {
  return join(homedir(), '.multiclaude', 'state.json');
}

/**
 * StateReader watches the multiclaude state.json file and emits events on changes.
 *
 * @example
 * ```typescript
 * const reader = new StateReader();
 *
 * reader.on('change', (state) => {
 *   console.log(`Repos: ${Object.keys(state.repos).length}`);
 * });
 *
 * await reader.start();
 *
 * // Later...
 * await reader.stop();
 * ```
 */
export class StateReader extends EventEmitter {
  private readonly statePath: string;
  private readonly debounceMs: number;
  private readonly emitInitial: boolean;
  private watcher: FSWatcher | null = null;
  private currentState: State | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(options: StateReaderOptions = {}) {
    super();
    this.statePath = options.statePath ?? defaultStatePath();
    this.debounceMs = options.debounceMs ?? 100;
    this.emitInitial = options.emitInitial ?? true;
  }

  /**
   * Start watching the state file.
   */
  async start(): Promise<void> {
    if (this.watcher) {
      throw new Error('StateReader already started');
    }

    // Read initial state if file exists
    if (existsSync(this.statePath)) {
      await this.readAndEmit(this.emitInitial);
    }

    // Start watching
    this.watcher = chokidar.watch(this.statePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('change', () => {
      this.debouncedRead();
    });

    this.watcher.on('add', () => {
      this.debouncedRead();
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.watcher.on('ready', () => {
      this.emit('ready');
    });
  }

  /**
   * Stop watching the state file.
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.emit('close');
    }
  }

  /**
   * Get the current state (cached from last read).
   * Returns null if state hasn't been read yet.
   */
  getState(): State | null {
    return this.currentState;
  }

  /**
   * Force a re-read of the state file.
   */
  async refresh(): Promise<State> {
    return this.readAndEmit(true);
  }

  /**
   * Read the state file once without watching.
   * Useful for one-shot queries.
   */
  static async readOnce(statePath?: string): Promise<State> {
    const path = statePath ?? defaultStatePath();
    const data = await readFile(path, 'utf8');
    const json: unknown = JSON.parse(data);
    return parseState(json);
  }

  /**
   * Safely read the state file once, returning null on any error.
   */
  static async safeReadOnce(statePath?: string): Promise<State | null> {
    try {
      const path = statePath ?? defaultStatePath();
      const data = await readFile(path, 'utf8');
      const json: unknown = JSON.parse(data);
      return safeParseState(json);
    } catch {
      return null;
    }
  }

  /**
   * Check if the state file exists.
   */
  static exists(statePath?: string): boolean {
    const path = statePath ?? defaultStatePath();
    return existsSync(path);
  }

  private debouncedRead(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.readAndEmit(true);
    }, this.debounceMs);
  }

  private async readAndEmit(shouldEmit: boolean): Promise<State> {
    try {
      const data = await readFile(this.statePath, 'utf8');
      const json: unknown = JSON.parse(data);
      const state = parseState(json);
      this.currentState = state;

      if (shouldEmit) {
        this.emit('change', state);
      }

      return state;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  // Type-safe event emitter methods
  override on<K extends keyof StateReaderEvents>(
    event: K,
    listener: StateReaderEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override off<K extends keyof StateReaderEvents>(
    event: K,
    listener: StateReaderEvents[K]
  ): this {
    return super.off(event, listener);
  }

  override once<K extends keyof StateReaderEvents>(
    event: K,
    listener: StateReaderEvents[K]
  ): this {
    return super.once(event, listener);
  }

  override emit<K extends keyof StateReaderEvents>(
    event: K,
    ...args: Parameters<StateReaderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
