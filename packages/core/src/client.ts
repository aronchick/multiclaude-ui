/**
 * DaemonClient - Unix socket communication with multiclaude daemon.
 *
 * Connects to ~/.multiclaude/daemon.sock and sends JSON-RPC requests.
 * Reference: multiclaude/docs/extending/SOCKET_API.md
 */

import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import type {
  SocketRequest,
  SocketResponse,
  DaemonStatus,
  ListReposResponse,
  ListAgentsResponse,
  TaskHistoryResponse,
  Agent,
} from './types.js';

/**
 * Options for DaemonClient
 */
export interface DaemonClientOptions {
  /** Path to the Unix socket. Defaults to ~/.multiclaude/daemon.sock */
  socketPath?: string;
  /** Connection timeout in milliseconds. Default: 5000 */
  timeout?: number;
}

/**
 * Error thrown when daemon communication fails
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
 * Client for communicating with the multiclaude daemon via Unix socket.
 *
 * @example
 * ```typescript
 * const client = new DaemonClient();
 *
 * // Check if daemon is running
 * const isRunning = await client.ping();
 *
 * // Get daemon status
 * const status = await client.status();
 * console.log(`Tracking ${status.repos} repos with ${status.agents} agents`);
 *
 * // List workers for a repo
 * const agents = await client.listAgents('my-repo');
 * ```
 */
export class DaemonClient {
  private readonly socketPath: string;
  private readonly timeout: number;

  constructor(options: DaemonClientOptions = {}) {
    this.socketPath =
      options.socketPath ?? path.join(os.homedir(), '.multiclaude', 'daemon.sock');
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * Send a raw request to the daemon and get the response.
   * @throws DaemonError if communication fails or daemon returns an error
   */
  async send<T = unknown>(request: SocketRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath);
      let data = '';
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        client.destroy();
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new DaemonError('Connection timeout', 'TIMEOUT'));
      }, this.timeout);

      client.on('connect', () => {
        client.write(JSON.stringify(request) + '\n');
      });

      client.on('data', (chunk) => {
        data += chunk.toString();

        // Try to parse complete JSON response
        try {
          const response = JSON.parse(data) as SocketResponse<T>;
          cleanup();

          if (!response.success) {
            reject(new DaemonError(response.error ?? 'Unknown error', 'COMMAND_FAILED'));
            return;
          }

          resolve(response.data as T);
        } catch {
          // Incomplete JSON, wait for more data
        }
      });

      client.on('error', (err) => {
        cleanup();
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new DaemonError('Daemon not running (socket not found)', 'NOT_RUNNING'));
        } else if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
          reject(new DaemonError('Daemon not accepting connections', 'CONNECTION_REFUSED'));
        } else {
          reject(new DaemonError(`Socket error: ${err.message}`, 'SOCKET_ERROR'));
        }
      });

      client.on('close', () => {
        cleanup();
        // If we haven't resolved/rejected yet, the connection was closed unexpectedly
        if (data === '') {
          reject(new DaemonError('Connection closed unexpectedly', 'CONNECTION_CLOSED'));
        }
      });
    });
  }

  // ==========================================================================
  // Daemon Management
  // ==========================================================================

  /**
   * Check if daemon is alive.
   * @returns true if daemon responds to ping
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.send<string>({ command: 'ping' });
      return response === 'pong';
    } catch {
      return false;
    }
  }

  /**
   * Get daemon status including repo and agent counts.
   */
  async status(): Promise<DaemonStatus> {
    return this.send<DaemonStatus>({ command: 'status' });
  }

  /**
   * Stop the daemon gracefully.
   */
  async stop(): Promise<void> {
    await this.send({ command: 'stop' });
  }

  // ==========================================================================
  // Repository Management
  // ==========================================================================

  /**
   * List all tracked repository names.
   */
  async listRepos(): Promise<string[]> {
    const response = await this.send<ListReposResponse>({ command: 'list_repos' });
    return response.repos;
  }

  /**
   * Add a new repository.
   */
  async addRepo(options: {
    name: string;
    githubUrl: string;
    mergeQueueEnabled?: boolean;
    mergeQueueTrackMode?: 'all' | 'author' | 'assigned';
  }): Promise<void> {
    await this.send({
      command: 'add_repo',
      args: {
        name: options.name,
        github_url: options.githubUrl,
        merge_queue_enabled: options.mergeQueueEnabled,
        merge_queue_track_mode: options.mergeQueueTrackMode,
      },
    });
  }

  /**
   * Remove a repository.
   */
  async removeRepo(name: string): Promise<void> {
    await this.send({
      command: 'remove_repo',
      args: { name },
    });
  }

  /**
   * Set the current/default repository.
   */
  async setCurrentRepo(name: string): Promise<void> {
    await this.send({
      command: 'set_current_repo',
      args: { name },
    });
  }

  /**
   * Get the current/default repository name.
   */
  async getCurrentRepo(): Promise<string | null> {
    try {
      return await this.send<string>({ command: 'get_current_repo' });
    } catch {
      return null;
    }
  }

  /**
   * Clear the current/default repository.
   */
  async clearCurrentRepo(): Promise<void> {
    await this.send({ command: 'clear_current_repo' });
  }

  // ==========================================================================
  // Agent Management
  // ==========================================================================

  /**
   * List all agents for a repository.
   */
  async listAgents(repo: string): Promise<Record<string, Agent>> {
    const response = await this.send<ListAgentsResponse>({
      command: 'list_agents',
      args: { repo },
    });
    return response.agents;
  }

  /**
   * Spawn a new agent.
   */
  async addAgent(options: {
    repo: string;
    name: string;
    type: 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review';
    task?: string;
  }): Promise<void> {
    await this.send({
      command: 'add_agent',
      args: {
        repo: options.repo,
        name: options.name,
        type: options.type,
        task: options.task,
      },
    });
  }

  /**
   * Remove/kill an agent.
   */
  async removeAgent(repo: string, name: string): Promise<void> {
    await this.send({
      command: 'remove_agent',
      args: { repo, name },
    });
  }

  /**
   * Mark a worker as completed.
   */
  async completeAgent(options: {
    repo: string;
    name: string;
    summary?: string;
    failureReason?: string;
  }): Promise<void> {
    await this.send({
      command: 'complete_agent',
      args: {
        repo: options.repo,
        name: options.name,
        summary: options.summary,
        failure_reason: options.failureReason,
      },
    });
  }

  /**
   * Restart a crashed or stopped agent.
   */
  async restartAgent(repo: string, name: string): Promise<void> {
    await this.send({
      command: 'restart_agent',
      args: { repo, name },
    });
  }

  // ==========================================================================
  // Task History
  // ==========================================================================

  /**
   * Get task history for a repository.
   * @param repo Repository name
   * @param limit Maximum entries to return (0 = all)
   */
  async getTaskHistory(repo: string, limit = 0): Promise<TaskHistoryResponse['history']> {
    const response = await this.send<TaskHistoryResponse>({
      command: 'task_history',
      args: { repo, limit },
    });
    return response.history;
  }

  // ==========================================================================
  // Maintenance
  // ==========================================================================

  /**
   * Trigger immediate cleanup of dead agents.
   */
  async triggerCleanup(): Promise<void> {
    await this.send({ command: 'trigger_cleanup' });
  }

  /**
   * Repair inconsistent state.
   */
  async repairState(): Promise<void> {
    await this.send({ command: 'repair_state' });
  }

  /**
   * Trigger immediate message routing.
   */
  async routeMessages(): Promise<void> {
    await this.send({ command: 'route_messages' });
  }
}
