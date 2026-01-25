/**
 * MessageReader - Watch message directories for inter-agent messages
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import { z } from 'zod';

/** Message schema */
const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  timestamp: z.string(),
  acknowledged: z.boolean().optional(),
});

/** Parsed message type */
export type Message = z.infer<typeof MessageSchema>;

export type MessageHandler = (message: Message, repo: string, agent: string) => void;
export type MessageErrorHandler = (error: Error) => void;

export interface MessageReaderOptions {
  /** Base path for messages (default: ~/.multiclaude/messages) */
  basePath?: string;
  /** Repository to watch (watches all if not specified) */
  repo?: string;
  /** Agent to watch (watches all if not specified) */
  agent?: string;
}

/**
 * MessageReader watches message directories for new inter-agent messages.
 *
 * Messages are stored at: ~/.multiclaude/messages/<repo>/<agent>/<message-id>.json
 *
 * @example
 * ```ts
 * const reader = new MessageReader({ repo: 'my-app' });
 * reader.on('message', (msg, repo, agent) => {
 *   console.log(`${repo}/${agent}: ${msg.from} -> ${msg.to}: ${msg.content}`);
 * });
 * await reader.start();
 * ```
 */
export class MessageReader {
  private readonly basePath: string;
  private readonly repo?: string;
  private readonly agent?: string;

  private watcher: FSWatcher | null = null;
  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: MessageErrorHandler[] = [];
  private knownMessages = new Set<string>();

  constructor(options: MessageReaderOptions = {}) {
    this.basePath = options.basePath ?? join(homedir(), '.multiclaude', 'messages');
    this.repo = options.repo;
    this.agent = options.agent;
  }

  /**
   * Register a handler for new messages
   */
  on(event: 'message', handler: MessageHandler): this;
  on(event: 'error', handler: MessageErrorHandler): this;
  on(event: 'message' | 'error', handler: MessageHandler | MessageErrorHandler): this {
    if (event === 'message') {
      this.messageHandlers.push(handler as MessageHandler);
    } else {
      this.errorHandlers.push(handler as MessageErrorHandler);
    }
    return this;
  }

  /**
   * Remove a handler
   */
  off(event: 'message', handler: MessageHandler): this;
  off(event: 'error', handler: MessageErrorHandler): this;
  off(event: 'message' | 'error', handler: MessageHandler | MessageErrorHandler): this {
    if (event === 'message') {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    } else {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    }
    return this;
  }

  /**
   * Start watching for messages
   */
  async start(): Promise<void> {
    // Build watch path
    let watchPath = this.basePath;
    if (this.repo) {
      watchPath = join(watchPath, this.repo);
      if (this.agent) {
        watchPath = join(watchPath, this.agent);
      }
    }

    // Scan existing messages first
    await this.scanExisting();

    // Start watching
    this.watcher = watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      depth: this.repo ? (this.agent ? 0 : 1) : 2,
    });

    this.watcher.on('add', (filePath) => {
      if (filePath.endsWith('.json')) {
        this.handleNewFile(filePath).catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emitError(err);
        });
      }
    });

    this.watcher.on('error', (error) => {
      this.emitError(error);
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
   * Get all pending (unacknowledged) messages for a repo/agent
   */
  async getPendingMessages(repo: string, agent: string): Promise<Message[]> {
    const messagesDir = join(this.basePath, repo, agent);
    const messages: Message[] = [];

    try {
      const files = await readdir(messagesDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const content = await readFile(join(messagesDir, file), 'utf-8');
          const message = MessageSchema.parse(JSON.parse(content));

          if (!message.acknowledged) {
            messages.push(message);
          }
        } catch {
          // Skip invalid message files
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return messages;
  }

  private async scanExisting(): Promise<void> {
    try {
      const repos = this.repo ? [this.repo] : await this.listDirs(this.basePath);

      for (const repo of repos) {
        const repoPath = join(this.basePath, repo);
        const agents = this.agent ? [this.agent] : await this.listDirs(repoPath);

        for (const agent of agents) {
          const agentPath = join(repoPath, agent);
          try {
            const files = await readdir(agentPath);

            for (const file of files) {
              if (file.endsWith('.json')) {
                const filePath = join(agentPath, file);
                this.knownMessages.add(filePath);
              }
            }
          } catch {
            // Directory doesn't exist
          }
        }
      }
    } catch {
      // Base path doesn't exist
    }
  }

  private async listDirs(path: string): Promise<string[]> {
    try {
      const entries = await readdir(path);
      const dirs: string[] = [];

      for (const entry of entries) {
        const stats = await stat(join(path, entry));
        if (stats.isDirectory()) {
          dirs.push(entry);
        }
      }

      return dirs;
    } catch {
      return [];
    }
  }

  private async handleNewFile(filePath: string): Promise<void> {
    if (this.knownMessages.has(filePath)) {
      return;
    }
    this.knownMessages.add(filePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      const message = MessageSchema.parse(JSON.parse(content));

      // Extract repo and agent from path
      // Path: basePath/repo/agent/message-id.json
      const relativePath = filePath.slice(this.basePath.length + 1);
      const parts = relativePath.split('/');

      if (parts.length >= 3) {
        const [repo, agent] = parts;
        this.emitMessage(message, repo!, agent!);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitError(err);
    }
  }

  private emitMessage(message: Message, repo: string, agent: string): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message, repo, agent);
      } catch (error) {
        console.error('Error in message handler:', error);
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
 * Get default messages path
 */
export function getDefaultMessagesPath(): string {
  return join(homedir(), '.multiclaude', 'messages');
}
