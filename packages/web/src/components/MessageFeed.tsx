interface MessageFeedProps {
  repoName: string;
}

// Placeholder message type - will be replaced with Message from @multiclaude/core
interface MockMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

// Mock messages for development
const MOCK_MESSAGES: MockMessage[] = [
  {
    id: 'msg-1',
    from: 'supervisor',
    to: 'clever-fox',
    content: 'Task assigned: Implement user authentication',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    from: 'clever-fox',
    to: 'supervisor',
    content: 'Starting work on authentication. Will create PR when ready.',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageFeed({ repoName: _repoName }: MessageFeedProps) {
  // In production, this would use MessageReader from @multiclaude/core
  const messages = MOCK_MESSAGES;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold">Messages</h2>
        <p className="text-sm text-slate-400">Inter-agent communication</p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400">
            No recent messages
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {messages.map((message) => (
              <div key={message.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    <span className="font-medium text-primary-400">{message.from}</span>
                    {' → '}
                    <span className="font-medium text-slate-300">{message.to}</span>
                  </span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
