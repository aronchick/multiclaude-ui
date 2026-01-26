import { useState, useMemo } from 'react';
import type { TaskHistoryEntry, Agent } from '@multiclaude/core';
import { Modal } from './Modal';
import { SpawnWorker } from './SpawnWorker';

interface TaskDashboardProps {
  history: TaskHistoryEntry[];
  agents: Record<string, Agent>;
  repoName: string;
  onRefresh?: () => void;
}

type FilterStatus = 'all' | 'merged' | 'open' | 'failed' | 'in-progress';

/**
 * Enhanced task dashboard with stats, timeline, and spawn functionality.
 */
export function TaskDashboard({ history, agents, repoName, onRefresh }: TaskDashboardProps) {
  const [selectedTask, setSelectedTask] = useState<TaskHistoryEntry | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showTimeline, setShowTimeline] = useState(true);

  // Get active workers (in-progress tasks)
  const activeWorkers = useMemo(() => {
    return Object.entries(agents)
      .filter(([, agent]) => agent.type === 'worker' && agent.pid > 0 && !agent.ready_for_cleanup)
      .map(([name, agent]) => ({
        name,
        task: agent.task ?? 'Working...',
        created_at: agent.created_at,
        status: 'in-progress' as const,
      }));
  }, [agents]);

  // Combine history with active workers for unified view
  const allTasks = useMemo(() => {
    const historyTasks = history.map((h) => ({
      ...h,
      isActive: false,
      duration: h.completed_at
        ? Math.round((new Date(h.completed_at).getTime() - new Date(h.created_at).getTime()) / 60000)
        : null,
    }));

    const activeTasks = activeWorkers.map((w) => ({
      name: w.name,
      task: w.task,
      branch: `work/${w.name}`,
      status: 'in-progress' as TaskHistoryEntry['status'],
      created_at: w.created_at,
      completed_at: undefined,
      isActive: true,
      duration: Math.round((Date.now() - new Date(w.created_at).getTime()) / 60000),
    }));

    return [...activeTasks, ...historyTasks].sort((a, b) => {
      const aTime = a.completed_at ?? a.created_at;
      const bTime = b.completed_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });
  }, [history, activeWorkers]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = history.filter((h) => h.status === 'merged' || h.status === 'closed');
    const merged = history.filter((h) => h.status === 'merged');
    const failed = history.filter((h) => h.status === 'failed');

    const durations = history
      .filter((h) => h.completed_at)
      .map((h) => new Date(h.completed_at!).getTime() - new Date(h.created_at).getTime());

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000)
      : 0;

    return {
      total: history.length,
      active: activeWorkers.length,
      merged: merged.length,
      failed: failed.length,
      successRate: completed.length > 0 ? Math.round((merged.length / completed.length) * 100) : 0,
      avgDuration,
    };
  }, [history, activeWorkers]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return allTasks;
    if (filter === 'in-progress') return allTasks.filter((t) => t.isActive);
    return allTasks.filter((t) => t.status === filter);
  }, [allTasks, filter]);

  const getStatusColor = (status: string, isActive?: boolean) => {
    if (isActive) return 'bg-blue-500 animate-pulse';
    switch (status) {
      case 'merged': return 'bg-green-500';
      case 'open': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string, isActive?: boolean) => {
    if (isActive) return 'bg-blue-100 text-blue-800';
    switch (status) {
      case 'merged': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          <div className="text-xs text-gray-500">Active Workers</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.merged}</div>
          <div className="text-xs text-gray-500">Merged</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.successRate}%</div>
          <div className="text-xs text-gray-500">Success Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">{formatDuration(stats.avgDuration)}</div>
          <div className="text-xs text-gray-500">Avg Duration</div>
        </div>
      </div>

      {/* Spawn Worker */}
      <SpawnWorker repoName={repoName} onSpawned={onRefresh} />

      {/* Task List Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Task Activity</h3>
            {/* Filter buttons */}
            <div className="flex gap-1">
              {(['all', 'in-progress', 'merged', 'failed'] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === f
                      ? 'bg-mc-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'in-progress' ? 'Active' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showTimeline ? 'List View' : 'Timeline View'}
          </button>
        </div>

        {/* Task List */}
        <div className="divide-y">
          {filteredTasks.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No tasks match this filter</p>
          ) : (
            filteredTasks.slice(0, 20).map((task, idx) => (
              <div
                key={`${task.name}-${idx}`}
                onClick={() => !task.isActive && setSelectedTask(task as TaskHistoryEntry)}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  task.isActive ? '' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  {showTimeline && (
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status, task.isActive)}`} />
                      {idx < filteredTasks.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{task.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(task.status, task.isActive)}`}>
                        {task.isActive ? 'working' : task.status}
                      </span>
                      {task.isActive && (
                        <span className="text-xs text-blue-600 animate-pulse">● live</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.task}</p>

                    {/* Summary preview for completed tasks */}
                    {!task.isActive && (task as TaskHistoryEntry).summary && (
                      <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded mb-2 line-clamp-1">
                        ✓ {(task as TaskHistoryEntry).summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{formatTime(task.created_at)}</span>
                      <span>Duration: {formatDuration(task.duration)}</span>
                      {(task as TaskHistoryEntry).pr_url && (
                        <a
                          href={(task as TaskHistoryEntry).pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-mc-primary-600 hover:underline"
                        >
                          PR #{(task as TaskHistoryEntry).pr_number}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredTasks.length > 20 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Showing 20 of {filteredTasks.length} tasks
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Task: ${selectedTask?.name ?? ''}`}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(selectedTask.status)}`}>
                {selectedTask.status}
              </span>
              {selectedTask.pr_url && (
                <a
                  href={selectedTask.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-mc-primary-600 hover:underline"
                >
                  View PR #{selectedTask.pr_number} →
                </a>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Task</h4>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedTask.task}</p>
            </div>

            {selectedTask.summary && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Summary</h4>
                <p className="text-green-700 whitespace-pre-wrap bg-green-50 p-3 rounded">{selectedTask.summary}</p>
              </div>
            )}

            {selectedTask.failure_reason && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Failure Reason</h4>
                <p className="text-red-600 whitespace-pre-wrap bg-red-50 p-3 rounded">{selectedTask.failure_reason}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Branch:</span>{' '}
                <code className="bg-gray-100 px-1 rounded">{selectedTask.branch}</code>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                {selectedTask.completed_at
                  ? formatDuration(
                      Math.round(
                        (new Date(selectedTask.completed_at).getTime() -
                          new Date(selectedTask.created_at).getTime()) /
                          60000
                      )
                    )
                  : '—'}
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                {new Date(selectedTask.created_at).toLocaleString()}
              </div>
              <div>
                <span className="text-gray-500">Completed:</span>{' '}
                {selectedTask.completed_at
                  ? new Date(selectedTask.completed_at).toLocaleString()
                  : '—'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
