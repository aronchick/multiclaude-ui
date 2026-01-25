import { useState } from 'react';
import type { State, Repository } from '@multiclaude/core';
import { AgentList } from './components/AgentList';
import { MessageFeed } from './components/MessageFeed';
import { TaskHistory } from './components/TaskHistory';

// Mock state for development
const mockState: State = {
  repos: {
    'example-app': {
      github_url: 'https://github.com/user/example-app',
      tmux_session: 'mc-example-app',
      agents: {
        supervisor: {
          type: 'supervisor',
          worktree_path: '/home/user/.multiclaude/wts/example-app/supervisor',
          tmux_window: '0',
          session_id: 'claude-abc123',
          pid: 12345,
          created_at: '2024-01-15T10:00:00Z',
          last_nudge: '2024-01-15T10:30:00Z',
        },
        'merge-queue': {
          type: 'merge-queue',
          worktree_path: '/home/user/.multiclaude/wts/example-app/merge-queue',
          tmux_window: '1',
          session_id: 'claude-def456',
          pid: 12346,
          created_at: '2024-01-15T10:00:00Z',
        },
        'clever-fox': {
          type: 'worker',
          worktree_path: '/home/user/.multiclaude/wts/example-app/clever-fox',
          tmux_window: '2',
          session_id: 'claude-ghi789',
          pid: 12347,
          task: 'Add user authentication',
          created_at: '2024-01-15T10:15:00Z',
          last_nudge: '2024-01-15T10:30:00Z',
        },
      },
      task_history: [
        {
          name: 'brave-lion',
          task: 'Fix login bug',
          branch: 'multiclaude/brave-lion',
          pr_url: 'https://github.com/user/example-app/pull/41',
          pr_number: 41,
          status: 'merged',
          summary: 'Fixed race condition in session validation',
          created_at: '2024-01-14T15:00:00Z',
          completed_at: '2024-01-14T16:30:00Z',
        },
        {
          name: 'swift-eagle',
          task: 'Add dark mode support',
          branch: 'multiclaude/swift-eagle',
          pr_url: 'https://github.com/user/example-app/pull/42',
          pr_number: 42,
          status: 'open',
          created_at: '2024-01-15T09:00:00Z',
        },
      ],
    },
  },
  current_repo: 'example-app',
};

export default function App() {
  const [state] = useState<State>(mockState);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(state.current_repo ?? null);

  const repos = Object.keys(state.repos);
  const currentRepo: Repository | undefined = selectedRepo ? state.repos[selectedRepo] : undefined;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h1 className="text-xl font-bold text-primary-400 mb-6">multiclaude</h1>

        <nav>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Repositories</h2>
          <ul className="space-y-1">
            {repos.map((repo) => (
              <li key={repo}>
                <button
                  onClick={() => setSelectedRepo(repo)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedRepo === repo
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {repo}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700 mt-6">
          <p className="text-xs text-gray-500">
            {repos.length} repo{repos.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {currentRepo ? (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedRepo}</h2>
              <a
                href={currentRepo.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                View on GitHub →
              </a>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentList
                agents={currentRepo.agents}
                repoName={selectedRepo ?? ''}
              />
              <MessageFeed repoName={selectedRepo ?? ''} />
            </div>

            <TaskHistory history={currentRepo.task_history ?? []} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a repository from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}
