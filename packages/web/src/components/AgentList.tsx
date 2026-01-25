import type { Agent } from '@multiclaude/core';

interface AgentListProps {
  agents: Record<string, Agent>;
  repoName: string;
}

const agentTypeColors: Record<string, string> = {
  supervisor: 'bg-purple-500',
  'merge-queue': 'bg-blue-500',
  worker: 'bg-green-500',
  workspace: 'bg-yellow-500',
  review: 'bg-orange-500',
  'pr-shepherd': 'bg-pink-500',
  'generic-persistent': 'bg-gray-500',
};

const statusColors = {
  running: 'bg-green-400',
  stopped: 'bg-red-400',
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimeSince(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function AgentList({ agents, repoName }: AgentListProps) {
  const agentEntries = Object.entries(agents);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold">Active Agents</h3>
        <p className="text-xs text-gray-400">{agentEntries.length} agents in {repoName}</p>
      </div>

      <div className="divide-y divide-gray-700">
        {agentEntries.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No agents running
          </div>
        ) : (
          agentEntries.map(([name, agent]) => {
            const isRunning = agent.pid > 0;
            const typeColor = agentTypeColors[agent.type] ?? 'bg-gray-500';

            return (
              <div key={name} className="px-4 py-3 hover:bg-gray-750">
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <span
                    className={`w-2 h-2 rounded-full ${isRunning ? statusColors.running : statusColors.stopped}`}
                    title={isRunning ? 'Running' : 'Stopped'}
                  />

                  {/* Agent name and type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{name}</span>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${typeColor} text-white`}
                      >
                        {agent.type}
                      </span>
                    </div>

                    {/* Task (for workers) */}
                    {agent.task && (
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {agent.task}
                      </p>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 text-right">
                    <div>Created {formatTime(agent.created_at)}</div>
                    {agent.last_nudge && (
                      <div>Nudged {formatTimeSince(agent.last_nudge)}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
