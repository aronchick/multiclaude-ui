/**
 * DaemonClient - Socket communication with multiclaude daemon
 */

import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import type { DaemonStatus, SocketRequest, SocketResponse } from './types.js';
import { parseDaemonStatus } from './schemas.js';

/** Configuration for DaemonClient */
export interface DaemonClientConfig {
  /** Path to the Unix socket. Defaults to ~/.multiclaude/daemon.sock */
  socketPath?: string;
  /** Connection timeout in milliseconds. Defaults to 5000 */
  timeout?: number;
}

/** Error thrown when daemon is not running */
export class DaemonNotRunningError extends Error {
  constructor() {
    super('Daemon is not running. Start with: multiclaude start');
    this.name = 'DaemonNotRunningError';
  }
}

/** Error thrown when a command fails */
export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandError';
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
 * console.log(`Repos: ${status.repos}, Agents: ${status.agents}`);
 *
 * // Spawn a worker
 * await client.addAgent('my-repo', 'clever-fox', 'worker', 'Fix login bug');
 * ```
 */
export class DaemonClient {
  private readonly socketPath: string;
  private readonly timeout: number;

  constructor(config: DaemonClientConfig = {}) {
    this.socketPath =
      config.socketPath ?? path.join(os.homedir(), '.multiclaude', 'daemon.sock');
    this.timeout = config.timeout ?? 5000;
  }

  /**
   * Send a raw request to the daemon.
   * Prefer using the typed methods (ping, status, etc.) instead.
   */
  async send<T = unknown>(request: SocketRequest): Promise<SocketResponse<T>> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.socketPath);
      let data = '';

      client.setTimeout(this.timeout);

      client.on('connect', () => {
        client.write(JSON.stringify(request) + '\n');
      });

      client.on('data', (chunk) => {
        data += chunk.toString();
        try {
          const response = JSON.parse(data) as SocketResponse<T>;
          client.end();
          resolve(response);
        } catch {
          // Incomplete JSON, wait for more data
        }
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error('Connection timeout'));
      });

      client.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED') {
          reject(new DaemonNotRunningError());
        } else {
          reject(err);
        }
      });

      client.on('close', () => {
        // If we haven't resolved yet, the connection closed unexpectedly
        if (!data) {
          reject(new Error('Connection closed unexpectedly'));
        }
      });
    });
  }

  /**
   * Helper to send a command and unwrap the response.
   * Throws CommandError if the command fails.
   */
  private async command<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    const response = await this.send<T>({ command, args });
    if (!response.success) {
      throw new CommandError(response.error ?? 'Unknown error');
    }
    return response.data as T;
  }

  // ============ Daemon Management ============

  /** Check if daemon is alive */
  async ping(): Promise<boolean> {
    try {
      const response = await this.send({ command: 'ping' });
      return response.success && response.data === 'pong';
    } catch {
      return false;
    }
  }

  /** Get daemon status */
  async status(): Promise<DaemonStatus> {
    const data = await this.command('status');
    return parseDaemonStatus(data);
  }

  /** Stop the daemon gracefully */
  async stop(): Promise<void> {
    await this.command('stop');
  }

  // ============ Repository Management ============

  /** List all tracked repositories */
  async listRepos(): Promise<string[]> {
    const data = await this.command<{ repos: string[] }>('list_repos');
    return data.repos;
  }

  /** Add a new repository */
  async addRepo(
    name: string,
    githubUrl: string,
    options: {
      mergeQueueEnabled?: boolean;
      mergeQueueTrackMode?: 'all' | 'author' | 'assigned';
    } = {}
  ): Promise<void> {
    await this.command('add_repo', {
      name,
      github_url: githubUrl,
      merge_queue_enabled: options.mergeQueueEnabled,
      merge_queue_track_mode: options.mergeQueueTrackMode,
    });
  }

  /** Remove a repository */
  async removeRepo(name: string): Promise<void> {
    await this.command('remove_repo', { name });
  }

  /** Set the current/default repository */
  async setCurrentRepo(name: string): Promise<void> {
    await this.command('set_current_repo', { name });
  }

  /** Get the current/default repository */
  async getCurrentRepo(): Promise<string | null> {
    try {
      return await this.command<string>('get_current_repo');
    } catch {
      return null;
    }
  }

  /** Clear the current/default repository */
  async clearCurrentRepo(): Promise<void> {
    await this.command('clear_current_repo');
  }

  // ============ Agent Management ============

  /** List all agents for a repository */
  async listAgents(repo: string): Promise<Record<string, unknown>> {
    const data = await this.command<{ agents: Record<string, unknown> }>('list_agents', { repo });
    return data.agents;
  }

  /** Add/spawn a new agent */
  async addAgent(
    repo: string,
    name: string,
    type: 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review',
    task?: string
  ): Promise<void> {
    await this.command('add_agent', { repo, name, type, task });
  }

  /** Remove/kill an agent */
  async removeAgent(repo: string, name: string): Promise<void> {
    await this.command('remove_agent', { repo, name });
  }

  /** Mark a worker as completed */
  async completeAgent(
    repo: string,
    name: string,
    options: { summary?: string; failureReason?: string } = {}
  ): Promise<void> {
    await this.command('complete_agent', {
      repo,
      name,
      summary: options.summary,
      failure_reason: options.failureReason,
    });
  }

  /** Restart a crashed or stopped agent */
  async restartAgent(repo: string, name: string): Promise<void> {
    await this.command('restart_agent', { repo, name });
  }

  // ============ Task History ============

  /** Get task history for a repository */
  async getTaskHistory(repo: string, limit = 0): Promise<unknown[]> {
    const data = await this.command<{ history: unknown[] }>('task_history', { repo, limit });
    return data.history;
  }

  // ============ Maintenance ============

  /** Trigger immediate cleanup of dead agents */
  async triggerCleanup(): Promise<void> {
    await this.command('trigger_cleanup');
  }

  /** Repair inconsistent state */
  async repairState(): Promise<void> {
    await this.command('repair_state');
  }

  /** Trigger immediate message routing */
  async routeMessages(): Promise<void> {
    await this.command('route_messages');
  }
}
