import type { TaskHistoryEntry } from '@multiclaude/core';

interface TaskHistoryProps {
  history: TaskHistoryEntry[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  merged: { bg: 'bg-green-500/20', text: 'text-green-400' },
  open: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  closed: { bg: 'bg-red-500/20', text: 'text-red-400' },
  'no-pr': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
  unknown: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function TaskHistory({ history }: TaskHistoryProps) {
  // Sort by created_at, most recent first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold">Task History</h2>
        <p className="text-sm text-slate-400">
          {history.filter((t) => t.status === 'merged').length} merged /{' '}
          {history.length} total
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {sortedHistory.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400">
            No task history
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {sortedHistory.map((entry) => {
              const statusStyle = STATUS_STYLES[entry.status] ?? STATUS_STYLES['unknown'] ?? { bg: 'bg-slate-500/20', text: 'text-slate-400' };

              return (
                <div key={`${entry.name}-${entry.created_at}`} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{entry.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {entry.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-300 truncate">
                        {entry.task}
                      </p>

                      {entry.summary && (
                        <p className="mt-1 text-xs text-slate-400 truncate">
                          {entry.summary}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(entry.created_at)}</span>
                        {entry.pr_url && (
                          <a
                            href={entry.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                          >
                            PR #{entry.pr_number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
