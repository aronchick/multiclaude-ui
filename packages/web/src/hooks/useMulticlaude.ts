import { useState, useEffect, useCallback, useRef } from 'react';
import type { State } from '@multiclaude/core';

/** Interval for auto-refresh in milliseconds */
const REFRESH_INTERVAL = 2000;

/**
 * Hook for integrating with multiclaude state.
 *
 * Fetches state from /api/state endpoint (served by Vite plugin in dev,
 * or a backend API in production). Auto-refreshes every 2 seconds.
 */
export function useMulticlaude() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Auto-refresh every 2 seconds for live updates
    intervalRef.current = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  return { state, error, loading, refresh };
}

/**
 * Hook for daemon connection status.
 *
 * Checks if the state API is accessible (which indicates daemon is running
 * and state.json exists).
 */
export function useDaemonStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/state');
      setConnected(res.ok);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => checkConnection(), 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { connected, checking, checkConnection };
}
