/**
 * TypeScript types matching multiclaude's Go types from internal/state/state.go
 *
 * These types represent the daemon state structure that external tools can read
 * from ~/.multiclaude/state.json or interact with via the socket API.
 */

// ============================================================================
// Agent Types
// ============================================================================

/**
 * AgentType represents the type of agent running in a repository.
 *
 * - supervisor: Main orchestrator for the repository
 * - worker: Executes specific tasks (transient)
 * - merge-queue: Monitors and merges approved PRs
 * - pr-shepherd: Monitors PRs in fork mode
 * - workspace: Interactive workspace agent
 * - review: Reviews a specific PR (transient)
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
 * Persistent agent types that should be auto-restarted when dead.
 */
export const PERSISTENT_AGENT_TYPES: readonly AgentType[] = [
  'supervisor',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'generic-persistent',
] as const;

/**
 * Transient agent types that are not auto-restarted.
 */
export const TRANSIENT_AGENT_TYPES: readonly AgentType[] = [
  'worker',
  'review',
] as const;

/**
 * Check if an agent type is persistent (should be auto-restarted).
 */
export function isPersistentAgent(type: AgentType): boolean {
  return (PERSISTENT_AGENT_TYPES as readonly string[]).includes(type);
}

// ============================================================================
// Track Mode
// ============================================================================

/**
 * TrackMode defines which PRs the merge queue or PR shepherd should track.
 *
 * - all: Track all PRs (default for merge-queue)
 * - author: Only PRs where the multiclaude user is the author (default for pr-shepherd)
 * - assigned: Only PRs where the multiclaude user is assigned
 */
export type TrackMode = 'all' | 'author' | 'assigned';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * MergeQueueConfig holds configuration for the merge queue agent.
 */
export interface MergeQueueConfig {
  /** Whether the merge queue agent should run (default: true) */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" (default: "all") */
  track_mode: TrackMode;
}

/**
 * Default merge queue configuration.
 */
export const DEFAULT_MERGE_QUEUE_CONFIG: MergeQueueConfig = {
  enabled: true,
  track_mode: 'all',
};

/**
 * PRShepherdConfig holds configuration for the PR shepherd agent (used in fork mode).
 */
export interface PRShepherdConfig {
  /** Whether the PR shepherd agent should run (default: true in fork mode) */
  enabled: boolean;
  /** Which PRs to track: "all", "author", or "assigned" (default: "author") */
  track_mode: TrackMode;
}

/**
 * Default PR shepherd configuration.
 */
export const DEFAULT_PR_SHEPHERD_CONFIG: PRShepherdConfig = {
  enabled: true,
  track_mode: 'author',
};

/**
 * ForkConfig holds fork-related configuration for a repository.
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
// Task Status
// ============================================================================

/**
 * TaskStatus represents the status of a completed task.
 *
 * - open: PR was created but not yet merged or closed
 * - merged: PR was merged successfully
 * - closed: PR was closed without merging
 * - no-pr: Task completed but no PR was created
 * - failed: Task failed (see failure_reason)
 * - unknown: Status couldn't be determined
 */
export type TaskStatus =
  | 'open'
  | 'merged'
  | 'closed'
  | 'no-pr'
  | 'failed'
  | 'unknown';

// ============================================================================
// Task History
// ============================================================================

/**
 * TaskHistoryEntry represents a completed task in the repository's history.
 */
export interface TaskHistoryEntry {
  /** Worker name that executed the task */
  name: string;
  /** Task description */
  task: string;
  /** Git branch used for the task */
  branch: string;
  /** Pull request URL if created */
  pr_url?: string;
  /** PR number for quick lookup */
  pr_number?: number;
  /** Current status of the task */
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

// ============================================================================
// Agent
// ============================================================================

/**
 * Agent represents an agent's state within a repository.
 */
export interface Agent {
  /** Type of agent */
  type: AgentType;
  /** Path to the agent's git worktree */
  worktree_path: string;
  /** Window index in the tmux session */
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
  /** Signals worker is ready for cleanup (workers only) */
  ready_for_cleanup?: boolean;
}

// ============================================================================
// Repository
// ============================================================================

/**
 * Repository represents a tracked repository's state.
 */
export interface Repository {
  /** GitHub URL of the repository */
  github_url: string;
  /** Tmux session name (e.g., "mc-my-repo") */
  tmux_session: string;
  /** Map of agent name to Agent state */
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

// ============================================================================
// Root State
// ============================================================================

/**
 * State represents the entire daemon state.
 * This is the structure of ~/.multiclaude/state.json
 */
export interface State {
  /** Map of repository name to Repository state */
  repos: Record<string, Repository>;
  /** Current/default repository name */
  current_repo?: string;
}

// ============================================================================
// Message Types (for inter-agent communication)
// ============================================================================

/**
 * Message represents an inter-agent message.
 */
export interface Message {
  /** Unique message ID */
  id: string;
  /** Sender agent name */
  from: string;
  /** Recipient agent name */
  to: string;
  /** Message content */
  content: string;
  /** When the message was sent (ISO 8601) */
  timestamp: string;
  /** Whether the message has been acknowledged */
  acknowledged?: boolean;
}

// ============================================================================
// Socket API Types
// ============================================================================

/**
 * Socket request to the daemon.
 */
export interface SocketRequest {
  /** Command to execute */
  command: string;
  /** Command arguments */
  args?: Record<string, unknown>;
}

/**
 * Socket response from the daemon.
 */
export interface SocketResponse {
  /** Whether the command succeeded */
  success: boolean;
  /** Response data (if success) */
  data?: unknown;
  /** Error message (if failure) */
  error?: string;
}
