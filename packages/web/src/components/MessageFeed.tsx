interface MessageFeedProps {
  repoName: string;
}

// Mock messages for development
const mockMessages = [
  {
    id: 'msg-1',
    from: 'supervisor',
    to: 'clever-fox',
    content: 'Task assigned: Add user authentication. Please review the existing auth patterns in src/auth/',
    timestamp: '2024-01-15T10:15:00Z',
  },
  {
    id: 'msg-2',
    from: 'clever-fox',
    to: 'supervisor',
    content: 'Starting work on authentication. Will use JWT tokens with refresh mechanism.',
    timestamp: '2024-01-15T10:16:00Z',
  },
  {
    id: 'msg-3',
    from: 'merge-queue',
    to: 'supervisor',
    content: 'PR #41 merged successfully. CI passed with all green checks.',
    timestamp: '2024-01-15T10:20:00Z',
  },
];

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageFeed({ repoName }: MessageFeedProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold">Message Feed</h3>
        <p className="text-xs text-gray-400">Inter-agent messages for {repoName}</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {mockMessages.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No messages yet
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {mockMessages.map((msg) => (
              <div key={msg.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary-400 font-medium text-sm">
                    {msg.from}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-300 font-medium text-sm">
                    {msg.to}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Live updates coming soon
        </p>
      </div>
    </div>
  );
}
