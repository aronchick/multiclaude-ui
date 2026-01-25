/**
 * MessageReader - Watch inter-agent message directories.
 *
 * Messages in multiclaude are JSON files in ~/.multiclaude/messages/<repo>/<agent>/
 * This reader watches for new messages and emits events.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import { z } from 'zod';

/**
 * Message schema matching multiclaude internal/messages format
 */
export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  timestamp: z.string().datetime({ offset: true }).or(z.string()),
  repo: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Options for MessageReader
 */
export interface MessageReaderOptions {
  /** Base messages directory. Defaults to ~/.multiclaude/messages */
  messagesDir?: string;
  /** Filter messages for a specific repo */
  repo?: string;
  /** Filter messages for a specific agent */
  agent?: string;
}

/**
 * Event types emitted by MessageReader
 */
export type MessageReaderEvent = 'message' | 'error' | 'ready';

export type MessageHandler = (message: Message, filePath: string) => void;
export type MessageErrorHandler = (error: Error) => void;
export type MessageReadyHandler = () => void;

/**
 * Watch for new inter-agent messages.
 *
 * @example
 * ```typescript
 * const reader = new MessageReader({ repo: 'my-repo' });
 *
 * reader.on('message', (msg, path) => {
 *   console.log(`New message from ${msg.from}: ${msg.content}`);
 * });
 *
 * await reader.watch();
 * ```
 */
export class MessageReader {
  private readonly messagesDir: string;
  private readonly repo?: string;
  private readonly agent?: string;

  private watcher: FSWatcher | null = null;
  private seenFiles = new Set<string>();

  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: MessageErrorHandler[] = [];
  private readyHandlers: MessageReadyHandler[] = [];

  constructor(options: MessageReaderOptions = {}) {
    this.messagesDir = options.messagesDir ?? path.join(os.homedir(), '.multiclaude', 'messages');
    this.repo = options.repo;
    this.agent = options.agent;
  }

  /**
   * Register an event handler.
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
   * Remove an event handler.
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

  private emit(event: 'message', message: Message, filePath: string): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: 'ready'): void;
  private emit(event: MessageReaderEvent, data?: Message | Error, extra?: string): void {
    switch (event) {
      case 'message':
        for (const handler of this.messageHandlers) {
          handler(data as Message, extra!);
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
   * Get the watch path based on filters.
   */
  private getWatchPath(): string {
    if (this.repo !== undefined && this.agent !== undefined) {
      return path.join(this.messagesDir, this.repo, this.agent);
    }
    if (this.repo !== undefined) {
      return path.join(this.messagesDir, this.repo);
    }
    return this.messagesDir;
  }

  /**
   * Read and parse a message file.
   */
  async readMessage(filePath: string): Promise<Message | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      const result = MessageSchema.safeParse(data);

      if (!result.success) {
        return null;
      }

      return result.data;
    } catch {
      return null;
    }
  }

  /**
   * List all pending messages.
   */
  async listMessages(): Promise<Array<{ message: Message; filePath: string }>> {
    const messages: Array<{ message: Message; filePath: string }> = [];
    const watchPath = this.getWatchPath();

    try {
      await this.scanDirectory(watchPath, messages);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // Sort by timestamp
    messages.sort((a, b) => a.message.timestamp.localeCompare(b.message.timestamp));

    return messages;
  }

  private async scanDirectory(
    dir: string,
    messages: Array<{ message: Message; filePath: string }>
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, messages);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const message = await this.readMessage(fullPath);
        if (message !== null) {
          messages.push({ message, filePath: fullPath });
        }
      }
    }
  }

  /**
   * Start watching for new messages.
   */
  async watch(): Promise<void> {
    if (this.watcher !== null) {
      return; // Already watching
    }

    const watchPath = this.getWatchPath();

    // Ensure directory exists
    try {
      await fs.mkdir(watchPath, { recursive: true });
    } catch {
      // Ignore errors, directory might already exist
    }

    // Get existing files to mark as seen
    try {
      const existing = await this.listMessages();
      for (const { filePath } of existing) {
        this.seenFiles.add(filePath);
      }
    } catch {
      // Ignore errors on initial scan
    }

    this.watcher = watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      depth: this.repo !== undefined && this.agent !== undefined ? 0 : 2,
    });

    this.watcher.on('add', (filePath) => {
      if (!filePath.endsWith('.json')) {
        return;
      }

      if (this.seenFiles.has(filePath)) {
        return;
      }

      this.seenFiles.add(filePath);

      this.readMessage(filePath)
        .then((message) => {
          if (message !== null) {
            this.emit('message', message, filePath);
          }
        })
        .catch((error: Error) => {
          this.emit('error', error);
        });
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.watcher.on('ready', () => {
      this.emit('ready');
    });
  }

  /**
   * Stop watching and clean up.
   */
  async close(): Promise<void> {
    if (this.watcher !== null) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.seenFiles.clear();
  }

  /**
   * Clear the seen files set (for testing or reset).
   */
  clearSeen(): void {
    this.seenFiles.clear();
  }
}
