import { History, Loader2, ExternalLink, GitPullRequest } from 'lucide-react';
import type { TaskHistoryEntry, TaskStatus } from '@multiclaude/core';

// Placeholder data - will be replaced with real state reader
const placeholderTasks: TaskHistoryEntry[] = [
  {
    name: 'clever-fox',
    task: 'Implement user authentication using JWT tokens',
    branch: 'work/clever-fox',
    pr_url: 'https://github.com/user/repo/pull/42',
    pr_number: 42,
    status: 'merged',
    summary: 'Added JWT auth with refresh tokens',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date().toISOString(),
  },
  {
    name: 'swift-eagle',
    task: 'Fix database connection pooling',
    branch: 'work/swift-eagle',
    pr_url: 'https://github.com/user/repo/pull/41',
    pr_number: 41,
    status: 'open',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    name: 'brave-lion',
    task: 'Update dependencies',
    branch: 'work/brave-lion',
    status: 'failed',
    failure_reason: 'Build failed due to type errors',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const statusColors: Record<TaskStatus, string> = {
  open: 'text-blue-400 bg-blue-400/10',
  merged: 'text-green-400 bg-green-400/10',
  closed: 'text-gray-400 bg-gray-400/10',
  'no-pr': 'text-yellow-400 bg-yellow-400/10',
  failed: 'text-red-400 bg-red-400/10',
  unknown: 'text-gray-400 bg-gray-400/10',
};

export function TaskHistory() {
  // TODO: Use StateReader from @multiclaude/core
  const tasks = placeholderTasks;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No task history</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-3 font-medium">Worker</th>
            <th className="pb-3 font-medium">Task</th>
            <th className="pb-3 font-medium">PR</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, idx) => (
            <tr key={`${task.name}-${idx}`} className="border-b border-gray-800/50">
              <td className="py-3 font-medium">{task.name}</td>
              <td className="py-3 text-gray-300 max-w-md truncate">{task.task}</td>
              <td className="py-3">
                {task.pr_url ? (
                  <a
                    href={task.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-mc-primary hover:underline"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    #{task.pr_number}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
