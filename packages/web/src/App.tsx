import { useState } from 'react';
import type { State } from '@multiclaude/core';
import { AgentList } from './components/AgentList';
import { MessageFeed } from './components/MessageFeed';
import { TaskHistory } from './components/TaskHistory';

/**
 * Main dashboard application.
 *
 * This is a scaffold - the actual state management and data fetching
 * will need to be implemented based on how the dashboard is deployed
 * (e.g., Electron app with direct socket access, or web app with a backend proxy).
 */
function App() {
  // Placeholder state - in a real app, this would come from StateReader
  const [state] = useState<State | null>(null);
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);

  const repos = state ? Object.keys(state.repos) : [];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Multiclaude</h1>

        <nav className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Repositories</h2>
          {repos.length === 0 ? (
            <p className="text-gray-500 text-sm">No repositories tracked</p>
          ) : (
            repos.map((repo) => (
              <button
                key={repo}
                onClick={() => setCurrentRepo(repo)}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  currentRepo === repo
                    ? 'bg-mc-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {repo}
              </button>
            ))
          )}
        </nav>

        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Status</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">Daemon: Unknown</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {!currentRepo ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Multiclaude Dashboard</h2>
              <p>Select a repository from the sidebar to get started.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold">{currentRepo}</h2>
              <p className="text-gray-500">
                {state?.repos[currentRepo]?.github_url ?? 'Loading...'}
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentList
                agents={state?.repos[currentRepo]?.agents ?? {}}
                repoName={currentRepo}
              />
              <MessageFeed repoName={currentRepo} />
            </div>

            <TaskHistory
              history={state?.repos[currentRepo]?.task_history ?? []}
              repoName={currentRepo}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
