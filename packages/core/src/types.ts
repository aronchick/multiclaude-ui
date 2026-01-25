/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 */

/** Agent type represents the type of agent */
export type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

/** Track mode defines which PRs the merge queue should track */
export type TrackMode = 'all' | 'author' | 'assigned';

/** Task status represents the status of a completed task */
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

/** MergeQueueConfig holds configuration for the merge queue agent */
export interface MergeQueueConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/** PRShepherdConfig holds configuration for the PR shepherd agent */
export interface PRShepherdConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/** ForkConfig holds fork-related configuration for a repository */
export interface ForkConfig {
  is_fork: boolean;
  upstream_url?: string;
  upstream_owner?: string;
  upstream_repo?: string;
  force_fork_mode?: boolean;
}

/** TaskHistoryEntry represents a completed task in the history */
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

/** Agent represents an agent's state */
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

/** Repository represents a tracked repository's state */
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

/** State represents the entire daemon state */
export interface State {
  repos: Record<string, Repository>;
  current_repo?: string;
}

/** Socket API request format */
export interface SocketRequest {
  command: string;
  args?: Record<string, unknown>;
}

/** Socket API response format */
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Daemon status response */
export interface DaemonStatus {
  running: boolean;
  pid: number;
  repos: number;
  agents: number;
  socket_path: string;
}

/** Helper to check if an agent type is persistent */
export function isPersistentAgentType(type: AgentType): boolean {
  return ['supervisor', 'merge-queue', 'pr-shepherd', 'workspace', 'generic-persistent'].includes(
    type
  );
}

/** Default merge queue config */
export function defaultMergeQueueConfig(): MergeQueueConfig {
  return {
    enabled: true,
    track_mode: 'all',
  };
}

/** Default PR shepherd config */
export function defaultPRShepherdConfig(): PRShepherdConfig {
  return {
    enabled: true,
    track_mode: 'author',
  };
}
