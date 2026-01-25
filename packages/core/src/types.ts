/**
 * TypeScript types mirroring multiclaude/internal/state/state.go
 */

/** Agent type - matches Go AgentType */
export type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

/** Track mode for merge queue and PR shepherd - matches Go TrackMode */
export type TrackMode = 'all' | 'author' | 'assigned';

/** Task status - matches Go TaskStatus */
export type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

/** Merge queue configuration */
export interface MergeQueueConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/** PR shepherd configuration (fork mode) */
export interface PRShepherdConfig {
  enabled: boolean;
  track_mode: TrackMode;
}

/** Fork configuration */
export interface ForkConfig {
  is_fork: boolean;
  upstream_url?: string;
  upstream_owner?: string;
  upstream_repo?: string;
  force_fork_mode?: boolean;
}

/** Task history entry - completed task record */
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

/** Agent state */
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

/** Repository state */
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

/** Root state structure */
export interface State {
  repos: Record<string, Repository>;
  current_repo?: string;
}

/** Socket API request */
export interface SocketRequest {
  command: string;
  args?: Record<string, unknown>;
}

/** Socket API response */
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

/** Agent type utilities */
export function isPersistentAgentType(type: AgentType): boolean {
  return (
    type === 'supervisor' ||
    type === 'merge-queue' ||
    type === 'pr-shepherd' ||
    type === 'workspace' ||
    type === 'generic-persistent'
  );
}

/** Default configurations */
export const DEFAULT_MERGE_QUEUE_CONFIG: MergeQueueConfig = {
  enabled: true,
  track_mode: 'all',
};

export const DEFAULT_PR_SHEPHERD_CONFIG: PRShepherdConfig = {
  enabled: true,
  track_mode: 'author',
};
