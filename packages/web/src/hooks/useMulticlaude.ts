import { useState, useEffect, useCallback } from 'react';
import type { State, Agent, TaskHistoryEntry } from '@multiclaude/core';

/**
 * Mock data for development/demo purposes.
 * In production, this would be replaced with actual API calls.
 */
function getMockState(): State {
  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();

  const mockAgents: Record<string, Agent> = {
    supervisor: {
      type: 'supervisor',
      worktree_path: '/Users/dev/.multiclaude/wts/my-app/supervisor',
      tmux_window: 'mc-my-app:supervisor',
      session_id: 'session-001',
      pid: 12345,
      created_at: twoHoursAgo,
      last_nudge: now,
    },
    'eager-elephant': {
      type: 'worker',
      worktree_path: '/Users/dev/.multiclaude/wts/my-app/eager-elephant',
      tmux_window: 'mc-my-app:eager-elephant',
      session_id: 'session-002',
      pid: 12346,
      task: 'Implement AgentList component with real data binding',
      created_at: hourAgo,
      last_nudge: now,
    },
    'merge-queue': {
      type: 'merge-queue',
      worktree_path: '/Users/dev/.multiclaude/wts/my-app/merge-queue',
      tmux_window: 'mc-my-app:merge-queue',
      session_id: 'session-003',
      pid: 12347,
      created_at: twoHoursAgo,
    },
  };

  const mockHistory: TaskHistoryEntry[] = [
    {
      name: 'swift-fox',
      task: 'Add TypeScript types for daemon state',
      branch: 'work/swift-fox',
      pr_url: 'https://github.com/org/repo/pull/1',
      pr_number: 1,
      status: 'merged',
      summary: 'Added comprehensive TypeScript types mirroring state.go',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 82800000).toISOString(),
    },
    {
      name: 'clever-owl',
      task: 'Bootstrap monorepo structure',
      branch: 'work/clever-owl',
      pr_url: 'https://github.com/org/repo/pull/5',
      pr_number: 5,
      status: 'merged',
      summary: 'Set up npm workspaces with core and web packages',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      completed_at: new Date(Date.now() - 169200000).toISOString(),
    },
  ];

  return {
    repos: {
      'multiclaude-ui': {
        github_url: 'https://github.com/aronchick/multiclaude-ui',
        tmux_session: 'mc-multiclaude-ui',
        agents: mockAgents,
        task_history: mockHistory,
        merge_queue_config: { enabled: true, track_mode: 'all' },
        target_branch: 'main',
      },
      'other-project': {
        github_url: 'https://github.com/org/other-project',
        tmux_session: 'mc-other-project',
        agents: {
          supervisor: {
            type: 'supervisor',
            worktree_path: '/Users/dev/.multiclaude/wts/other/supervisor',
            tmux_window: 'mc-other:supervisor',
            session_id: 'session-010',
            pid: 0, // Not running
            created_at: twoHoursAgo,
          },
        },
        task_history: [],
        target_branch: 'main',
      },
    },
    current_repo: 'multiclaude-ui',
  };
}

/**
 * Hook for integrating with multiclaude state.
 *
 * In development, returns mock data. In production, this would:
 * 1. **Electron app**: Use StateReader directly via Node.js APIs
 * 2. **Web app with backend**: Fetch from an API that wraps StateReader
 * 3. **Web app with WebSocket**: Receive state updates via WebSocket
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { state, error, refresh } = useMulticlaude();
 *
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!state) return <div>Loading...</div>;
 *
 *   return <AgentList agents={state.repos['my-repo']?.agents ?? {}} />;
 * }
 * ```
 */
export function useMulticlaude() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      // TODO: In production, replace with actual API call
      // For Electron: const state = await StateReader.readOnce();
      // For web API: const res = await fetch('/api/state');

      // Development: use mock data
      setState(getMockState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, error, loading, refresh };
}

/**
 * Hook for daemon connection status.
 *
 * In development, simulates a connected daemon.
 * In production, would actually ping the daemon socket.
 */
export function useDaemonStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkConnection = useCallback(() => {
    setChecking(true);
    // Simulate async check
    setTimeout(() => {
      // TODO: In production, replace with actual daemon ping
      // const client = new DaemonClient();
      // const isConnected = await client.ping();

      // Development: simulate connected (mock mode)
      setConnected(true);
      setChecking(false);
    }, 500);
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => checkConnection(), 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { connected, checking, checkConnection };
}
