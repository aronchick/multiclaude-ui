import { useState, useCallback } from 'react';

interface DaemonResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Hook for sending commands to the multiclaude daemon.
 *
 * @example
 * ```tsx
 * const { sendCommand, loading, error } = useDaemon();
 *
 * const handleKill = async () => {
 *   await sendCommand('remove_agent', { repo: 'my-repo', name: 'worker-1' });
 * };
 * ```
 */
export function useDaemon() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCommand = useCallback(
    async (command: string, args?: Record<string, unknown>): Promise<unknown> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/daemon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, args }),
        });

        const data: DaemonResponse = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Convenience methods for common operations
  const killAgent = useCallback(
    (repo: string, name: string) => sendCommand('remove_agent', { repo, name }),
    [sendCommand]
  );

  const restartAgent = useCallback(
    (repo: string, name: string) => sendCommand('restart_agent', { repo, name }),
    [sendCommand]
  );

  const stopRepo = useCallback(
    async (repo: string) => {
      // Stop all agents in a repo by removing each one
      // First get the list, then remove each
      const result = await sendCommand('list_agents', { repo }) as { agents: Record<string, unknown> };
      const names = Object.keys(result.agents || {});
      await Promise.all(names.map((name) => sendCommand('remove_agent', { repo, name })));
      return { stopped: names.length };
    },
    [sendCommand]
  );

  const triggerCleanup = useCallback(
    () => sendCommand('trigger_cleanup'),
    [sendCommand]
  );

  return {
    sendCommand,
    killAgent,
    restartAgent,
    stopRepo,
    triggerCleanup,
    loading,
    error,
  };
}
