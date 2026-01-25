import { AgentList } from './components/AgentList';
import { MessageFeed } from './components/MessageFeed';
import { TaskHistory } from './components/TaskHistory';

/**
 * Main application component for multiclaude dashboard.
 *
 * This is a scaffold - implement actual functionality by:
 * 1. Using StateReader from @multiclaude/core to watch state
 * 2. Using DaemonClient for control operations
 * 3. Using MessageReader for real-time message updates
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-mc-primary-400">multiclaude</h1>
            <div className="text-sm text-gray-400">Dashboard</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Agents */}
          <div className="lg:col-span-2">
            <AgentList />
          </div>

          {/* Right column - Messages & History */}
          <div className="space-y-8">
            <MessageFeed />
            <TaskHistory />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
