/**
 * MessageReader - Watch for inter-agent messages.
 *
 * Messages between agents are stored as JSON files in the messages directory.
 * This module provides a way to watch for new messages.
 */

import { readFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import chokidar, { type FSWatcher } from 'chokidar';
import { z } from 'zod';

/**
 * Message schema.
 */
export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  created_at: z.string(),
  acknowledged: z.boolean().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Events emitted by MessageReader.
 */
export interface MessageReaderEvents {
  /** Emitted when a new message arrives. */
  message: (message: Message) => void;
  /** Emitted on read/parse errors. */
  error: (error: Error) => void;
  /** Emitted when the watcher is ready. */
  ready: () => void;
  /** Emitted when the watcher is closed. */
  close: () => void;
}

/**
 * Options for MessageReader.
 */
export interface MessageReaderOptions {
  /** Base path for messages. Defaults to ~/.multiclaude/messages */
  messagesPath?: string;
  /** Repository name to watch messages for */
  repo?: string;
  /** Agent name to watch messages for */
  agent?: string;
}

/**
 * Default path to the messages directory.
 */
export function defaultMessagesPath(): string {
  return join(homedir(), '.multiclaude', 'messages');
}

/**
 * MessageReader watches for inter-agent messages.
 *
 * @example
 * ```typescript
 * // Watch all messages for a repo
 * const reader = new MessageReader({ repo: 'my-repo' });
 *
 * reader.on('message', (msg) => {
 *   console.log(`${msg.from} -> ${msg.to}: ${msg.content}`);
 * });
 *
 * await reader.start();
 * ```
 */
export class MessageReader extends EventEmitter {
  private readonly messagesPath: string;
  private readonly repo?: string;
  private readonly agent?: string;
  private watcher: FSWatcher | null = null;
  private seenMessages = new Set<string>();

  constructor(options: MessageReaderOptions = {}) {
    super();
    this.messagesPath = options.messagesPath ?? defaultMessagesPath();
    if (options.repo !== undefined) {
      this.repo = options.repo;
    }
    if (options.agent !== undefined) {
      this.agent = options.agent;
    }
  }

  /**
   * Get the watch path based on repo/agent filters.
   */
  private getWatchPath(): string {
    if (this.repo && this.agent) {
      return join(this.messagesPath, this.repo, this.agent);
    }
    if (this.repo) {
      return join(this.messagesPath, this.repo);
    }
    return this.messagesPath;
  }

  /**
   * Start watching for messages.
   */
  async start(): Promise<void> {
    if (this.watcher) {
      throw new Error('MessageReader already started');
    }

    const watchPath = this.getWatchPath();

    // Ensure directory exists
    if (!existsSync(watchPath)) {
      await mkdir(watchPath, { recursive: true });
    }

    // Read existing messages
    await this.scanExistingMessages();

    // Start watching
    this.watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: false,
      depth: this.repo && this.agent ? 0 : this.repo ? 1 : 2,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('add', (filePath) => {
      if (filePath.endsWith('.json')) {
        void this.handleNewFile(filePath);
      }
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.watcher.on('ready', () => {
      this.emit('ready');
    });
  }

  /**
   * Stop watching for messages.
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.emit('close');
    }
  }

  /**
   * List all pending messages for an agent.
   */
  async listMessages(repo: string, agent: string): Promise<Message[]> {
    const agentPath = join(this.messagesPath, repo, agent);

    if (!existsSync(agentPath)) {
      return [];
    }

    const files = await readdir(agentPath);
    const messages: Message[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = join(agentPath, file);
        const data = await readFile(filePath, 'utf8');
        const json: unknown = JSON.parse(data);
        const message = MessageSchema.parse(json);
        messages.push(message);
      } catch {
        // Skip invalid files
      }
    }

    // Sort by created_at
    messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return messages;
  }

  /**
   * Read a specific message by ID.
   */
  async readMessage(repo: string, agent: string, messageId: string): Promise<Message | null> {
    const filePath = join(this.messagesPath, repo, agent, `${messageId}.json`);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const data = await readFile(filePath, 'utf8');
      const json: unknown = JSON.parse(data);
      return MessageSchema.parse(json);
    } catch {
      return null;
    }
  }

  /**
   * Acknowledge (delete) a message.
   */
  async acknowledgeMessage(repo: string, agent: string, messageId: string): Promise<boolean> {
    const filePath = join(this.messagesPath, repo, agent, `${messageId}.json`);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      await unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async scanExistingMessages(): Promise<void> {
    const watchPath = this.getWatchPath();

    if (!existsSync(watchPath)) {
      return;
    }

    // Scan for existing message files to populate seenMessages
    // This prevents duplicate emissions on startup
    try {
      const scan = async (dir: string, depth: number) => {
        if (depth > 2) return;

        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1);
          } else if (entry.name.endsWith('.json')) {
            this.seenMessages.add(fullPath);
          }
        }
      };

      await scan(watchPath, 0);
    } catch {
      // Ignore scan errors
    }
  }

  private async handleNewFile(filePath: string): Promise<void> {
    // Skip already seen messages
    if (this.seenMessages.has(filePath)) {
      return;
    }

    this.seenMessages.add(filePath);

    try {
      const data = await readFile(filePath, 'utf8');
      const json: unknown = JSON.parse(data);
      const message = MessageSchema.parse(json);
      this.emit('message', message);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
    }
  }

  // Type-safe event emitter methods
  override on<K extends keyof MessageReaderEvents>(
    event: K,
    listener: MessageReaderEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override off<K extends keyof MessageReaderEvents>(
    event: K,
    listener: MessageReaderEvents[K]
  ): this {
    return super.off(event, listener);
  }

  override once<K extends keyof MessageReaderEvents>(
    event: K,
    listener: MessageReaderEvents[K]
  ): this {
    return super.once(event, listener);
  }

  override emit<K extends keyof MessageReaderEvents>(
    event: K,
    ...args: Parameters<MessageReaderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
