import type { Message } from '@multiclaude/core';

/**
 * Props for MessageItem component
 */
interface MessageItemProps {
  message: Message;
}

/**
 * Display a single message
 */
function MessageItem({ message }: MessageItemProps) {
  return (
    <div className="rounded border-l-2 border-mc-primary-500 bg-gray-800 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-mc-primary-400">{message.from}</span>
        <span className="text-gray-500">
          → {message.to}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-300">{message.content}</p>
      <div className="mt-2 text-xs text-gray-500">
        {new Date(message.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

/**
 * Real-time message feed showing inter-agent communication.
 *
 * Placeholder implementation - integrate with MessageReader:
 * ```typescript
 * const [messages, setMessages] = useState<Message[]>([]);
 * const reader = useMemo(() => new MessageReader(), []);
 *
 * useEffect(() => {
 *   reader.on('message', (msg) => {
 *     setMessages((prev) => [msg, ...prev].slice(0, 50));
 *   });
 *   reader.watch();
 *   return () => reader.close();
 * }, [reader]);
 * ```
 */
export function MessageFeed() {
  // TODO: Replace with real data from MessageReader
  const mockMessages: Message[] = [
    {
      id: '1',
      from: 'supervisor',
      to: 'clever-fox',
      content: 'Great progress on the auth feature! Remember to add tests.',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      from: 'clever-fox',
      to: 'supervisor',
      content: 'Tests added. Creating PR now.',
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Messages</h2>
      <div className="space-y-3">
        {mockMessages.length === 0 ? (
          <p className="text-sm text-gray-500">No recent messages</p>
        ) : (
          mockMessages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
}
