import { AgentList } from './AgentList';
import { MessageFeed } from './MessageFeed';
import { TaskHistory } from './TaskHistory';

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-gray-400 mt-1">Monitor your agent swarm</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents panel */}
        <section className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-lg font-medium mb-4">Active Agents</h3>
          <AgentList />
        </section>

        {/* Messages panel */}
        <section className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-lg font-medium mb-4">Recent Messages</h3>
          <MessageFeed />
        </section>
      </div>

      {/* Task history */}
      <section className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-lg font-medium mb-4">Task History</h3>
        <TaskHistory />
      </section>
    </div>
  );
}
