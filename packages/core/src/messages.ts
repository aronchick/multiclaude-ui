/**
 * MessageReader - Watch for inter-agent messages
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import chokidar from 'chokidar';
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

/** Message type */
export type Message = z.infer<typeof MessageSchema>;

/** Configuration for MessageReader */
export interface MessageReaderConfig {
  /** Base path for messages. Defaults to ~/.multiclaude/messages */
  messagesPath?: string;
  /** Repository name to watch. If not set, watches all repos */
  repo?: string;
  /** Agent name to watch. If not set, watches all agents */
  agent?: string;
}

/** Events emitted by MessageReader */
export interface MessageReaderEvents {
  message: (message: Message, repo: string, agent: string) => void;
  error: (error: Error) => void;
}

/**
 * Watch for new inter-agent messages.
 *
 * Messages are stored as JSON files in ~/.multiclaude/messages/<repo>/<agent>/
 *
 * @example
 * ```typescript
 * const reader = new MessageReader({ repo: 'my-app' });
 *
 * reader.on('message', (message, repo, agent) => {
 *   console.log(`New message for ${agent}: ${message.content}`);
 * });
 *
 * await reader.watch();
 * ```
 */
export class MessageReader extends EventEmitter {
  private readonly basePath: string;
  private readonly repo?: string;
  private readonly agent?: string;
  private watcher: chokidar.FSWatcher | null = null;
  private seenMessages = new Set<string>();

  constructor(config: MessageReaderConfig = {}) {
    super();
    this.basePath = config.messagesPath ?? path.join(os.homedir(), '.multiclaude', 'messages');
    this.repo = config.repo;
    this.agent = config.agent;
  }

  // Type-safe event emitter overrides
  override on<K extends keyof MessageReaderEvents>(
    event: K,
    listener: MessageReaderEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof MessageReaderEvents>(
    event: K,
    ...args: Parameters<MessageReaderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Get the watch path based on configuration.
   */
  private getWatchPath(): string {
    if (this.repo && this.agent) {
      return path.join(this.basePath, this.repo, this.agent);
    } else if (this.repo) {
      return path.join(this.basePath, this.repo);
    }
    return this.basePath;
  }

  /**
   * List all pending messages for an agent.
   */
  async listMessages(repo: string, agent: string): Promise<Message[]> {
    const messagesDir = path.join(this.basePath, repo, agent);

    try {
      const files = await fs.promises.readdir(messagesDir);
      const messages: Message[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(messagesDir, file);
          const data = await fs.promises.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(data) as unknown;
          const result = MessageSchema.safeParse(parsed);

          if (result.success) {
            messages.push(result.data);
          }
        } catch {
          // Skip invalid files
        }
      }

      // Sort by timestamp, oldest first
      messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      return messages;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Read a specific message by ID.
   */
  async readMessage(repo: string, agent: string, messageId: string): Promise<Message | null> {
    const filePath = path.join(this.basePath, repo, agent, `${messageId}.json`);

    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      const result = MessageSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Start watching for new messages.
   */
  async watch(): Promise<void> {
    if (this.watcher) {
      return; // Already watching
    }

    const watchPath = this.getWatchPath();

    // Ensure the directory exists
    await fs.promises.mkdir(watchPath, { recursive: true });

    this.watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: false,
      depth: this.repo && this.agent ? 0 : this.repo ? 1 : 2,
    });

    this.watcher.on('add', (filePath) => {
      void this.handleNewFile(filePath);
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
   * Stop watching for messages.
   */
  close(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Handle a new file being added.
   */
  private async handleNewFile(filePath: string): Promise<void> {
    if (!filePath.endsWith('.json')) return;

    // Skip already seen messages
    if (this.seenMessages.has(filePath)) return;
    this.seenMessages.add(filePath);

    try {
      // Parse the path to get repo and agent
      const relativePath = path.relative(this.basePath, filePath);
      const parts = relativePath.split(path.sep);

      if (parts.length < 3) return; // Not a valid message path

      const repo = parts[0];
      const agent = parts[1];

      if (!repo || !agent) return;

      // Read and parse the message
      const data = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      const result = MessageSchema.safeParse(parsed);

      if (result.success) {
        this.emit('message', result.data, repo, agent);
      }
    } catch (err) {
      this.emit('error', err as Error);
    }
  }
}
