import type { TaskHistoryEntry, TaskStatus } from '@multiclaude/core';

/**
 * Props for TaskItem component
 */
interface TaskItemProps {
  task: TaskHistoryEntry;
  repo: string;
}

/**
 * Status badge colors
 */
const statusColors: Record<TaskStatus, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  merged: 'bg-green-500/20 text-green-400',
  closed: 'bg-gray-500/20 text-gray-400',
  'no-pr': 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  unknown: 'bg-gray-500/20 text-gray-400',
};

/**
 * Display a single task history entry
 */
function TaskItem({ task, repo }: TaskItemProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{task.name}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${statusColors[task.status]}`}
            >
              {task.status}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-400">{task.task}</p>
        </div>
      </div>

      {task.summary !== undefined && task.summary !== '' && (
        <p className="mt-2 text-xs text-gray-500">{task.summary}</p>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{repo}</span>
        {task.pr_url !== undefined && task.pr_url !== '' && (
          <a
            href={task.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mc-primary-400 hover:underline"
          >
            PR #{task.pr_number}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Task history showing completed work across repositories.
 *
 * Placeholder implementation - integrate with StateReader:
 * ```typescript
 * const [tasks, setTasks] = useState<TaskHistoryEntry[]>([]);
 * const reader = useMemo(() => new StateReader(), []);
 *
 * useEffect(() => {
 *   reader.on('change', () => {
 *     setTasks(reader.getRecentTasks(10));
 *   });
 *   reader.watch();
 *   return () => reader.close();
 * }, [reader]);
 * ```
 */
export function TaskHistory() {
  // TODO: Replace with real data from StateReader
  const mockTasks: Array<TaskHistoryEntry & { repo: string }> = [
    {
      repo: 'my-app',
      name: 'brave-lion',
      task: 'Fix login session timeout bug',
      branch: 'multiclaude/brave-lion',
      status: 'merged',
      pr_url: 'https://github.com/user/my-app/pull/42',
      pr_number: 42,
      summary: 'Fixed race condition in session validation',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date().toISOString(),
    },
    {
      repo: 'my-app',
      name: 'swift-eagle',
      task: 'Add dark mode support',
      branch: 'multiclaude/swift-eagle',
      status: 'open',
      pr_url: 'https://github.com/user/my-app/pull/43',
      pr_number: 43,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Recent Tasks</h2>
      <div className="space-y-3">
        {mockTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No completed tasks</p>
        ) : (
          mockTasks.map((task) => (
            <TaskItem key={`${task.repo}-${task.name}`} task={task} repo={task.repo} />
          ))
        )}
      </div>
    </div>
  );
}
