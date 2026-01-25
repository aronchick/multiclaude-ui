import type { TaskHistoryEntry } from '@multiclaude/core';

interface TaskHistoryProps {
  history: TaskHistoryEntry[];
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  merged: { bg: 'bg-green-500/20', text: 'text-green-400' },
  open: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  closed: { bg: 'bg-red-500/20', text: 'text-red-400' },
  'no-pr': { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
  unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskHistory({ history }: TaskHistoryProps) {
  // Sort by created_at descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold">Task History</h3>
        <p className="text-xs text-gray-400">{history.length} completed tasks</p>
      </div>

      <div className="overflow-x-auto">
        {sortedHistory.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No task history yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="px-4 py-2 font-medium">Worker</th>
                <th className="px-4 py-2 font-medium">Task</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">PR</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedHistory.map((entry) => {
                const defaultStyle = { bg: 'bg-gray-500/20', text: 'text-gray-400' };
                const style = statusStyles[entry.status] ?? defaultStyle;

                return (
                  <tr key={`${entry.name}-${entry.created_at}`} className="hover:bg-gray-750">
                    <td className="px-4 py-3 font-medium text-primary-400">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-md">
                      <div className="truncate">{entry.task}</div>
                      {entry.summary && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {entry.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${style.bg} ${style.text}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.pr_url ? (
                        <a
                          href={entry.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300"
                        >
                          #{entry.pr_number}
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
