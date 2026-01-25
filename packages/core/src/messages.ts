/**
 * MessageReader - Watch for inter-agent messages
 *
 * This module is implemented by worker: silly-dolphin
 *
 * @example
 * ```typescript
 * const reader = new MessageReader({ repoName: 'my-repo', agentName: 'supervisor' });
 * reader.on('message', (msg) => console.log(`From ${msg.from}: ${msg.content}`));
 * await reader.start();
 * ```
 */

import { EventEmitter } from 'events';
import type { Message } from './types';

/**
 * Options for creating a MessageReader instance.
 */
export interface MessageReaderOptions {
  /**
   * Repository name to watch messages for.
   */
  repoName: string;

  /**
   * Agent name to watch messages for.
   * If not specified, watches all agents in the repo.
   */
  agentName?: string;

  /**
   * Base path for message files.
   * Defaults to ~/.multiclaude/messages
   */
  basePath?: string;
}

/**
 * Events emitted by MessageReader.
 */
export interface MessageReaderEvents {
  /** Emitted when a new message arrives */
  message: (message: Message) => void;
  /** Emitted on errors */
  error: (error: Error) => void;
}

/**
 * MessageReader watches for inter-agent messages in the filesystem.
 *
 * Messages are stored as JSON files in ~/.multiclaude/messages/<repo>/<agent>/
 * and this class watches for new files to emit message events.
 *
 * @example
 * ```typescript
 * const reader = new MessageReader({
 *   repoName: 'my-repo',
 *   agentName: 'supervisor'
 * });
 *
 * reader.on('message', (msg: Message) => {
 *   console.log(`[${msg.from} -> ${msg.to}] ${msg.content}`);
 *
 *   // Acknowledge the message
 *   reader.acknowledge(msg.id);
 * });
 *
 * reader.on('error', (err) => {
 *   console.error('Message read error:', err);
 * });
 *
 * await reader.start();
 *
 * // List pending messages
 * const pending = await reader.listPending();
 *
 * // Later: stop watching
 * await reader.stop();
 * ```
 */
export class MessageReader extends EventEmitter {
  // Options stored for use by implementer (silly-dolphin)
  private _options: Required<MessageReaderOptions>;

  constructor(options: MessageReaderOptions) {
    super();
    this._options = {
      repoName: options.repoName,
      agentName: options.agentName ?? '',
      basePath: options.basePath ?? `${process.env.HOME}/.multiclaude/messages`,
    };
  }

  /**
   * Start watching for messages.
   */
  async start(): Promise<void> {
    // TODO: Implemented by silly-dolphin
    throw new Error('MessageReader.start() not implemented - see worker: silly-dolphin');
  }

  /**
   * Stop watching for messages.
   */
  async stop(): Promise<void> {
    // TODO: Implemented by silly-dolphin
    throw new Error('MessageReader.stop() not implemented - see worker: silly-dolphin');
  }

  /**
   * List all pending (unacknowledged) messages.
   */
  async listPending(): Promise<Message[]> {
    // TODO: Implemented by silly-dolphin
    throw new Error('MessageReader.listPending() not implemented - see worker: silly-dolphin');
  }

  /**
   * Read a specific message by ID.
   */
  async read(messageId: string): Promise<Message | null> {
    // TODO: Implemented by silly-dolphin
    throw new Error('MessageReader.read() not implemented - see worker: silly-dolphin');
  }

  /**
   * Acknowledge a message (mark as read).
   */
  async acknowledge(messageId: string): Promise<void> {
    // TODO: Implemented by silly-dolphin
    throw new Error('MessageReader.acknowledge() not implemented - see worker: silly-dolphin');
  }
}
