import { useState } from 'react';
import type { Agent } from '@multiclaude/core';
import { useDaemon } from '../hooks/useDaemon';
import { ExpandableText } from './ExpandableText';

interface AgentListProps {
  agents: Record<string, Agent>;
  repoName: string;
}

/**
 * AgentList displays all agents for a repository with status indicators and controls.
 */
export function AgentList({ agents, repoName }: AgentListProps) {
  const agentEntries = Object.entries(agents);
  const { killAgent, stopRepo, loading } = useDaemon();
  const [killingAgent, setKillingAgent] = useState<string | null>(null);
  const [stoppingRepo, setStoppingRepo] = useState(false);

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

  const handleKillAgent = async (name: string) => {
    if (!confirm(`Kill agent "${name}"?`)) return;
    setKillingAgent(name);
    try {
      await killAgent(repoName, name);
    } catch (err) {
      alert(`Failed to kill agent: ${err}`);
    } finally {
      setKillingAgent(null);
    }
  };

  const handleStopAll = async () => {
    if (!confirm(`Stop all agents in "${repoName}"?`)) return;
    setStoppingRepo(true);
    try {
      await stopRepo(repoName);
    } catch (err) {
      alert(`Failed to stop repo: ${err}`);
    } finally {
      setStoppingRepo(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Agents</h3>
        {agentEntries.length > 0 && (
          <button
            onClick={handleStopAll}
            disabled={loading || stoppingRepo}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stoppingRepo ? 'Stopping...' : 'Stop All'}
          </button>
        )}
      </div>

      {agentEntries.length === 0 ? (
        <p className="text-gray-500">No agents running for {repoName}</p>
      ) : (
        <ul className="space-y-3">
          {agentEntries.map(([name, agent]) => (
            <li key={name} className="border rounded-lg p-3">
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
                  {agent.pid > 0 && (
                    <button
                      onClick={() => handleKillAgent(name)}
                      disabled={loading || killingAgent === name}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded
                                 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      title="Kill this agent"
                    >
                      {killingAgent === name ? '...' : '✕'}
                    </button>
                  )}
                </div>
              </div>

              {agent.task && (
                <div className="text-sm text-gray-600 mb-2">
                  <ExpandableText text={agent.task} maxLength={80} title={`Task: ${name}`} />
                </div>
              )}

              {agent.summary && (
                <div className="text-sm text-green-700 mb-2">
                  <ExpandableText text={agent.summary} maxLength={80} title={`Summary: ${name}`} />
                </div>
              )}

              {agent.failure_reason && (
                <div className="text-sm text-red-600 mb-2">
                  <ExpandableText text={agent.failure_reason} maxLength={80} title={`Failure: ${name}`} />
                </div>
              )}

              <div className="flex gap-4 text-xs text-gray-400">
                <span>Created: {formatTime(agent.created_at)}</span>
                {agent.last_nudge && agent.last_nudge !== '0001-01-01T00:00:00Z' && (
                  <span>Last nudge: {formatTime(agent.last_nudge)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
