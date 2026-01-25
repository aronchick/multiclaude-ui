/**
 * StateReader - Watch and read multiclaude state.json file.
 *
 * Provides reactive access to daemon state without socket communication.
 * Uses chokidar for efficient file watching with debouncing.
 *
 * Reference: multiclaude/docs/extending/STATE_FILE_INTEGRATION.md
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { State, Agent, Repository, TaskHistoryEntry } from './types.js';
import { safeParseState } from './schemas.js';

/**
 * Options for StateReader
 */
export interface StateReaderOptions {
  /** Path to state.json. Defaults to ~/.multiclaude/state.json */
  statePath?: string;
  /** Debounce delay in ms for rapid updates. Default: 100 */
  debounceMs?: number;
}

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
 * Reactive state reader that watches ~/.multiclaude/state.json for changes.
 *
 * @example
 * ```typescript
 * const reader = new StateReader();
 *
 * // Get current state
 * const state = await reader.read();
 *
 * // Watch for changes
 * reader.on('change', (state) => {
 *   console.log(`${Object.keys(state.repos).length} repos`);
 * });
 *
 * reader.on('error', (err) => {
 *   console.error('State read error:', err);
 * });
 *
 * await reader.watch();
 *
 * // Later: stop watching
 * await reader.close();
 * ```
 */
export class StateReader {
  private readonly statePath: string;
  private readonly debounceMs: number;

  private watcher: FSWatcher | null = null;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentState: State | null = null;

  private changeHandlers: StateChangeHandler[] = [];
  private errorHandlers: StateErrorHandler[] = [];
  private readyHandlers: StateReadyHandler[] = [];

  constructor(options: StateReaderOptions = {}) {
    this.statePath =
      options.statePath ?? path.join(os.homedir(), '.multiclaude', 'state.json');
    this.debounceMs = options.debounceMs ?? 100;
  }

  /**
   * Register an event handler.
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
   * Remove an event handler.
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

  private emit(event: 'change', state: State): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: 'ready'): void;
  private emit(event: StateReaderEvent, data?: State | Error): void {
    switch (event) {
      case 'change':
        for (const handler of this.changeHandlers) {
          handler(data as State);
        }
        break;
      case 'error':
        for (const handler of this.errorHandlers) {
          handler(data as Error);
        }
        break;
      case 'ready':
        for (const handler of this.readyHandlers) {
          handler();
        }
        break;
    }
  }

  /**
   * Read the current state from disk.
   * @returns Parsed state or null if file doesn't exist
   */
  async read(): Promise<State | null> {
    try {
      const content = await fs.readFile(this.statePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      const result = safeParseState(data);

      if (!result.success) {
        throw new Error(`Invalid state file: ${result.error.message}`);
      }

      this.currentState = result.data;
      return result.data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.currentState = null;
        return null;
      }
      throw error;
    }
  }

  /**
   * Get the cached state without reading from disk.
   * Returns null if read() hasn't been called yet.
   */
  getCached(): State | null {
    return this.currentState;
  }

  /**
   * Check if the state file exists.
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.statePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start watching the state file for changes.
   * Emits 'change' event when state updates, with debouncing.
   */
  async watch(): Promise<void> {
    if (this.watcher !== null) {
      return; // Already watching
    }

    // Initial read
    try {
      await this.read();
    } catch (error) {
      this.emit('error', error as Error);
    }

    this.watcher = watch(this.statePath, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('change', () => {
      // Debounce rapid updates
      if (this.debounceTimeout !== null) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(() => {
        this.debounceTimeout = null;
        this.read()
          .then((state) => {
            if (state !== null) {
              this.emit('change', state);
            }
          })
          .catch((error: Error) => {
            this.emit('error', error);
          });
      }, this.debounceMs);
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.watcher.on('ready', () => {
      this.emit('ready');
    });
  }

  /**
   * Stop watching and clean up resources.
   */
  async close(): Promise<void> {
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.watcher !== null) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get all active workers across all repos.
   */
  getActiveWorkers(): Array<{
    repo: string;
    name: string;
    agent: Agent;
  }> {
    if (this.currentState === null) {
      return [];
    }

    const workers: Array<{ repo: string; name: string; agent: Agent }> = [];

    for (const [repoName, repo] of Object.entries(this.currentState.repos)) {
      for (const [agentName, agent] of Object.entries(repo.agents)) {
        if (agent.type === 'worker' && agent.pid > 0) {
          workers.push({ repo: repoName, name: agentName, agent });
        }
      }
    }

    return workers;
  }

  /**
   * Get all agents of a specific type.
   */
  getAgentsByType(type: Agent['type']): Array<{
    repo: string;
    name: string;
    agent: Agent;
  }> {
    if (this.currentState === null) {
      return [];
    }

    const agents: Array<{ repo: string; name: string; agent: Agent }> = [];

    for (const [repoName, repo] of Object.entries(this.currentState.repos)) {
      for (const [agentName, agent] of Object.entries(repo.agents)) {
        if (agent.type === type) {
          agents.push({ repo: repoName, name: agentName, agent });
        }
      }
    }

    return agents;
  }

  /**
   * Get recent task history across all repos, sorted by completion time.
   */
  getRecentTasks(limit = 10): Array<TaskHistoryEntry & { repo: string }> {
    if (this.currentState === null) {
      return [];
    }

    const tasks: Array<TaskHistoryEntry & { repo: string }> = [];

    for (const [repoName, repo] of Object.entries(this.currentState.repos)) {
      for (const entry of repo.task_history ?? []) {
        tasks.push({ ...entry, repo: repoName });
      }
    }

    // Sort by completed_at descending (most recent first)
    tasks.sort((a, b) => {
      const aTime = a.completed_at ?? a.created_at;
      const bTime = b.completed_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });

    return tasks.slice(0, limit);
  }

  /**
   * Get a specific repository.
   */
  getRepo(name: string): Repository | null {
    return this.currentState?.repos[name] ?? null;
  }

  /**
   * Calculate success rate for a repository.
   */
  getSuccessRate(repoName: string): number {
    const repo = this.getRepo(repoName);
    if (repo === null || repo.task_history === undefined || repo.task_history.length === 0) {
      return 0;
    }

    const merged = repo.task_history.filter((t) => t.status === 'merged').length;
    return (merged / repo.task_history.length) * 100;
  }

  /**
   * Find workers that have been idle for longer than the threshold.
   */
  getStuckWorkers(thresholdMinutes = 30): Array<{
    repo: string;
    name: string;
    agent: Agent;
    idleMinutes: number;
  }> {
    const now = Date.now();
    const threshold = thresholdMinutes * 60 * 1000;
    const stuck: Array<{
      repo: string;
      name: string;
      agent: Agent;
      idleMinutes: number;
    }> = [];

    for (const worker of this.getActiveWorkers()) {
      const lastActivity = worker.agent.last_nudge ?? worker.agent.created_at;
      const lastActivityTime = new Date(lastActivity).getTime();
      const idleTime = now - lastActivityTime;

      if (idleTime > threshold) {
        stuck.push({
          ...worker,
          idleMinutes: Math.floor(idleTime / 60000),
        });
      }
    }

    return stuck;
  }
}
