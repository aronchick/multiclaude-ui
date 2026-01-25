/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 *
 * These types represent the complete multiclaude state schema.
 * Keep in sync with the Go source when the schema evolves.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Agent type identifiers
 */
export const AgentType = {
  Supervisor: 'supervisor',
  Worker: 'worker',
  MergeQueue: 'merge-queue',
  PRShepherd: 'pr-shepherd',
  Workspace: 'workspace',
  Review: 'review',
  GenericPersistent: 'generic-persistent',
} as const;

export type AgentType = (typeof AgentType)[keyof typeof AgentType];

/**
 * Persistent agent types that should be auto-restarted when dead.
 * Matches AgentType.IsPersistent() in Go.
 */
export const PERSISTENT_AGENT_TYPES: readonly AgentType[] = [
  AgentType.Supervisor,
  AgentType.MergeQueue,
  AgentType.PRShepherd,
  AgentType.Workspace,
  AgentType.GenericPersistent,
] as const;

/**
 * Check if an agent type is persistent
 */
export function isPersistentAgentType(type: AgentType): boolean {
  return (PERSISTENT_AGENT_TYPES as readonly string[]).includes(type);
}

/**
 * PR tracking mode for merge queue and PR shepherd
 */
export const TrackMode = {
  /** Track all PRs (default) */
  All: 'all',
  /** Track only PRs where the multiclaude user is the author */
  Author: 'author',
  /** Track only PRs where the multiclaude user is assigned */
  Assigned: 'assigned',
} as const;

export type TrackMode = (typeof TrackMode)[keyof typeof TrackMode];

/**
 * Task completion status
 */
export const TaskStatus = {
  /** PR created, not yet merged or closed */
  Open: 'open',
  /** PR was merged successfully */
  Merged: 'merged',
  /** PR was closed without merging */
  Closed: 'closed',
  /** Task completed but no PR was created */
  NoPR: 'no-pr',
  /** Task failed (see failure_reason) */
  Failed: 'failed',
  /** Status couldn't be determined */
  Unknown: 'unknown',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Merge queue agent configuration
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
export const DEFAULT_MERGE_QUEUE_CONFIG: MergeQueueConfig = {
  enabled: true,
  track_mode: TrackMode.All,
};

/**
 * PR shepherd agent configuration (used in fork mode)
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
export const DEFAULT_PR_SHEPHERD_CONFIG: PRShepherdConfig = {
  enabled: true,
  track_mode: TrackMode.Author,
};

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
  /** Forces fork mode even for non-forks (edge case) */
  force_fork_mode?: boolean;
}

// ============================================================================
// Core Types
// ============================================================================

/**
 * Task history entry representing a completed task
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
 * Agent state
 */
export interface Agent {
  /** Agent type */
  type: AgentType;
  /** Path to the git worktree */
  worktree_path: string;
  /** Tmux window index */
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
  /** Signals that worker is ready for cleanup (workers only) */
  ready_for_cleanup?: boolean;
}

/**
 * Repository state
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
 * Complete daemon state
 */
export interface State {
  /** Map of repository name to repository state */
  repos: Record<string, Repository>;
  /** Current/default repository name */
  current_repo?: string;
}

// ============================================================================
// Socket API Types
// ============================================================================

/**
 * Socket API request
 */
export interface SocketRequest {
  /** Command name */
  command: string;
  /** Command-specific arguments */
  args?: Record<string, unknown>;
}

/**
 * Socket API response
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
 * Daemon status response data
 */
export interface DaemonStatus {
  running: boolean;
  pid: number;
  repos: number;
  agents: number;
  socket_path: string;
}

/**
 * List repos response data
 */
export interface ListReposResponse {
  repos: string[];
}

/**
 * List agents response data
 */
export interface ListAgentsResponse {
  agents: Record<string, Agent>;
}

/**
 * Task history response data
 */
export interface TaskHistoryResponse {
  history: TaskHistoryEntry[];
}
