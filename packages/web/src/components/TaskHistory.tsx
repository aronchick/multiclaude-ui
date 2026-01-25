import type { TaskHistoryEntry } from '@multiclaude/core';

interface TaskHistoryProps {
  history: TaskHistoryEntry[];
  repoName: string;
}

/**
 * TaskHistory displays completed tasks with their PR status.
 */
export function TaskHistory({ history, repoName }: TaskHistoryProps) {
  const getStatusBadge = (status: TaskHistoryEntry['status']) => {
    const styles: Record<string, string> = {
      merged: 'bg-green-100 text-green-800',
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      'no-pr': 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-500',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[status] ?? styles.unknown}`}>
        {status}
      </span>
    );
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  // Sort by completion time, most recent first
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = a.completed_at ?? a.created_at;
    const bTime = b.completed_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Task History</h3>

      {sortedHistory.length === 0 ? (
        <p className="text-gray-500">No completed tasks for {repoName}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Worker</th>
                <th className="pb-2 font-medium">Task</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">PR</th>
                <th className="pb-2 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((entry, idx) => (
                <tr key={`${entry.name}-${idx}`} className="border-b last:border-0">
                  <td className="py-2 font-medium">{entry.name}</td>
                  <td className="py-2 text-gray-600 max-w-xs truncate" title={entry.task}>
                    {entry.task}
                  </td>
                  <td className="py-2">{getStatusBadge(entry.status)}</td>
                  <td className="py-2">
                    {entry.pr_url ? (
                      <a
                        href={entry.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mc-primary-600 hover:underline"
                      >
                        #{entry.pr_number}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500">
                    {entry.completed_at ? formatDate(entry.completed_at) : 'In progress'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
