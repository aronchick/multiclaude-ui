import type { Agent } from '@multiclaude/core';

/**
 * Props for AgentCard component
 */
interface AgentCardProps {
  name: string;
  agent: Agent;
  repo: string;
}

/**
 * Display card for a single agent
 */
function AgentCard({ name, agent, repo }: AgentCardProps) {
  const isRunning = agent.pid > 0;
  const statusColor = isRunning ? 'bg-green-500' : 'bg-gray-500';
  const typeColors: Record<string, string> = {
    supervisor: 'text-purple-400',
    worker: 'text-blue-400',
    'merge-queue': 'text-yellow-400',
    workspace: 'text-green-400',
    review: 'text-orange-400',
    'pr-shepherd': 'text-pink-400',
    'generic-persistent': 'text-gray-400',
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            <h3 className="font-medium text-white">{name}</h3>
          </div>
          <p className={`mt-1 text-sm ${typeColors[agent.type] ?? 'text-gray-400'}`}>
            {agent.type}
          </p>
        </div>
        <span className="text-xs text-gray-500">{repo}</span>
      </div>

      {agent.task !== undefined && agent.task !== '' && (
        <p className="mt-3 text-sm text-gray-300">{agent.task}</p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>PID: {agent.pid > 0 ? agent.pid : 'N/A'}</span>
        <span>{new Date(agent.created_at).toLocaleString()}</span>
      </div>
    </div>
  );
}

/**
 * List of all agents across repositories.
 *
 * Placeholder implementation - integrate with StateReader:
 * ```typescript
 * const [agents, setAgents] = useState<Agent[]>([]);
 * const reader = useMemo(() => new StateReader(), []);
 *
 * useEffect(() => {
 *   reader.on('change', (state) => {
 *     setAgents(reader.getActiveWorkers());
 *   });
 *   reader.watch();
 *   return () => reader.close();
 * }, [reader]);
 * ```
 */
export function AgentList() {
  // TODO: Replace with real data from StateReader
  const mockAgents: Array<{ name: string; repo: string; agent: Agent }> = [
    {
      name: 'supervisor',
      repo: 'my-app',
      agent: {
        type: 'supervisor',
        worktree_path: '/path/to/worktree',
        tmux_window: '0',
        session_id: 'abc123',
        pid: 12345,
        created_at: new Date().toISOString(),
      },
    },
    {
      name: 'clever-fox',
      repo: 'my-app',
      agent: {
        type: 'worker',
        worktree_path: '/path/to/worktree',
        tmux_window: '1',
        session_id: 'def456',
        pid: 12346,
        task: 'Implement user authentication with JWT',
        created_at: new Date().toISOString(),
      },
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Agents</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {mockAgents.map(({ name, repo, agent }) => (
          <AgentCard key={`${repo}-${name}`} name={name} repo={repo} agent={agent} />
        ))}
      </div>
    </div>
  );
}
