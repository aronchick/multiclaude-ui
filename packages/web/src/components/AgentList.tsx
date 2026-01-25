import type { Agent, AgentType } from '@multiclaude/core';

/**
 * Placeholder agent data for development
 */
const mockAgents: Array<{ name: string; repo: string; agent: Agent }> = [
  {
    name: 'supervisor',
    repo: 'my-app',
    agent: {
      type: 'supervisor',
      worktree_path: '/home/user/.multiclaude/wts/my-app/supervisor',
      tmux_window: '0',
      session_id: 'claude-abc123',
      pid: 12345,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      last_nudge: new Date(Date.now() - 120000).toISOString(),
    },
  },
  {
    name: 'merge-queue',
    repo: 'my-app',
    agent: {
      type: 'merge-queue',
      worktree_path: '/home/user/.multiclaude/wts/my-app/merge-queue',
      tmux_window: '1',
      session_id: 'claude-def456',
      pid: 12346,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      last_nudge: new Date(Date.now() - 60000).toISOString(),
    },
  },
  {
    name: 'clever-fox',
    repo: 'my-app',
    agent: {
      type: 'worker',
      worktree_path: '/home/user/.multiclaude/wts/my-app/clever-fox',
      tmux_window: '2',
      session_id: 'claude-ghi789',
      pid: 12347,
      task: 'Add user authentication with JWT',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      last_nudge: new Date(Date.now() - 30000).toISOString(),
    },
  },
];

export default function AgentList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active Agents</h2>
        <button className="btn btn-primary text-sm">Spawn Worker</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockAgents.map(({ name, repo, agent }) => (
          <AgentCard key={`${repo}-${name}`} name={name} repo={repo} agent={agent} />
        ))}
      </div>

      <p className="text-sm text-gray-500 italic">
        Note: This is placeholder data. Connect to daemon for live updates.
      </p>
    </div>
  );
}

interface AgentCardProps {
  name: string;
  repo: string;
  agent: Agent;
}

function AgentCard({ name, repo, agent }: AgentCardProps) {
  const isRunning = agent.pid > 0;
  const typeColors: Record<AgentType, string> = {
    supervisor: 'bg-purple-500/20 text-purple-300',
    'merge-queue': 'bg-blue-500/20 text-blue-300',
    worker: 'bg-green-500/20 text-green-300',
    'pr-shepherd': 'bg-amber-500/20 text-amber-300',
    workspace: 'bg-cyan-500/20 text-cyan-300',
    review: 'bg-pink-500/20 text-pink-300',
    'generic-persistent': 'bg-gray-500/20 text-gray-300',
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isRunning ? 'status-running' : 'status-idle'}`} />
          <span className="font-medium">{name}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${typeColors[agent.type]}`}>{agent.type}</span>
      </div>

      <div className="mt-3 space-y-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Repo:</span>
          <span className="text-gray-300">{repo}</span>
        </div>
        <div className="flex justify-between">
          <span>PID:</span>
          <span className="text-gray-300">{agent.pid || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Created:</span>
          <span className="text-gray-300">{relativeTime(agent.created_at)}</span>
        </div>
        {agent.last_nudge && (
          <div className="flex justify-between">
            <span>Last nudge:</span>
            <span className="text-gray-300">{relativeTime(agent.last_nudge)}</span>
          </div>
        )}
      </div>

      {agent.task && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-gray-300 line-clamp-2">{agent.task}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button className="btn btn-secondary text-xs flex-1">Attach</button>
        {agent.type === 'worker' && (
          <button className="btn bg-red-900/50 hover:bg-red-900 text-red-300 text-xs">Stop</button>
        )}
      </div>
    </div>
  );
}
