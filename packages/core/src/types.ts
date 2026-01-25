/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 *
 * These types represent the daemon's state structure and are used
 * for type-safe communication with the multiclaude daemon.
 */

/**
 * Agent types supported by multiclaude.
 * - supervisor: Main orchestrator for a repository
 * - worker: Executes specific tasks
 * - merge-queue: Monitors and merges approved PRs
 * - pr-shepherd: Monitors PRs in fork mode
 * - workspace: Interactive workspace agent
 * - review: Reviews a specific PR
 * - generic-persistent: Custom persistent agents
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
 * Track modes for merge-queue and pr-shepherd agents.
 * - all: Monitor all PRs in the repository
 * - author: Only PRs where the multiclaude user is the author
 * - assigned: Only PRs where the multiclaude user is assigned
 */
export type TrackMode = 'all' | 'author' | 'assigned';

/**
 * Task status values.
 * - open: PR created, not yet merged or closed
 * - merged: PR was merged successfully
 * - closed: PR was closed without merging
 * - no-pr: Task completed but no PR was created
 * - failed: Task failed (see failure_reason)
 * - unknown: Status couldn't be determined
 */
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

/**
 * Configuration for the merge-queue agent.
 */
export interface MergeQueueConfig {
  /** Whether the merge queue agent should run */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" */
  track_mode: TrackMode;
}

/**
 * Configuration for the pr-shepherd agent (used in fork mode).
 */
export interface PRShepherdConfig {
  /** Whether the PR shepherd agent should run */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" */
  track_mode: TrackMode;
}

/**
 * Fork-related configuration for a repository.
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
  /** Forces fork mode even for non-forks (edge case) */
  force_fork_mode?: boolean;
}

/**
 * A completed task in the history.
 */
export interface TaskHistoryEntry {
  /** Worker name */
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
 * An agent's state.
 */
export interface Agent {
  /** Agent type */
  type: AgentType;
  /** Path to the git worktree */
  worktree_path: string;
  /** Tmux window identifier */
  tmux_window: string;
  /** Claude session ID */
  session_id: string;
  /** Process ID (0 if not running) */
  pid: number;
  /** Task description (workers only) */
  task?: string;
  /** Brief summary of work done (workers only) */
  summary?: string;
  /** Why the task failed (workers only) */
  failure_reason?: string;
  /** When the agent was created (ISO 8601) */
  created_at: string;
  /** Last time the agent was nudged (ISO 8601) */
  last_nudge?: string;
  /** Signals worker completion (workers only) */
  ready_for_cleanup?: boolean;
}

/**
 * A tracked repository's state.
 */
export interface Repository {
  /** GitHub URL */
  github_url: string;
  /** Tmux session name */
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
 * The entire daemon state.
 */
export interface State {
  /** Map of repository name to repository state */
  repos: Record<string, Repository>;
  /** Current/default repository name */
  current_repo?: string;
}

/**
 * Socket API request format.
 */
export interface SocketRequest {
  /** Command name */
  command: string;
  /** Command-specific arguments */
  args?: Record<string, unknown>;
}

/**
 * Socket API response format.
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
 * Daemon status response.
 */
export interface DaemonStatus {
  /** Whether daemon is running */
  running: boolean;
  /** Daemon process ID */
  pid: number;
  /** Number of tracked repositories */
  repos: number;
  /** Total number of agents */
  agents: number;
  /** Path to the Unix socket */
  socket_path: string;
}

/**
 * Helper to check if an agent type is persistent (auto-restarted when dead).
 */
export function isPersistentAgentType(type: AgentType): boolean {
  return ['supervisor', 'merge-queue', 'pr-shepherd', 'workspace', 'generic-persistent'].includes(
    type
  );
}

/**
 * Default merge queue configuration.
 */
export function defaultMergeQueueConfig(): MergeQueueConfig {
  return {
    enabled: true,
    track_mode: 'all',
  };
}

/**
 * Default PR shepherd configuration.
 */
export function defaultPRShepherdConfig(): PRShepherdConfig {
  return {
    enabled: true,
    track_mode: 'author',
  };
}
