import { useState } from 'react';
import { useDaemon } from '../hooks/useDaemon';

interface SpawnWorkerProps {
  repoName: string;
  onSpawned?: () => void;
}

/**
 * Form to spawn a new worker with a task description.
 */
export function SpawnWorker({ repoName, onSpawned }: SpawnWorkerProps) {
  const { spawnWorker, loading } = useDaemon();
  const [task, setTask] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentTasks] = useState<string[]>([
    'Fix the failing CI tests',
    'Add unit tests for the new feature',
    'Refactor to improve code quality',
    'Update documentation',
    'Review and address PR feedback',
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    try {
      await spawnWorker(repoName, task.trim());
      setTask('');
      setIsExpanded(false);
      onSpawned?.();
    } catch (err) {
      alert(`Failed to spawn worker: ${err}`);
    }
  };

  const handleQuickTask = (quickTask: string) => {
    setTask(quickTask);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg
                   text-gray-500 hover:border-mc-primary-400 hover:text-mc-primary-600
                   transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Spawn New Worker
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border-2 border-mc-primary-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Spawn New Worker</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
            Task Description
          </label>
          <textarea
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe what you want the worker to do..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                       focus:ring-mc-primary-500 focus:border-mc-primary-500 resize-none"
            autoFocus
          />
        </div>

        {/* Quick task suggestions */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Quick tasks:</p>
          <div className="flex flex-wrap gap-2">
            {recentTasks.map((quickTask, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickTask(quickTask)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded
                           hover:bg-gray-200 transition-colors"
              >
                {quickTask.length > 30 ? quickTask.slice(0, 30) + '...' : quickTask}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Worker will be spawned in <strong>{repoName}</strong>
          </p>
          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="px-4 py-2 bg-mc-primary-600 text-white rounded-lg
                       hover:bg-mc-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Spawning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Spawn Worker
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
