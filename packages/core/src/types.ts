/**
 * TypeScript types for multiclaude daemon state.
 * Derived from multiclaude/internal/state/state.go
 */

// Agent types supported by multiclaude
export type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

// Task completion status
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

// PR tracking mode for merge-queue and pr-shepherd
export type TrackMode = 'all' | 'author' | 'assigned';

// Message delivery status
export type MessageStatus = 'pending' | 'delivered' | 'read' | 'acknowledged';

/**
 * Root daemon state structure
 */
export interface DaemonState {
  repos: Record<string, Repository>;
  current_repo?: string;
}

/**
 * Repository configuration and agent state
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
 * Individual agent state
 */
export interface Agent {
  type: AgentType;
  worktree_path: string;
  tmux_window: string;
  session_id: string;
  pid: number;
  task?: string;
  summary?: string;
  failure_reason?: string;
  created_at: string;
  last_nudge?: string;
  ready_for_cleanup?: boolean;
}

/**
 * Historical record of completed tasks
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
  created_at: string;
  completed_at?: string;
}

/**
 * Merge queue configuration
 */
export interface MergeQueueConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/**
 * PR shepherd configuration (for fork workflows)
 */
export interface PRShepherdConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/**
 * Fork mode configuration
 */
export interface ForkConfig {
  is_fork: boolean;
  upstream_url?: string;
  upstream_owner?: string;
  upstream_repo?: string;
  force_fork_mode?: boolean;
}

/**
 * Inter-agent message format
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  body: string;
  status: MessageStatus;
}

/**
 * Socket API request format
 */
export interface SocketRequest {
  command: string;
  args?: Record<string, unknown>;
}

/**
 * Socket API response format
 */
export interface SocketResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
