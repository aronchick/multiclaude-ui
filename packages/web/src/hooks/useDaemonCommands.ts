import { useCallback, useState } from 'react';

/**
 * Response from daemon API.
 */
interface DaemonResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hook for sending commands to the multiclaude daemon.
 *
 * Wraps POST /api/daemon calls with loading/error state management.
 * All control operations (stop, restart, remove agents) go through this hook.
 */
export function useDaemonCommands() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a command to the daemon.
   */
  const sendCommand = useCallback(
    async <T = unknown>(
      command: string,
      args?: Record<string, unknown>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/daemon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, args }),
        });

        const data = (await res.json()) as DaemonResponse<T>;

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? `Request failed: ${res.status}`);
        }

        return data.data ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Stop/kill an agent.
   */
  const stopAgent = useCallback(
    (repo: string, name: string) => {
      return sendCommand('remove_agent', { repo, name });
    },
    [sendCommand]
  );

  /**
   * Restart a stopped agent.
   */
  const restartAgent = useCallback(
    (repo: string, name: string) => {
      return sendCommand('restart_agent', { repo, name });
    },
    [sendCommand]
  );

  /**
   * Mark an agent as completed.
   */
  const completeAgent = useCallback(
    (repo: string, name: string, summary?: string) => {
      return sendCommand('complete_agent', { repo, name, summary });
    },
    [sendCommand]
  );

  /**
   * Stop all agents in a repository.
   */
  const stopAllAgents = useCallback(
    async (repo: string, agentNames: string[]) => {
      const results = await Promise.all(
        agentNames.map((name) => stopAgent(repo, name))
      );
      return results.every((r) => r !== null);
    },
    [stopAgent]
  );

  /**
   * Trigger cleanup of dead agents.
   */
  const triggerCleanup = useCallback(() => {
    return sendCommand('trigger_cleanup');
  }, [sendCommand]);

  /**
   * Stop the daemon entirely.
   */
  const stopDaemon = useCallback(() => {
    return sendCommand('stop');
  }, [sendCommand]);

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    sendCommand,
    stopAgent,
    restartAgent,
    completeAgent,
    stopAllAgents,
    triggerCleanup,
    stopDaemon,
  };
}
