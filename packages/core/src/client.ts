/**
 * DaemonClient - Unix socket client for multiclaude daemon
 *
 * Provides programmatic access to daemon operations via the socket API.
 */

import { Socket, createConnection } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SocketRequest, SocketResponse, DaemonStatus, State } from './types.js';
import { parseSocketResponse, DaemonStatusSchema } from './schemas.js';

/**
 * Default socket path
 */
export const DEFAULT_SOCKET_PATH = join(homedir(), '.multiclaude', 'daemon.sock');

/**
 * Options for DaemonClient
 */
export interface DaemonClientOptions {
  /** Path to the daemon socket (default: ~/.multiclaude/daemon.sock) */
  socketPath?: string;
  /** Connection timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Client for communicating with the multiclaude daemon via Unix socket
 */
export class DaemonClient {
  private readonly socketPath: string;
  private readonly timeout: number;

  constructor(options: DaemonClientOptions = {}) {
    this.socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * Send a command to the daemon and get the response
   */
  async send<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    const request: SocketRequest = { command };
    if (args) {
      request.args = args;
    }

    const response = await this.sendRaw(request);

    if (!response.success) {
      throw new Error(response.error ?? 'Unknown daemon error');
    }

    return response.data as T;
  }

  /**
   * Send a raw request and get the raw response
   */
  async sendRaw(request: SocketRequest): Promise<SocketResponse> {
    return new Promise((resolve, reject) => {
      let data = '';
      let socket: Socket | null = null;

      const cleanup = () => {
        if (socket) {
          socket.removeAllListeners();
          socket.destroy();
          socket = null;
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Connection timeout after ${this.timeout}ms`));
      }, this.timeout);

      try {
        socket = createConnection(this.socketPath);

        socket.on('connect', () => {
          socket?.write(JSON.stringify(request) + '\n');
        });

        socket.on('data', (chunk) => {
          data += chunk.toString();

          // Try to parse complete response
          try {
            const response = parseSocketResponse(JSON.parse(data));
            clearTimeout(timeoutId);
            cleanup();
            resolve(response);
          } catch {
            // Incomplete JSON, wait for more data
          }
        });

        socket.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();

          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new Error('Daemon not running (socket not found)'));
          } else if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
            reject(new Error('Daemon not responding (connection refused)'));
          } else {
            reject(err);
          }
        });

        socket.on('close', () => {
          clearTimeout(timeoutId);

          if (data) {
            try {
              const response = parseSocketResponse(JSON.parse(data));
              resolve(response);
            } catch (err) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          }
        });
      } catch (err) {
        clearTimeout(timeoutId);
        cleanup();
        reject(err);
      }
    });
  }

  // ============================================================
  // Convenience methods for common operations
  // ============================================================

  /**
   * Check if daemon is alive
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.send<string>('ping');
      return response === 'pong';
    } catch {
      return false;
    }
  }

  /**
   * Get daemon status
   */
  async status(): Promise<DaemonStatus> {
    const data = await this.send('status');
    return DaemonStatusSchema.parse(data);
  }

  /**
   * List all tracked repositories
   */
  async listRepos(): Promise<string[]> {
    const data = await this.send<{ repos: string[] }>('list_repos');
    return data.repos;
  }

  /**
   * List agents for a repository
   */
  async listAgents(repo: string): Promise<State['repos'][string]['agents']> {
    const data = await this.send<{ agents: State['repos'][string]['agents'] }>('list_agents', {
      repo,
    });
    return data.agents;
  }

  /**
   * Get task history for a repository
   */
  async taskHistory(repo: string, limit = 0) {
    const data = await this.send<{ history: State['repos'][string]['task_history'] }>(
      'task_history',
      { repo, limit }
    );
    return data.history ?? [];
  }

  /**
   * Spawn a new worker agent
   */
  async spawnWorker(repo: string, name: string, task: string): Promise<void> {
    await this.send('add_agent', {
      repo,
      name,
      type: 'worker',
      task,
    });
  }

  /**
   * Remove an agent
   */
  async removeAgent(repo: string, name: string): Promise<void> {
    await this.send('remove_agent', { repo, name });
  }

  /**
   * Trigger cleanup of dead agents
   */
  async triggerCleanup(): Promise<void> {
    await this.send('trigger_cleanup');
  }

  /**
   * Trigger message routing
   */
  async routeMessages(): Promise<void> {
    await this.send('route_messages');
  }

  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    await this.send('stop');
  }
}

/**
 * Check if daemon is running (convenience function)
 */
export async function isDaemonRunning(socketPath?: string): Promise<boolean> {
  const client = new DaemonClient({ socketPath });
  return client.ping();
}
