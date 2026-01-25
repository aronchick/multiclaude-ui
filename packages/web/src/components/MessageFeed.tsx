import type { Message } from '@multiclaude/core';

/**
 * Placeholder message data for development
 */
const mockMessages: Array<{ message: Message; repo: string; agent: string }> = [
  {
    repo: 'my-app',
    agent: 'supervisor',
    message: {
      id: 'msg-001',
      from: 'clever-fox',
      to: 'supervisor',
      content: 'Authentication feature complete. PR created at #42. Ready for review.',
      created_at: new Date(Date.now() - 300000).toISOString(),
      acknowledged: false,
    },
  },
  {
    repo: 'my-app',
    agent: 'merge-queue',
    message: {
      id: 'msg-002',
      from: 'supervisor',
      to: 'merge-queue',
      content: 'Please prioritize PR #42 for merge.',
      created_at: new Date(Date.now() - 600000).toISOString(),
      acknowledged: true,
      acknowledged_at: new Date(Date.now() - 540000).toISOString(),
    },
  },
  {
    repo: 'my-app',
    agent: 'supervisor',
    message: {
      id: 'msg-003',
      from: 'brave-lion',
      to: 'supervisor',
      content: 'Encountered test failures in CI. Investigating root cause.',
      created_at: new Date(Date.now() - 1200000).toISOString(),
      acknowledged: true,
      acknowledged_at: new Date(Date.now() - 1100000).toISOString(),
    },
  },
];

export default function MessageFeed() {
  const pendingMessages = mockMessages.filter((m) => !m.message.acknowledged);
  const acknowledgedMessages = mockMessages.filter((m) => m.message.acknowledged);

  return (
    <div className="space-y-6">
      {/* Pending messages */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Pending Messages
          {pendingMessages.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-mc-warning/20 text-mc-warning rounded">
              {pendingMessages.length}
            </span>
          )}
        </h2>

        {pendingMessages.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending messages</p>
        ) : (
          <div className="space-y-3">
            {pendingMessages.map(({ message, repo, agent }) => (
              <MessageCard
                key={message.id}
                message={message}
                repo={repo}
                agent={agent}
                pending
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent messages */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Messages</h2>
        <div className="space-y-3">
          {acknowledgedMessages.map(({ message, repo, agent }) => (
            <MessageCard key={message.id} message={message} repo={repo} agent={agent} />
          ))}
        </div>
      </section>

      <p className="text-sm text-gray-500 italic">
        Note: This is placeholder data. Connect to daemon for live updates.
      </p>
    </div>
  );
}

interface MessageCardProps {
  message: Message;
  repo: string;
  agent: string;
  pending?: boolean;
}

function MessageCard({ message, repo, agent, pending }: MessageCardProps) {
  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`card ${pending ? 'border-mc-warning/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mc-primary font-medium">{message.from}</span>
          <span className="text-gray-500">→</span>
          <span className="text-mc-secondary font-medium">{message.to}</span>
        </div>
        <span className="text-xs text-gray-500">{relativeTime(message.created_at)}</span>
      </div>

      <p className="mt-2 text-sm text-gray-300">{message.content}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {repo}/{agent}
        </span>
        {pending ? (
          <button className="btn btn-primary text-xs py-1 px-3">Acknowledge</button>
        ) : (
          <span className="text-mc-secondary">Acknowledged</span>
        )}
      </div>
    </div>
  );
}
