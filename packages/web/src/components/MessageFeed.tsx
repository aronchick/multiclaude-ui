interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

// Placeholder messages for development
const placeholderMessages: Message[] = [
  {
    id: '1',
    from: 'supervisor',
    to: 'happy-panda',
    content: 'Please implement feature X',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '2',
    from: 'happy-panda',
    to: 'supervisor',
    content: 'Starting work on feature X',
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
];

export default function MessageFeed(): JSX.Element {
  const messages = placeholderMessages;

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-gray-400">
        No messages
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="rounded-lg border border-gray-700 bg-gray-800 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400">
              {msg.from} → {msg.to}
            </span>
            <span className="text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="mt-2 text-sm">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
