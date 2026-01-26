import { useState } from 'react';
import type { Agent } from '@multiclaude/core';
import { useDaemonCommands } from '../hooks/useDaemonCommands';

interface AgentListProps {
  agents: Record<string, Agent>;
  repoName: string;
  onStopAll?: () => void;
}

/**
 * AgentList displays all agents for a repository with status indicators
 * and interactive controls for stopping, restarting, and viewing details.
 */
export function AgentList({ agents, repoName, onStopAll }: AgentListProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const { stopAgent, restartAgent, loading, error, clearError } = useDaemonCommands();

  const agentEntries = Object.entries(agents);

  const getStatusColor = (agent: Agent) => {
    if (agent.ready_for_cleanup) return 'bg-yellow-500';
    if (agent.pid > 0) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusText = (agent: Agent) => {
    if (agent.ready_for_cleanup) return 'Completed';
    if (agent.pid > 0) return 'Running';
    return 'Stopped';
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const handleStop = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await stopAgent(repoName, name);
  };

  const handleRestart = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await restartAgent(repoName, name);
  };

  const toggleExpand = (name: string) => {
    setExpandedAgent(expandedAgent === name ? null : name);
  };

  const isRunning = (agent: Agent) => agent.pid > 0 && !agent.ready_for_cleanup;
  const isStopped = (agent: Agent) => agent.pid <= 0;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Agents</h3>
        {agentEntries.length > 0 && onStopAll && (
          <button
            onClick={onStopAll}
            disabled={loading}
            className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200
                       transition-colors disabled:opacity-50"
          >
            Stop All
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {agentEntries.length === 0 ? (
        <p className="text-gray-500">No agents running for {repoName}</p>
      ) : (
        <ul className="space-y-3">
          {agentEntries.map(([name, agent]) => (
            <li
              key={name}
              className="border rounded-lg overflow-hidden transition-all"
            >
              {/* Agent Header - Clickable */}
              <div
                onClick={() => toggleExpand(name)}
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(agent)}`} />
                    <span className="font-medium">{name}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                      {agent.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{getStatusText(agent)}</span>
                    <span className="text-gray-400">
                      {expandedAgent === name ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {agent.task && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{agent.task}</p>
                )}

                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Created: {formatTime(agent.created_at)}</span>
                  {agent.last_nudge && (
                    <span>Last nudge: {formatTime(agent.last_nudge)}</span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedAgent === name && (
                <div className="border-t bg-gray-50 p-3">
                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    {isRunning(agent) && (
                      <button
                        onClick={(e) => void handleStop(name, e)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded
                                   hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Stopping...' : 'Stop'}
                      </button>
                    )}
                    {isStopped(agent) && (
                      <button
                        onClick={(e) => void handleRestart(name, e)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded
                                   hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Restarting...' : 'Restart'}
                      </button>
                    )}
                  </div>

                  {/* Details Grid */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-mono">{agent.type}</dd>

                    <dt className="text-gray-500">PID</dt>
                    <dd className="font-mono">{agent.pid > 0 ? agent.pid : '—'}</dd>

                    <dt className="text-gray-500">Session ID</dt>
                    <dd className="font-mono text-xs truncate" title={agent.session_id}>
                      {agent.session_id || '—'}
                    </dd>

                    <dt className="text-gray-500">tmux Window</dt>
                    <dd className="font-mono">{agent.tmux_window || '—'}</dd>

                    <dt className="text-gray-500">Worktree</dt>
                    <dd className="font-mono text-xs truncate" title={agent.worktree_path}>
                      {agent.worktree_path || '—'}
                    </dd>

                    <dt className="text-gray-500">Created</dt>
                    <dd>{formatDateTime(agent.created_at)}</dd>

                    {agent.last_nudge && (
                      <>
                        <dt className="text-gray-500">Last Nudge</dt>
                        <dd>{formatDateTime(agent.last_nudge)}</dd>
                      </>
                    )}
                  </dl>

                  {/* Task (full text) */}
                  {agent.task && (
                    <div className="mt-4">
                      <dt className="text-sm text-gray-500 mb-1">Task</dt>
                      <dd className="text-sm bg-white p-2 rounded border">{agent.task}</dd>
                    </div>
                  )}

                  {/* Summary */}
                  {agent.summary && (
                    <div className="mt-4">
                      <dt className="text-sm text-gray-500 mb-1">Summary</dt>
                      <dd className="text-sm bg-white p-2 rounded border">{agent.summary}</dd>
                    </div>
                  )}

                  {/* Failure Reason */}
                  {agent.failure_reason && (
                    <div className="mt-4">
                      <dt className="text-sm text-red-500 mb-1">Failure Reason</dt>
                      <dd className="text-sm bg-red-50 p-2 rounded border border-red-200 text-red-700">
                        {agent.failure_reason}
                      </dd>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
