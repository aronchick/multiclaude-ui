interface MessageFeedProps {
  repoName: string;
}

/**
 * MessageFeed displays real-time inter-agent messages.
 *
 * This is a placeholder - actual implementation would use MessageReader
 * from @multiclaude/core to watch for new messages.
 */
export function MessageFeed({ repoName }: MessageFeedProps) {
  // Placeholder - in a real app, this would use MessageReader
  const messages: Array<{
    id: string;
    from: string;
    to: string;
    content: string;
    created_at: string;
  }> = [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Messages</h3>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No messages for {repoName}</p>
          <p className="text-sm mt-1">Inter-agent messages will appear here</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <li key={msg.id} className="border-l-2 border-mc-primary-400 pl-3 py-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{msg.from}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{msg.to}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
