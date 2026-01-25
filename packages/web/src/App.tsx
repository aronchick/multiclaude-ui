import { type State, isPersistentAgentType } from '@multiclaude/core';
import AgentList from './components/AgentList';
import MessageFeed from './components/MessageFeed';
import TaskHistory from './components/TaskHistory';

// Placeholder state for development - will be replaced with real data
const placeholderState: State = {
  repos: {
    'my-repo': {
      github_url: 'https://github.com/example/my-repo',
      tmux_session: 'mc-my-repo',
      agents: {
        supervisor: {
          type: 'supervisor',
          worktree_path: '/path/to/worktree',
          tmux_window: 'supervisor',
          session_id: 'session-1',
          pid: 12345,
          created_at: new Date().toISOString(),
        },
        'happy-panda': {
          type: 'worker',
          worktree_path: '/path/to/worktree/worker',
          tmux_window: 'happy-panda',
          session_id: 'session-2',
          pid: 12346,
          task: 'Implement feature X',
          created_at: new Date().toISOString(),
        },
      },
      task_history: [
        {
          name: 'clever-fox',
          task: 'Fix bug in authentication',
          branch: 'work/clever-fox',
          status: 'merged',
          pr_url: 'https://github.com/example/my-repo/pull/42',
          pr_number: 42,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date().toISOString(),
        },
      ],
    },
  },
  current_repo: 'my-repo',
};

function App(): JSX.Element {
  // Demo: Check if supervisor is persistent
  const supervisorAgent = placeholderState.repos['my-repo']?.agents['supervisor'];
  const isPersistent = supervisorAgent ? isPersistentAgentType(supervisorAgent.type) : false;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold">multiclaude Dashboard</h1>
        <p className="text-sm text-gray-400">
          Agent orchestration for parallel development
          {isPersistent && ' | Supervisor: persistent'}
        </p>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Agents</h2>
            <AgentList state={placeholderState} />
          </section>

          <aside>
            <h2 className="mb-4 text-xl font-semibold">Messages</h2>
            <MessageFeed />
          </aside>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Task History</h2>
          <TaskHistory state={placeholderState} />
        </section>
      </main>
    </div>
  );
}

export default App;
