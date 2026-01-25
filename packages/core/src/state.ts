/**
 * StateReader - Watch and read multiclaude state file
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import chokidar from 'chokidar';
import type { State } from './types.js';
import { parseState, safeParseState } from './schemas.js';

/** Configuration for StateReader */
export interface StateReaderConfig {
  /** Path to state.json. Defaults to ~/.multiclaude/state.json */
  statePath?: string;
  /** Debounce delay in ms for rapid updates. Defaults to 100 */
  debounceMs?: number;
}

/** Events emitted by StateReader */
export interface StateReaderEvents {
  change: (state: State) => void;
  error: (error: Error) => void;
}

/**
 * Read and watch the multiclaude state file.
 *
 * The state file is the single source of truth for all multiclaude state.
 * This class provides:
 * - One-time reads with get()
 * - Live updates via watch() + 'change' events
 * - Automatic debouncing of rapid updates
 *
 * @example
 * ```typescript
 * const reader = new StateReader();
 *
 * // One-time read
 * const state = reader.get();
 * console.log(`Repos: ${Object.keys(state.repos).length}`);
 *
 * // Watch for changes
 * reader.on('change', (state) => {
 *   console.log('State updated!');
 * });
 * await reader.watch();
 *
 * // Stop watching
 * reader.close();
 * ```
 */
export class StateReader extends EventEmitter {
  private readonly statePath: string;
  private readonly debounceMs: number;
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private cachedState: State | null = null;

  constructor(config: StateReaderConfig = {}) {
    super();
    this.statePath =
      config.statePath ?? path.join(os.homedir(), '.multiclaude', 'state.json');
    this.debounceMs = config.debounceMs ?? 100;
  }

  // Type-safe event emitter overrides
  override on<K extends keyof StateReaderEvents>(
    event: K,
    listener: StateReaderEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof StateReaderEvents>(
    event: K,
    ...args: Parameters<StateReaderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Read the current state synchronously.
   * Returns null if the state file doesn't exist.
   */
  get(): State | null {
    try {
      const data = fs.readFileSync(this.statePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      const state = parseState(parsed);
      this.cachedState = state;
      return state;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Read the current state asynchronously.
   * Returns null if the state file doesn't exist.
   */
  async getAsync(): Promise<State | null> {
    try {
      const data = await fs.promises.readFile(this.statePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      const state = parseState(parsed);
      this.cachedState = state;
      return state;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Get the last successfully read state without reading from disk.
   * Returns null if no state has been read yet.
   */
  getCached(): State | null {
    return this.cachedState;
  }

  /**
   * Check if the state file exists.
   */
  exists(): boolean {
    return fs.existsSync(this.statePath);
  }

  /**
   * Start watching the state file for changes.
   * Emits 'change' events when the state is updated.
   */
  async watch(): Promise<void> {
    if (this.watcher) {
      return; // Already watching
    }

    this.watcher = chokidar.watch(this.statePath, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('change', () => {
      this.handleChange();
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    // Wait for watcher to be ready
    await new Promise<void>((resolve) => {
      this.watcher?.on('ready', resolve);
    });
  }

  /**
   * Stop watching the state file.
   */
  close(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Handle a file change event with debouncing.
   */
  private handleChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.emitChange();
    }, this.debounceMs);
  }

  /**
   * Read and emit the current state.
   */
  private emitChange(): void {
    try {
      const data = fs.readFileSync(this.statePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      const result = safeParseState(parsed);

      if (result.success) {
        this.cachedState = result.data;
        this.emit('change', result.data);
      } else {
        this.emit('error', new Error(`Invalid state: ${result.error.message}`));
      }
    } catch (err) {
      this.emit('error', err as Error);
    }
  }
}

// ============ Utility Functions ============

/**
 * Get all active workers across all repos.
 */
export function getActiveWorkers(state: State): Array<{
  repo: string;
  name: string;
  task: string | undefined;
  createdAt: string;
}> {
  const workers: Array<{
    repo: string;
    name: string;
    task: string | undefined;
    createdAt: string;
  }> = [];

  for (const [repoName, repo] of Object.entries(state.repos)) {
    for (const [agentName, agent] of Object.entries(repo.agents)) {
      if (agent.type === 'worker' && agent.pid > 0) {
        workers.push({
          repo: repoName,
          name: agentName,
          task: agent.task,
          createdAt: agent.created_at,
        });
      }
    }
  }

  return workers;
}

/**
 * Get recent task history across all repos.
 */
export function getRecentTasks(state: State, limit = 10): Array<{
  repo: string;
  name: string;
  task: string;
  status: string;
  prUrl?: string;
  completedAt?: string;
}> {
  const tasks: Array<{
    repo: string;
    name: string;
    task: string;
    status: string;
    prUrl?: string;
    completedAt?: string;
  }> = [];

  for (const [repoName, repo] of Object.entries(state.repos)) {
    for (const entry of repo.task_history ?? []) {
      tasks.push({
        repo: repoName,
        name: entry.name,
        task: entry.task,
        status: entry.status,
        prUrl: entry.pr_url,
        completedAt: entry.completed_at,
      });
    }
  }

  // Sort by completion time, most recent first
  tasks.sort((a, b) => {
    const aTime = a.completedAt ?? '';
    const bTime = b.completedAt ?? '';
    return bTime.localeCompare(aTime);
  });

  return tasks.slice(0, limit);
}

/**
 * Calculate task success rate for a repository.
 */
export function calculateSuccessRate(state: State, repoName: string): number {
  const repo = state.repos[repoName];
  if (!repo) return 0;

  const history = repo.task_history ?? [];
  const total = history.length;
  if (total === 0) return 0;

  const merged = history.filter((t) => t.status === 'merged').length;
  return (merged / total) * 100;
}
