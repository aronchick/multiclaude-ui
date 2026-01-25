/**
 * MessageReader - Watch multiclaude message directories
 *
 * Messages are JSON files in ~/.multiclaude/messages/<repo>/<agent>/
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import { z } from 'zod';

/**
 * Default messages directory
 */
export const DEFAULT_MESSAGES_PATH = join(homedir(), '.multiclaude', 'messages');

/**
 * Message schema (from internal/messages/manager.go)
 */
export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  created_at: z.string(),
  acknowledged: z.boolean().optional(),
  acknowledged_at: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Event types for MessageReader
 */
export type MessageReaderEvent = 'message' | 'error' | 'ready';

/**
 * Event handlers
 */
export type MessageHandler = (message: Message, repo: string, agent: string) => void;
export type MessageErrorHandler = (error: Error) => void;
export type MessageReadyHandler = () => void;

/**
 * Options for MessageReader
 */
export interface MessageReaderOptions {
  /** Path to messages directory (default: ~/.multiclaude/messages) */
  messagesPath?: string;
  /** Only watch specific repo (optional) */
  repo?: string;
  /** Only watch specific agent (optional) */
  agent?: string;
}

/**
 * Reactive reader for multiclaude messages
 *
 * @example
 * ```ts
 * const reader = new MessageReader();
 *
 * reader.on('message', (message, repo, agent) => {
 *   console.log(`New message for ${agent} in ${repo}:`, message.content);
 * });
 *
 * await reader.start();
 * ```
 */
export class MessageReader {
  private readonly messagesPath: string;
  private readonly repoFilter?: string;
  private readonly agentFilter?: string;

  private watcher: FSWatcher | null = null;
  private seenMessages: Set<string> = new Set();

  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: MessageErrorHandler[] = [];
  private readyHandlers: MessageReadyHandler[] = [];

  constructor(options: MessageReaderOptions = {}) {
    this.messagesPath = options.messagesPath ?? DEFAULT_MESSAGES_PATH;
    this.repoFilter = options.repo;
    this.agentFilter = options.agent;
  }

  /**
   * Register an event handler
   */
  on(event: 'message', handler: MessageHandler): this;
  on(event: 'error', handler: MessageErrorHandler): this;
  on(event: 'ready', handler: MessageReadyHandler): this;
  on(
    event: MessageReaderEvent,
    handler: MessageHandler | MessageErrorHandler | MessageReadyHandler
  ): this {
    switch (event) {
      case 'message':
        this.messageHandlers.push(handler as MessageHandler);
        break;
      case 'error':
        this.errorHandlers.push(handler as MessageErrorHandler);
        break;
      case 'ready':
        this.readyHandlers.push(handler as MessageReadyHandler);
        break;
    }
    return this;
  }

  /**
   * Remove an event handler
   */
  off(event: 'message', handler: MessageHandler): this;
  off(event: 'error', handler: MessageErrorHandler): this;
  off(event: 'ready', handler: MessageReadyHandler): this;
  off(
    event: MessageReaderEvent,
    handler: MessageHandler | MessageErrorHandler | MessageReadyHandler
  ): this {
    switch (event) {
      case 'message':
        this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
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
   * Start watching for new messages
   */
  async start(): Promise<void> {
    if (this.watcher) {
      return;
    }

    // Build watch path based on filters
    let watchPath = this.messagesPath;
    if (this.repoFilter) {
      watchPath = join(watchPath, this.repoFilter);
      if (this.agentFilter) {
        watchPath = join(watchPath, this.agentFilter);
      }
    }

    // Scan existing messages to mark as seen
    await this.scanExistingMessages();

    // Watch for new message files
    this.watcher = watch(join(watchPath, '**/*.json'), {
      persistent: true,
      ignoreInitial: true,
      depth: this.repoFilter && this.agentFilter ? 0 : this.repoFilter ? 1 : 2,
    });

    this.watcher.on('add', (filePath) => {
      void this.handleNewMessage(filePath);
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
   * Stop watching for messages
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Get all pending (unacknowledged) messages
   */
  async getPendingMessages(): Promise<Array<{ message: Message; repo: string; agent: string }>> {
    const results: Array<{ message: Message; repo: string; agent: string }> = [];

    if (!existsSync(this.messagesPath)) {
      return results;
    }

    const repos = this.repoFilter ? [this.repoFilter] : await readdir(this.messagesPath);

    for (const repo of repos) {
      const repoPath = join(this.messagesPath, repo);
      if (!existsSync(repoPath)) continue;

      const agents = this.agentFilter ? [this.agentFilter] : await readdir(repoPath);

      for (const agent of agents) {
        const agentPath = join(repoPath, agent);
        if (!existsSync(agentPath)) continue;

        const files = await readdir(agentPath);

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          try {
            const content = await readFile(join(agentPath, file), 'utf-8');
            const message = MessageSchema.parse(JSON.parse(content));

            if (!message.acknowledged) {
              results.push({ message, repo, agent });
            }
          } catch {
            // Skip invalid message files
          }
        }
      }
    }

    return results;
  }

  private async scanExistingMessages(): Promise<void> {
    if (!existsSync(this.messagesPath)) {
      return;
    }

    const repos = this.repoFilter ? [this.repoFilter] : await readdir(this.messagesPath);

    for (const repo of repos) {
      const repoPath = join(this.messagesPath, repo);
      if (!existsSync(repoPath)) continue;

      const agents = this.agentFilter ? [this.agentFilter] : await readdir(repoPath);

      for (const agent of agents) {
        const agentPath = join(repoPath, agent);
        if (!existsSync(agentPath)) continue;

        const files = await readdir(agentPath);

        for (const file of files) {
          if (file.endsWith('.json')) {
            this.seenMessages.add(join(agentPath, file));
          }
        }
      }
    }
  }

  private async handleNewMessage(filePath: string): Promise<void> {
    // Skip if we've already seen this message
    if (this.seenMessages.has(filePath)) {
      return;
    }
    this.seenMessages.add(filePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      const message = MessageSchema.parse(JSON.parse(content));

      // Extract repo and agent from path
      // Path format: .../messages/<repo>/<agent>/<message-id>.json
      const parts = filePath.split('/');
      const agent = parts[parts.length - 2];
      const repo = parts[parts.length - 3];

      // Apply filters
      if (this.repoFilter && repo !== this.repoFilter) return;
      if (this.agentFilter && agent !== this.agentFilter) return;

      this.emitMessage(message, repo, agent);
    } catch (err) {
      this.emitError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private emitMessage(message: Message, repo: string, agent: string): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message, repo, agent);
      } catch (err) {
        console.error('Error in message handler:', err);
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
