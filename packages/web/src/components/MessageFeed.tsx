import { MessageSquare, Loader2 } from 'lucide-react';
import type { AgentMessage } from '@multiclaude/core';

// Placeholder data - will be replaced with real message reader
const placeholderMessages: AgentMessage[] = [
  {
    id: 'msg-001',
    from: 'supervisor',
    to: 'clever-fox',
    timestamp: new Date().toISOString(),
    body: 'Please implement user authentication using JWT tokens.',
    status: 'delivered',
  },
  {
    id: 'msg-002',
    from: 'clever-fox',
    to: 'supervisor',
    timestamp: new Date().toISOString(),
    body: 'Task completed. PR #42 created.',
    status: 'pending',
  },
];

const statusColors = {
  pending: 'bg-yellow-500',
  delivered: 'bg-blue-500',
  read: 'bg-green-500',
  acknowledged: 'bg-gray-500',
};

export function MessageFeed() {
  // TODO: Use MessageReader from @multiclaude/core
  const messages = placeholderMessages;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No messages</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li
          key={message.id}
          className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{message.from}</span>
            <span className="text-gray-500 text-xs">&rarr;</span>
            <span className="font-medium text-sm">{message.to}</span>
            <span className={`w-2 h-2 rounded-full ml-auto ${statusColors[message.status]}`} />
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">{message.body}</p>
          <p className="text-xs text-gray-500 mt-2 font-mono">{message.id}</p>
        </li>
      ))}
    </ul>
  );
}
