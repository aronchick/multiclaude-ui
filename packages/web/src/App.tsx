import { useState } from 'react';
import AgentList from './components/AgentList';
import MessageFeed from './components/MessageFeed';
import TaskHistory from './components/TaskHistory';

type Tab = 'agents' | 'messages' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-mc-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <h1 className="text-xl font-semibold">Multiclaude Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot status-running" />
            <span className="text-sm text-gray-400">Daemon connected</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6">
        <div className="flex gap-1">
          <TabButton active={activeTab === 'agents'} onClick={() => setActiveTab('agents')}>
            Agents
          </TabButton>
          <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>
            Messages
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            Task History
          </TabButton>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        {activeTab === 'agents' && <AgentList />}
        {activeTab === 'messages' && <MessageFeed />}
        {activeTab === 'history' && <TaskHistory />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-6 py-3 text-sm text-gray-500">
        <div className="flex items-center justify-between">
          <span>multiclaude-ui v0.1.0</span>
          <span>Powered by @multiclaude/core</span>
        </div>
      </footer>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-mc-primary text-white'
          : 'border-transparent text-gray-400 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
