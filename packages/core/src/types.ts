/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 *
 * These types are the canonical TypeScript representation of the multiclaude
 * daemon state. Keep in sync with the Go source.
 */

/**
 * Agent type - determines agent behavior and lifecycle
 */
export type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

/**
 * Check if an agent type represents a persistent agent that should be
 * auto-restarted when dead.
 */
export function isPersistentAgent(type: AgentType): boolean {
  return ['supervisor', 'merge-queue', 'pr-shepherd', 'workspace', 'generic-persistent'].includes(
    type
  );
}

/**
 * Track mode - determines which PRs the merge queue/PR shepherd should track
 */
export type TrackMode = 'all' | 'author' | 'assigned';

/**
 * Task status - represents the lifecycle state of a completed task
 */
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

/**
 * Merge queue configuration for a repository
 */
export interface MergeQueueConfig {
  /** Whether the merge queue agent should run (default: true) */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" (default: "all") */
  track_mode: TrackMode;
}

/**
 * Default merge queue configuration
 */
export function defaultMergeQueueConfig(): MergeQueueConfig {
  return {
    enabled: true,
    track_mode: 'all',
  };
}

/**
 * PR shepherd configuration (used in fork mode)
 */
export interface PRShepherdConfig {
  /** Whether the PR shepherd agent should run (default: true in fork mode) */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" (default: "author") */
  track_mode: TrackMode;
}

/**
 * Default PR shepherd configuration
 */
export function defaultPRShepherdConfig(): PRShepherdConfig {
  return {
    enabled: true,
    track_mode: 'author',
  };
}

/**
 * Fork-related configuration for a repository
 */
export interface ForkConfig {
  /** True if the repository is detected as a fork */
  is_fork: boolean;
  /** URL of the upstream repository (if fork) */
  upstream_url?: string;
  /** Owner of the upstream repository (if fork) */
  upstream_owner?: string;
  /** Name of the upstream repository (if fork) */
  upstream_repo?: string;
  /** Force fork mode even for non-forks (edge case) */
  force_fork_mode?: boolean;
}

/**
 * A completed task in the history
 */
export interface TaskHistoryEntry {
  /** Worker name that executed the task */
  name: string;
  /** Task description */
  task: string;
  /** Git branch */
  branch: string;
  /** Pull request URL if created */
  pr_url?: string;
  /** PR number for quick lookup */
  pr_number?: number;
  /** Current status */
  status: TaskStatus;
  /** Brief summary of what was accomplished */
  summary?: string;
  /** Why the task failed (if applicable) */
  failure_reason?: string;
  /** When the task was started (ISO 8601) */
  created_at: string;
  /** When the task was completed (ISO 8601) */
  completed_at?: string;
}

/**
 * An agent's state
 */
export interface Agent {
  /** Agent type */
  type: AgentType;
  /** Path to the git worktree */
  worktree_path: string;
  /** tmux window index */
  tmux_window: string;
  /** Claude session ID */
  session_id: string;
  /** Process ID (0 if not running) */
  pid: number;
  /** Task description (only for workers) */
  task?: string;
  /** Brief summary of work done (workers only) */
  summary?: string;
  /** Why the task failed (workers only) */
  failure_reason?: string;
  /** When the agent was created (ISO 8601) */
  created_at: string;
  /** Last time the agent was nudged (ISO 8601) */
  last_nudge?: string;
  /** Signals completion, ready for cleanup (workers only) */
  ready_for_cleanup?: boolean;
}

/**
 * A tracked repository's state
 */
export interface Repository {
  /** GitHub URL */
  github_url: string;
  /** tmux session name */
  tmux_session: string;
  /** Map of agent name to agent state */
  agents: Record<string, Agent>;
  /** Completed task history */
  task_history?: TaskHistoryEntry[];
  /** Merge queue configuration */
  merge_queue_config?: MergeQueueConfig;
  /** PR shepherd configuration */
  pr_shepherd_config?: PRShepherdConfig;
  /** Fork configuration */
  fork_config?: ForkConfig;
  /** Default branch for PRs (usually "main") */
  target_branch?: string;
}

/**
 * The entire daemon state
 */
export interface State {
  /** Map of repository name to repository state */
  repos: Record<string, Repository>;
  /** Current/default repository name */
  current_repo?: string;
}

/**
 * Socket API request format
 */
export interface SocketRequest {
  /** Command name */
  command: string;
  /** Command-specific arguments */
  args?: Record<string, unknown>;
}

/**
 * Socket API response format
 */
export interface SocketResponse<T = unknown> {
  /** Whether command succeeded */
  success: boolean;
  /** Command response data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Daemon status response from the 'status' command
 */
export interface DaemonStatus {
  running: boolean;
  pid: number;
  repos: number;
  agents: number;
  socket_path: string;
}
