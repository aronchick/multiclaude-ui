import { useState, useEffect, useCallback } from 'react';
import type { State } from '@multiclaude/core';

/**
 * Hook for integrating with multiclaude state.
 *
 * This is a placeholder - the actual implementation depends on how the
 * dashboard is deployed:
 *
 * 1. **Electron app**: Can use StateReader directly via Node.js APIs
 * 2. **Web app with backend**: Would fetch from an API that wraps StateReader
 * 3. **Web app with WebSocket**: Would receive state updates via WebSocket
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement actual state fetching
      // This would depend on the deployment environment
      //
      // For Electron:
      //   const { StateReader } = await import('@multiclaude/core');
      //   const state = await StateReader.readOnce();
      //   setState(state);
      //
      // For web with API:
      //   const res = await fetch('/api/state');
      //   const state = await res.json();
      //   setState(state);

      // Placeholder: empty state
      setState({ repos: {} });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, error, loading, refresh };
}

/**
 * Hook for daemon connection status.
 */
export function useDaemonStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      // TODO: Implement actual ping
      // const { DaemonClient } = await import('@multiclaude/core');
      // const client = new DaemonClient();
      // const isConnected = await client.ping();
      // setConnected(isConnected);

      // Placeholder
      setConnected(false);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkConnection();
    const interval = setInterval(() => void checkConnection(), 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { connected, checking, checkConnection };
}
