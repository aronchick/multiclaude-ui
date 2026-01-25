/**
 * DaemonClient - Communicate with the multiclaude daemon via Unix socket.
 *
 * This module provides a client for the daemon's socket API, enabling
 * programmatic control of repositories, agents, and tasks.
 */

import { createConnection, type Socket } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseSocketResponse, parseDaemonStatus, type DaemonStatus } from './schemas.js';
import type { SocketRequest, SocketResponse } from './types.js';

/**
 * Options for DaemonClient.
 */
export interface DaemonClientOptions {
  /** Path to daemon.sock. Defaults to ~/.multiclaude/daemon.sock */
  socketPath?: string;
  /** Timeout for socket operations in ms. Defaults to 30000 (30s). */
  timeout?: number;
}

/**
 * Default path to the daemon socket.
 */
export function defaultSocketPath(): string {
  return join(homedir(), '.multiclaude', 'daemon.sock');
}

/**
 * Error thrown when daemon operations fail.
 */
export class DaemonError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'DaemonError';
  }
}

/**
 * DaemonClient communicates with the multiclaude daemon via Unix socket.
 *
 * @example
 * ```typescript
 * const client = new DaemonClient();
 *
 * // Check if daemon is running
 * const isRunning = await client.ping();
 *
 * // Get status
 * const status = await client.status();
 * console.log(`Daemon PID: ${status.pid}`);
 *
 * // List repositories
 * const repos = await client.listRepos();
 *
 * // Spawn a worker
 * await client.addAgent('my-repo', 'clever-fox', 'worker', 'Add authentication');
 * ```
 */
export class DaemonClient {
  private readonly socketPath: string;
  private readonly timeout: number;

  constructor(options: DaemonClientOptions = {}) {
    this.socketPath = options.socketPath ?? defaultSocketPath();
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Send a raw command to the daemon.
   */
  async send<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    const request: SocketRequest = { command };
    if (args) {
      request.args = args;
    }

    const response = await this.sendRaw(request);
    const parsed = parseSocketResponse(response);

    if (!parsed.success) {
      throw new DaemonError(parsed.error ?? 'Unknown error', 'COMMAND_FAILED');
    }

    return parsed.data as T;
  }

  /**
   * Check if daemon is alive.
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.send<string>('ping');
      return result === 'pong';
    } catch {
      return false;
    }
  }

  /**
   * Get daemon status.
   */
  async status(): Promise<DaemonStatus> {
    const data = await this.send('status');
    return parseDaemonStatus(data);
  }

  /**
   * Stop the daemon gracefully.
   */
  async stop(): Promise<string> {
    return this.send<string>('stop');
  }

  /**
   * List all tracked repositories.
   */
  async listRepos(): Promise<string[]> {
    const data = await this.send<{ repos: string[] }>('list_repos');
    return data.repos;
  }

  /**
   * Add a new repository.
   */
  async addRepo(
    name: string,
    githubUrl: string,
    options?: {
      mergeQueueEnabled?: boolean;
      mergeQueueTrackMode?: 'all' | 'author' | 'assigned';
    }
  ): Promise<string> {
    return this.send<string>('add_repo', {
      name,
      github_url: githubUrl,
      merge_queue_enabled: options?.mergeQueueEnabled,
      merge_queue_track_mode: options?.mergeQueueTrackMode,
    });
  }

  /**
   * Remove a repository.
   */
  async removeRepo(name: string): Promise<string> {
    return this.send<string>('remove_repo', { name });
  }

  /**
   * Get repository configuration.
   */
  async getRepoConfig(name: string): Promise<{
    merge_queue_enabled: boolean;
    merge_queue_track_mode: string;
  }> {
    return this.send('get_repo_config', { name });
  }

  /**
   * Update repository configuration.
   */
  async updateRepoConfig(
    name: string,
    config: {
      mergeQueueEnabled?: boolean;
      mergeQueueTrackMode?: 'all' | 'author' | 'assigned';
    }
  ): Promise<string> {
    return this.send<string>('update_repo_config', {
      name,
      merge_queue_enabled: config.mergeQueueEnabled,
      merge_queue_track_mode: config.mergeQueueTrackMode,
    });
  }

  /**
   * Set the current/default repository.
   */
  async setCurrentRepo(name: string): Promise<string> {
    return this.send<string>('set_current_repo', { name });
  }

  /**
   * Get the current/default repository name.
   */
  async getCurrentRepo(): Promise<string> {
    return this.send<string>('get_current_repo');
  }

  /**
   * Clear the current/default repository.
   */
  async clearCurrentRepo(): Promise<string> {
    return this.send<string>('clear_current_repo');
  }

  /**
   * List all agents for a repository.
   */
  async listAgents(repo: string): Promise<Record<string, unknown>> {
    const data = await this.send<{ agents: Record<string, unknown> }>('list_agents', { repo });
    return data.agents;
  }

  /**
   * Add/spawn a new agent.
   */
  async addAgent(
    repo: string,
    name: string,
    type: 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review',
    task?: string
  ): Promise<string> {
    return this.send<string>('add_agent', {
      repo,
      name,
      type,
      task,
    });
  }

  /**
   * Remove/kill an agent.
   */
  async removeAgent(repo: string, name: string): Promise<string> {
    return this.send<string>('remove_agent', { repo, name });
  }

  /**
   * Mark a worker as completed.
   */
  async completeAgent(
    repo: string,
    name: string,
    options?: {
      summary?: string;
      failureReason?: string;
    }
  ): Promise<string> {
    return this.send<string>('complete_agent', {
      repo,
      name,
      summary: options?.summary,
      failure_reason: options?.failureReason,
    });
  }

  /**
   * Restart a crashed or stopped agent.
   */
  async restartAgent(repo: string, name: string): Promise<string> {
    return this.send<string>('restart_agent', { repo, name });
  }

  /**
   * Get task history for a repository.
   */
  async taskHistory(
    repo: string,
    limit?: number
  ): Promise<{
    history: Array<{
      name: string;
      task: string;
      status: string;
      pr_url?: string;
      pr_number?: number;
      created_at: string;
      completed_at?: string;
    }>;
  }> {
    return this.send('task_history', { repo, limit });
  }

  /**
   * Trigger immediate cleanup of dead agents.
   */
  async triggerCleanup(): Promise<string> {
    return this.send<string>('trigger_cleanup');
  }

  /**
   * Repair inconsistent state.
   */
  async repairState(): Promise<string> {
    return this.send<string>('repair_state');
  }

  /**
   * Trigger immediate message routing.
   */
  async routeMessages(): Promise<string> {
    return this.send<string>('route_messages');
  }

  /**
   * Send raw request to socket and return raw response.
   */
  private sendRaw(request: SocketRequest): Promise<SocketResponse> {
    return new Promise((resolve, reject) => {
      let socket: Socket | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (socket) {
          socket.destroy();
          socket = null;
        }
      };

      try {
        socket = createConnection(this.socketPath);

        timeoutId = setTimeout(() => {
          cleanup();
          reject(new DaemonError('Socket timeout', 'TIMEOUT'));
        }, this.timeout);

        socket.on('connect', () => {
          socket?.write(JSON.stringify(request) + '\n');
        });

        let data = '';
        socket.on('data', (chunk) => {
          data += chunk.toString();

          try {
            const response = JSON.parse(data) as SocketResponse;
            cleanup();
            resolve(response);
          } catch {
            // Incomplete JSON, wait for more data
          }
        });

        socket.on('error', (error) => {
          cleanup();
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new DaemonError('Daemon not running (socket not found)', 'DAEMON_NOT_RUNNING'));
          } else if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
            reject(new DaemonError('Daemon not accepting connections', 'CONNECTION_REFUSED'));
          } else {
            reject(new DaemonError(error.message, 'SOCKET_ERROR'));
          }
        });

        socket.on('close', () => {
          if (data && socket) {
            try {
              const response = JSON.parse(data) as SocketResponse;
              cleanup();
              resolve(response);
            } catch {
              cleanup();
              reject(new DaemonError('Invalid response from daemon', 'INVALID_RESPONSE'));
            }
          }
        });
      } catch (error) {
        cleanup();
        const err = error instanceof Error ? error : new Error(String(error));
        reject(new DaemonError(err.message, 'CONNECTION_ERROR'));
      }
    });
  }
}
