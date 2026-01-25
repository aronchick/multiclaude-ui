/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 *
 * These types represent the daemon state and are used for:
 * - Parsing state.json file
 * - Socket API communication
 * - UI components
 */

// Agent type enum - matches Go AgentType constants
export type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

// Persistent agent types that should be auto-restarted when dead
export const PERSISTENT_AGENT_TYPES: readonly AgentType[] = [
  'supervisor',
  'merge-queue',
  'pr-shepherd',
  'workspace',
  'generic-persistent',
] as const;

export function isPersistentAgentType(type: AgentType): boolean {
  return PERSISTENT_AGENT_TYPES.includes(type);
}

// Track mode for merge queue and PR shepherd
export type TrackMode = 'all' | 'author' | 'assigned';

// Task status enum - matches Go TaskStatus constants
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

/**
 * Merge queue configuration
 */
export interface MergeQueueConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/**
 * PR shepherd configuration (used in fork mode)
 */
export interface PRShepherdConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/**
 * Fork-related configuration for a repository
 */
export interface ForkConfig {
  is_fork: boolean;
  upstream_url?: string;
  upstream_owner?: string;
  upstream_repo?: string;
  force_fork_mode?: boolean;
}

/**
 * Completed task history entry
 */
export interface TaskHistoryEntry {
  name: string;
  task: string;
  branch: string;
  pr_url?: string;
  pr_number?: number;
  status: TaskStatus;
  summary?: string;
  failure_reason?: string;
  created_at: string; // ISO 8601 timestamp
  completed_at?: string; // ISO 8601 timestamp
}

/**
 * Agent state - represents a running agent
 */
export interface Agent {
  type: AgentType;
  worktree_path: string;
  tmux_window: string;
  session_id: string;
  pid: number;
  task?: string; // Only for workers
  summary?: string; // Brief summary of work done (workers only)
  failure_reason?: string; // Why the task failed (workers only)
  created_at: string; // ISO 8601 timestamp
  last_nudge?: string; // ISO 8601 timestamp
  ready_for_cleanup?: boolean; // Only for workers
}

/**
 * Repository state - tracked repository with its agents
 */
export interface Repository {
  github_url: string;
  tmux_session: string;
  agents: Record<string, Agent>;
  task_history?: TaskHistoryEntry[];
  merge_queue_config?: MergeQueueConfig;
  pr_shepherd_config?: PRShepherdConfig;
  fork_config?: ForkConfig;
  target_branch?: string;
}

/**
 * Daemon state - the entire state.json structure
 */
export interface State {
  repos: Record<string, Repository>;
  current_repo?: string;
}

// Default configurations
export const DEFAULT_MERGE_QUEUE_CONFIG: MergeQueueConfig = {
  enabled: true,
  track_mode: 'all',
};

export const DEFAULT_PR_SHEPHERD_CONFIG: PRShepherdConfig = {
  enabled: true,
  track_mode: 'author',
};
