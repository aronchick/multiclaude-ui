import type { Agent } from '@multiclaude/core';

interface AgentListProps {
  agents: Record<string, Agent>;
  repoName: string;
}

const AGENT_TYPE_COLORS: Record<string, string> = {
  supervisor: 'bg-purple-500',
  'merge-queue': 'bg-blue-500',
  'pr-shepherd': 'bg-indigo-500',
  worker: 'bg-green-500',
  workspace: 'bg-orange-500',
  review: 'bg-yellow-500',
  'generic-persistent': 'bg-gray-500',
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  supervisor: 'Supervisor',
  'merge-queue': 'Merge Queue',
  'pr-shepherd': 'PR Shepherd',
  worker: 'Worker',
  workspace: 'Workspace',
  review: 'Review',
  'generic-persistent': 'Persistent',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function AgentList({ agents, repoName }: AgentListProps) {
  const agentEntries = Object.entries(agents);

  // Sort: persistent agents first, then workers by creation time
  agentEntries.sort((a, b) => {
    const typeOrder = ['supervisor', 'merge-queue', 'pr-shepherd', 'workspace', 'worker', 'review'];
    const aOrder = typeOrder.indexOf(a[1].type);
    const bOrder = typeOrder.indexOf(b[1].type);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b[1].created_at).getTime() - new Date(a[1].created_at).getTime();
  });

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold">Agents</h2>
        <p className="text-sm text-slate-400">{repoName}</p>
      </div>

      <div className="divide-y divide-slate-700">
        {agentEntries.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400">
            No active agents
          </div>
        ) : (
          agentEntries.map(([name, agent]) => (
            <div key={name} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className="relative">
                    {agent.pid > 0 ? (
                      <>
                        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                      </>
                    ) : (
                      <span className="inline-flex h-3 w-3 rounded-full bg-slate-500"></span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          AGENT_TYPE_COLORS[agent.type] ?? 'bg-gray-500'
                        }`}
                      >
                        {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
                      </span>
                    </div>

                    {agent.task && (
                      <p className="mt-1 text-sm text-slate-300">{agent.task}</p>
                    )}

                    <p className="mt-1 text-xs text-slate-500">
                      Created {formatRelativeTime(agent.created_at)}
                      {agent.last_nudge && (
                        <> · Last active {formatRelativeTime(agent.last_nudge)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
                    title="Attach to tmux window"
                  >
                    Attach
                  </button>
                  {agent.type === 'worker' && (
                    <button
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-slate-700 hover:text-red-300"
                      title="Remove worker"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
