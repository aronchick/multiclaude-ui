import { useState, useEffect } from 'react';
import { AgentList } from './components/AgentList';
import { MessageFeed } from './components/MessageFeed';
import { TaskHistory } from './components/TaskHistory';
import { RadarDisplay } from './components/RadarDisplay';
import { useMulticlaude, useDaemonStatus } from './hooks/useMulticlaude';

/**
 * Main dashboard application.
 *
 * Uses hooks from useMulticlaude to fetch and display daemon state.
 * In development, mock data is displayed. In production, this would
 * connect to a backend API or run in Electron with direct socket access.
 */
function App() {
  const { state, loading, error, refresh } = useMulticlaude();
  const { connected, checking } = useDaemonStatus();
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);

  // Auto-select first repo when state loads
  useEffect(() => {
    if (state && !currentRepo) {
      const repoNames = Object.keys(state.repos);
      const firstRepo = repoNames[0];
      if (firstRepo) {
        setCurrentRepo(firstRepo);
      }
    }
  }, [state, currentRepo]);

  // Demo signal strength - in production, derive from daemon health metrics
  const [signalStrength, setSignalStrength] = useState(75);

  // Simulate varying signal for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalStrength((prev) => {
        const delta = (Math.random() - 0.5) * 20;
        return Math.max(5, Math.min(95, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="flex items-center gap-2 text-sm mb-4">
            <span
              className={`w-2 h-2 rounded-full ${
                checking ? 'bg-yellow-500 animate-pulse' : connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-400">
              Daemon: {checking ? 'Checking...' : connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">System Health</h2>
          <div className="flex justify-center">
            <RadarDisplay signalStrength={signalStrength} size={180} />
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error.message}
          </div>
        )}
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
