import type { Agent, State } from '@multiclaude/core';
import { isPersistentAgentType } from '@multiclaude/core';

interface AgentListProps {
  state: State;
}

function AgentCard({ name, agent }: { name: string; agent: Agent }): JSX.Element {
  const isPersistent = isPersistentAgentType(agent.type);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{name}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            isPersistent ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
          }`}
        >
          {agent.type}
        </span>
      </div>

      {agent.task && <p className="mt-2 text-sm text-gray-400">{agent.task}</p>}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>PID: {agent.pid}</span>
        <span>Window: {agent.tmux_window}</span>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Created: {new Date(agent.created_at).toLocaleString()}
      </div>
    </div>
  );
}

export default function AgentList({ state }: AgentListProps): JSX.Element {
  const currentRepo = state.current_repo;
  const repo = currentRepo ? state.repos[currentRepo] : undefined;

  if (!repo) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-gray-400">
        No repository selected
      </div>
    );
  }

  const agents = Object.entries(repo.agents);

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-gray-400">
        No agents running
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {agents.map(([name, agent]) => (
        <AgentCard key={name} name={name} agent={agent} />
      ))}
    </div>
  );
}
