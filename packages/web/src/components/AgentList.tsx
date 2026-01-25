import { Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Agent, AgentType } from '@multiclaude/core';

// Placeholder data - will be replaced with real state reader
const placeholderAgents: Array<Agent & { name: string }> = [
  {
    name: 'supervisor',
    type: 'supervisor',
    worktree_path: '/path/to/worktree',
    tmux_window: 'mc-repo:supervisor',
    session_id: 'session-123',
    pid: 12345,
    created_at: new Date().toISOString(),
  },
  {
    name: 'clever-fox',
    type: 'worker',
    worktree_path: '/path/to/worktree',
    tmux_window: 'mc-repo:clever-fox',
    session_id: 'session-456',
    pid: 12346,
    task: 'Implement user authentication',
    created_at: new Date().toISOString(),
  },
];

const agentTypeColors: Record<AgentType, string> = {
  supervisor: 'text-purple-400',
  worker: 'text-blue-400',
  'merge-queue': 'text-green-400',
  'pr-shepherd': 'text-yellow-400',
  workspace: 'text-cyan-400',
  review: 'text-orange-400',
  'generic-persistent': 'text-gray-400',
};

function AgentStatusIcon({ pid }: { pid: number }) {
  if (pid === 0) {
    return <AlertCircle className="w-4 h-4 text-mc-error" />;
  }
  return <CheckCircle className="w-4 h-4 text-mc-success" />;
}

export function AgentList() {
  // TODO: Use StateReader from @multiclaude/core
  const agents = placeholderAgents;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No active agents</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {agents.map((agent) => (
        <li
          key={agent.name}
          className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          <AgentStatusIcon pid={agent.pid} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{agent.name}</span>
              <span className={`text-xs ${agentTypeColors[agent.type]}`}>{agent.type}</span>
            </div>
            {agent.task && (
              <p className="text-sm text-gray-400 mt-1 truncate">{agent.task}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 font-mono">{agent.tmux_window}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
