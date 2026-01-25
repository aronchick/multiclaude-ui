import type { Agent } from '@multiclaude/core';

interface AgentListProps {
  agents: Record<string, Agent>;
  repoName: string;
}

/**
 * AgentList displays all agents for a repository with status indicators.
 */
export function AgentList({ agents, repoName }: AgentListProps) {
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

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Agents</h3>

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
                <span className="text-xs text-gray-500">{getStatusText(agent)}</span>
              </div>

              {agent.task && (
                <p className="text-sm text-gray-600 mb-2">{agent.task}</p>
              )}

              <div className="flex gap-4 text-xs text-gray-400">
                <span>Created: {formatTime(agent.created_at)}</span>
                {agent.last_nudge && (
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
