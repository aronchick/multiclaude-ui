import { useState } from 'react';
import type { TaskHistoryEntry } from '@multiclaude/core';
import { Modal } from './Modal';

interface TaskHistoryProps {
  history: TaskHistoryEntry[];
  repoName: string;
}

/**
 * TaskHistory displays completed tasks with their PR status.
 */
export function TaskHistory({ history, repoName }: TaskHistoryProps) {
  const [selectedTask, setSelectedTask] = useState<TaskHistoryEntry | null>(null);
  const [showAll, setShowAll] = useState(false);

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

  const truncate = (text: string, max: number) => {
    if (!text || text.length <= max) return text;
    return text.slice(0, max) + '...';
  };

  // Sort by completion time, most recent first
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = a.completed_at ?? a.created_at;
    const bTime = b.completed_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });

  const displayedHistory = showAll ? sortedHistory : sortedHistory.slice(0, 10);
  const hasMore = sortedHistory.length > 10;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Task History</h3>
        <span className="text-xs text-gray-500">{sortedHistory.length} tasks</span>
      </div>

      {sortedHistory.length === 0 ? (
        <p className="text-gray-500">No completed tasks for {repoName}</p>
      ) : (
        <>
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
                {displayedHistory.map((entry, idx) => (
                  <tr
                    key={`${entry.name}-${idx}`}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTask(entry)}
                  >
                    <td className="py-2 font-medium">{entry.name}</td>
                    <td className="py-2 text-gray-600 max-w-xs">
                      {truncate(entry.task, 50)}
                    </td>
                    <td className="py-2">{getStatusBadge(entry.status)}</td>
                    <td className="py-2">
                      {entry.pr_url ? (
                        <a
                          href={entry.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-mc-primary-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
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

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-sm text-mc-primary-600 hover:text-mc-primary-800"
            >
              {showAll ? 'Show less' : `Show all ${sortedHistory.length} tasks`}
            </button>
          )}
        </>
      )}

      {/* Task detail modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Task: ${selectedTask?.name ?? ''}`}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Task Description</h4>
              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedTask.task}</p>
            </div>

            {selectedTask.summary && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Summary</h4>
                <p className="mt-1 text-green-700 whitespace-pre-wrap">{selectedTask.summary}</p>
              </div>
            )}

            {selectedTask.failure_reason && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Failure Reason</h4>
                <p className="mt-1 text-red-600 whitespace-pre-wrap">{selectedTask.failure_reason}</p>
              </div>
            )}

            {selectedTask.pr_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Pull Request</h4>
                <a
                  href={selectedTask.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-mc-primary-600 hover:underline"
                >
                  #{selectedTask.pr_number} - {selectedTask.branch}
                </a>
              </div>
            )}

            <div className="flex gap-6 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {formatDate(selectedTask.created_at)}
              </div>
              {selectedTask.completed_at && (
                <div>
                  <span className="font-medium">Completed:</span>{' '}
                  {formatDate(selectedTask.completed_at)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
