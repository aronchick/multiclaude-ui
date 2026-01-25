import type { State, TaskHistoryEntry, TaskStatus } from '@multiclaude/core';

interface TaskHistoryProps {
  state: State;
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'merged':
      return 'bg-green-900 text-green-200';
    case 'open':
      return 'bg-blue-900 text-blue-200';
    case 'closed':
      return 'bg-gray-700 text-gray-300';
    case 'failed':
      return 'bg-red-900 text-red-200';
    case 'no-pr':
      return 'bg-yellow-900 text-yellow-200';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}

function TaskRow({ task }: { task: TaskHistoryEntry }): JSX.Element {
  return (
    <tr className="border-b border-gray-700">
      <td className="px-4 py-3">
        <span className="font-medium">{task.name}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{task.task}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        {task.pr_url ? (
          <a
            href={task.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            #{task.pr_number}
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}
      </td>
    </tr>
  );
}

export default function TaskHistory({ state }: TaskHistoryProps): JSX.Element {
  const currentRepo = state.current_repo;
  const repo = currentRepo ? state.repos[currentRepo] : undefined;
  const tasks = repo?.task_history ?? [];

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-gray-400">
        No completed tasks
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Worker</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">PR</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Completed</th>
          </tr>
        </thead>
        <tbody className="bg-gray-900">
          {tasks.map((task, index) => (
            <TaskRow key={`${task.name}-${index}`} task={task} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
