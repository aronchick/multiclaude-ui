import type { TaskHistoryEntry, TaskStatus } from '@multiclaude/core';

/**
 * Placeholder task history data for development
 */
const mockHistory: TaskHistoryEntry[] = [
  {
    name: 'brave-lion',
    task: 'Fix login bug causing session timeout',
    branch: 'multiclaude/brave-lion',
    pr_url: 'https://github.com/user/my-app/pull/41',
    pr_number: 41,
    status: 'merged',
    summary: 'Fixed race condition in session validation',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 82800000).toISOString(),
  },
  {
    name: 'swift-eagle',
    task: 'Add unit tests for payment module',
    branch: 'multiclaude/swift-eagle',
    pr_url: 'https://github.com/user/my-app/pull/40',
    pr_number: 40,
    status: 'merged',
    summary: 'Added 45 unit tests, coverage now at 85%',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    completed_at: new Date(Date.now() - 169200000).toISOString(),
  },
  {
    name: 'keen-wolf',
    task: 'Implement dark mode toggle',
    branch: 'multiclaude/keen-wolf',
    pr_url: 'https://github.com/user/my-app/pull/39',
    pr_number: 39,
    status: 'open',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    name: 'quick-owl',
    task: 'Refactor database queries for performance',
    branch: 'multiclaude/quick-owl',
    status: 'failed',
    failure_reason: 'CI tests failed due to missing migrations',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    completed_at: new Date(Date.now() - 255600000).toISOString(),
  },
];

export default function TaskHistory() {
  const statusCounts = mockHistory.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<TaskStatus, number>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Merged" count={statusCounts.merged || 0} color="text-mc-secondary" />
        <StatCard label="Open" count={statusCounts.open || 0} color="text-mc-primary" />
        <StatCard label="Closed" count={statusCounts.closed || 0} color="text-gray-400" />
        <StatCard label="Failed" count={statusCounts.failed || 0} color="text-mc-error" />
      </div>

      {/* History list */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {mockHistory.map((entry) => (
            <TaskCard key={entry.name} entry={entry} />
          ))}
        </div>
      </section>

      <p className="text-sm text-gray-500 italic">
        Note: This is placeholder data. Connect to daemon for live updates.
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  count: number;
  color: string;
}

function StatCard({ label, count, color }: StatCardProps) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${color}`}>{count}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

interface TaskCardProps {
  entry: TaskHistoryEntry;
}

function TaskCard({ entry }: TaskCardProps) {
  const statusColors: Record<TaskStatus, string> = {
    merged: 'bg-mc-secondary/20 text-mc-secondary',
    open: 'bg-mc-primary/20 text-mc-primary',
    closed: 'bg-gray-500/20 text-gray-400',
    'no-pr': 'bg-gray-500/20 text-gray-400',
    failed: 'bg-mc-error/20 text-mc-error',
    unknown: 'bg-gray-500/20 text-gray-400',
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'less than an hour ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-medium text-mc-accent">{entry.name}</span>
          <span className="mx-2 text-gray-500">•</span>
          <span className="text-sm text-gray-400">{relativeTime(entry.created_at)}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusColors[entry.status]}`}>
          {entry.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-300">{entry.task}</p>

      {entry.summary && <p className="mt-2 text-sm text-gray-400 italic">"{entry.summary}"</p>}

      {entry.failure_reason && (
        <p className="mt-2 text-sm text-mc-error">Error: {entry.failure_reason}</p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>Branch: {entry.branch}</span>
        {entry.pr_url && (
          <a
            href={entry.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mc-primary hover:underline"
          >
            PR #{entry.pr_number}
          </a>
        )}
      </div>
    </div>
  );
}
