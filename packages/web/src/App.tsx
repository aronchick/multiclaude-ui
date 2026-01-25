import { useState, useEffect } from 'react';
import type { State } from '@multiclaude/core';
import { AgentList } from './components/AgentList';
import { MessageFeed } from './components/MessageFeed';
import { TaskHistory } from './components/TaskHistory';

// Mock state for development - will be replaced with real StateReader
const MOCK_STATE: State = {
  repos: {
    'my-app': {
      github_url: 'https://github.com/user/my-app',
      tmux_session: 'mc-my-app',
      agents: {
        supervisor: {
          type: 'supervisor',
          worktree_path: '/path/to/worktree',
          tmux_window: '0',
          session_id: 'session-1',
          pid: 12345,
          created_at: new Date().toISOString(),
        },
        'merge-queue': {
          type: 'merge-queue',
          worktree_path: '/path/to/worktree',
          tmux_window: '1',
          session_id: 'session-2',
          pid: 12346,
          created_at: new Date().toISOString(),
        },
        'clever-fox': {
          type: 'worker',
          worktree_path: '/path/to/worktree',
          tmux_window: '2',
          session_id: 'session-3',
          pid: 12347,
          task: 'Implement user authentication',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          last_nudge: new Date().toISOString(),
        },
      },
      task_history: [
        {
          name: 'brave-lion',
          task: 'Fix login bug',
          branch: 'multiclaude/brave-lion',
          pr_url: 'https://github.com/user/my-app/pull/42',
          pr_number: 42,
          status: 'merged',
          summary: 'Fixed race condition in session validation',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          completed_at: new Date(Date.now() - 82800000).toISOString(),
        },
        {
          name: 'swift-eagle',
          task: 'Add dark mode',
          branch: 'multiclaude/swift-eagle',
          pr_url: 'https://github.com/user/my-app/pull/43',
          pr_number: 43,
          status: 'open',
          created_at: new Date(Date.now() - 43200000).toISOString(),
        },
      ],
    },
  },
  current_repo: 'my-app',
};

export default function App() {
  const [state, setState] = useState<State>(MOCK_STATE);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(
    state.current_repo ?? null
  );

  // In production, this would use StateReader from @multiclaude/core
  useEffect(() => {
    // TODO: Replace with real StateReader
    // const reader = new StateReader();
    // reader.on('change', setState);
    // reader.watch();
    // return () => reader.close();
  }, []);

  const repos = Object.keys(state.repos);
  const currentRepo = selectedRepo ? state.repos[selectedRepo] : undefined;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-400">
              multiclaude
            </h1>
            <div className="flex items-center gap-4">
              <select
                value={selectedRepo ?? ''}
                onChange={(e) => setSelectedRepo(e.target.value || null)}
                className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select repository</option>
                {repos.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {currentRepo ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column - Agents */}
            <div className="lg:col-span-2">
              <AgentList
                agents={currentRepo.agents}
                repoName={selectedRepo ?? ''}
              />
            </div>

            {/* Right column - Messages & History */}
            <div className="space-y-6">
              <MessageFeed repoName={selectedRepo ?? ''} />
              <TaskHistory history={currentRepo.task_history ?? []} />
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <p>Select a repository to view agents and activity</p>
          </div>
        )}
      </main>
    </div>
  );
}
