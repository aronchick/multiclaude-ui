/**
 * DaemonClient - Unix socket communication with multiclaude daemon
 */

import { createConnection, type Socket } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type {
  SocketRequest,
  SocketResponse,
  DaemonStatus,
  TaskHistoryEntry,
  Agent,
} from './types.js';
import { parseSocketResponse, parseDaemonStatus } from './schemas.js';

export interface DaemonClientOptions {
  /** Path to daemon socket (default: ~/.multiclaude/daemon.sock) */
  socketPath?: string;
  /** Connection timeout in ms (default: 5000) */
  connectTimeout?: number;
  /** Response timeout in ms (default: 30000) */
  responseTimeout?: number;
}

export class DaemonConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DaemonConnectionError';
  }
}

export class DaemonCommandError extends Error {
  constructor(
    message: string,
    public readonly command: string
  ) {
    super(message);
    this.name = 'DaemonCommandError';
  }
}

/**
 * Client for communicating with the multiclaude daemon via Unix socket.
 *
 * @example
 * ```ts
 * const client = new DaemonClient();
 *
 * // Check daemon status
 * const status = await client.status();
 * console.log(`Daemon PID: ${status.pid}`);
 *
 * // Spawn a worker
 * await client.spawnWorker('my-repo', 'Fix login bug');
 * ```
 */
export class DaemonClient {
  private readonly socketPath: string;
  private readonly connectTimeout: number;
  private readonly responseTimeout: number;

  constructor(options: DaemonClientOptions = {}) {
    this.socketPath = options.socketPath ?? join(homedir(), '.multiclaude', 'daemon.sock');
    this.connectTimeout = options.connectTimeout ?? 5000;
    this.responseTimeout = options.responseTimeout ?? 30000;
  }

  /**
   * Send a raw command to the daemon
   */
  async send<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    const request: SocketRequest = { command };
    if (args) {
      request.args = args;
    }

    const response = await this.sendRaw(request);

    if (!response.success) {
      throw new DaemonCommandError(response.error ?? 'Unknown error', command);
    }

    return response.data as T;
  }

  /**
   * Send a raw request and get the raw response
   */
  private async sendRaw(request: SocketRequest): Promise<SocketResponse> {
    return new Promise((resolve, reject) => {
      let socket: Socket | null = null;
      let data = '';
      let connectTimer: ReturnType<typeof setTimeout> | null = null;
      let responseTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (connectTimer) clearTimeout(connectTimer);
        if (responseTimer) clearTimeout(responseTimer);
        if (socket) {
          socket.removeAllListeners();
          socket.destroy();
        }
      };

      try {
        socket = createConnection(this.socketPath);

        // Connection timeout
        connectTimer = setTimeout(() => {
          cleanup();
          reject(
            new DaemonConnectionError(
              `Connection timeout after ${this.connectTimeout}ms. Is the daemon running?`
            )
          );
        }, this.connectTimeout);

        socket.on('connect', () => {
          if (connectTimer) {
            clearTimeout(connectTimer);
            connectTimer = null;
          }

          // Response timeout
          responseTimer = setTimeout(() => {
            cleanup();
            reject(
              new DaemonConnectionError(`Response timeout after ${this.responseTimeout}ms`)
            );
          }, this.responseTimeout);

          // Send request
          socket!.write(JSON.stringify(request) + '\n');
        });

        socket.on('data', (chunk) => {
          data += chunk.toString();

          // Try to parse response
          try {
            const response = parseSocketResponse(JSON.parse(data));
            cleanup();
            resolve(response);
          } catch {
            // Incomplete data, wait for more
          }
        });

        socket.on('error', (error: Error) => {
          cleanup();
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(
              new DaemonConnectionError(
                `Daemon socket not found at ${this.socketPath}. Is the daemon running?`
              )
            );
          } else if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
            reject(
              new DaemonConnectionError(
                'Connection refused. The daemon may have crashed.'
              )
            );
          } else {
            reject(new DaemonConnectionError(error.message));
          }
        });

        socket.on('close', () => {
          // If we haven't resolved yet, try to parse what we have
          if (data) {
            try {
              const response = parseSocketResponse(JSON.parse(data));
              cleanup();
              resolve(response);
              return;
            } catch {
              // Incomplete response
            }
          }
          cleanup();
          reject(new DaemonConnectionError('Connection closed unexpectedly'));
        });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  // ============ Daemon Management ============

  /**
   * Check if daemon is alive
   */
  async ping(): Promise<boolean> {
    try {
      await this.send('ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get daemon status
   */
  async status(): Promise<DaemonStatus> {
    const data = await this.send('status');
    return parseDaemonStatus(data);
  }

  /**
   * Stop the daemon gracefully
   */
  async stop(): Promise<void> {
    await this.send('stop');
  }

  // ============ Repository Management ============

  /**
   * List all tracked repositories
   */
  async listRepos(): Promise<string[]> {
    const data = await this.send<{ repos: string[] }>('list_repos');
    return data.repos;
  }

  /**
   * Add a new repository
   */
  async addRepo(
    name: string,
    githubUrl: string,
    options?: {
      mergeQueueEnabled?: boolean;
      mergeQueueTrackMode?: 'all' | 'author' | 'assigned';
    }
  ): Promise<void> {
    await this.send('add_repo', {
      name,
      github_url: githubUrl,
      merge_queue_enabled: options?.mergeQueueEnabled,
      merge_queue_track_mode: options?.mergeQueueTrackMode,
    });
  }

  /**
   * Remove a repository
   */
  async removeRepo(name: string): Promise<void> {
    await this.send('remove_repo', { name });
  }

  /**
   * Set the current/default repository
   */
  async setCurrentRepo(name: string): Promise<void> {
    await this.send('set_current_repo', { name });
  }

  /**
   * Get the current/default repository name
   */
  async getCurrentRepo(): Promise<string | null> {
    try {
      return await this.send<string>('get_current_repo');
    } catch {
      return null;
    }
  }

  // ============ Agent Management ============

  /**
   * List all agents for a repository
   */
  async listAgents(repo: string): Promise<Record<string, Agent>> {
    const data = await this.send<{ agents: Record<string, Agent> }>('list_agents', { repo });
    return data.agents;
  }

  /**
   * Spawn a new worker agent
   */
  async spawnWorker(repo: string, task: string, name?: string): Promise<string> {
    const data = await this.send<string>('add_agent', {
      repo,
      name: name ?? this.generateWorkerName(),
      type: 'worker',
      task,
    });
    return data;
  }

  /**
   * Remove/kill an agent
   */
  async removeAgent(repo: string, name: string): Promise<void> {
    await this.send('remove_agent', { repo, name });
  }

  /**
   * Mark a worker as completed
   */
  async completeAgent(
    repo: string,
    name: string,
    options?: {
      summary?: string;
      failureReason?: string;
    }
  ): Promise<void> {
    await this.send('complete_agent', {
      repo,
      name,
      summary: options?.summary,
      failure_reason: options?.failureReason,
    });
  }

  /**
   * Restart a crashed agent
   */
  async restartAgent(repo: string, name: string): Promise<void> {
    await this.send('restart_agent', { repo, name });
  }

  // ============ Task History ============

  /**
   * Get task history for a repository
   */
  async getTaskHistory(repo: string, limit?: number): Promise<TaskHistoryEntry[]> {
    const data = await this.send<{ history: TaskHistoryEntry[] }>('task_history', {
      repo,
      limit: limit ?? 0,
    });
    return data.history;
  }

  // ============ Maintenance ============

  /**
   * Trigger immediate cleanup of dead agents
   */
  async triggerCleanup(): Promise<void> {
    await this.send('trigger_cleanup');
  }

  /**
   * Repair inconsistent state
   */
  async repairState(): Promise<void> {
    await this.send('repair_state');
  }

  /**
   * Trigger immediate message routing
   */
  async routeMessages(): Promise<void> {
    await this.send('route_messages');
  }

  // ============ Helpers ============

  private generateWorkerName(): string {
    const adjectives = ['clever', 'brave', 'swift', 'keen', 'bold', 'calm', 'wise', 'quick'];
    const animals = ['fox', 'lion', 'eagle', 'wolf', 'bear', 'hawk', 'owl', 'tiger'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];

    return `${adj}-${animal}`;
  }
}

/**
 * Get default socket path
 */
export function getDefaultSocketPath(): string {
  return join(homedir(), '.multiclaude', 'daemon.sock');
}
