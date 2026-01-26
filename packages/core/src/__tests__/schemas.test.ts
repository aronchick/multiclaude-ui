import { describe, it, expect } from 'vitest';
import {
  AgentTypeSchema,
  TrackModeSchema,
  TaskStatusSchema,
  MergeQueueConfigSchema,
  PRShepherdConfigSchema,
  ForkConfigSchema,
  TaskHistoryEntrySchema,
  AgentSchema,
  RepositorySchema,
  StateSchema,
  SocketResponseSchema,
  DaemonStatusSchema,
  parseState,
  safeParseState,
  parseRepository,
  parseAgent,
  parseSocketResponse,
  parseDaemonStatus,
  type AgentType,
  type TaskStatus,
} from '../schemas';

describe('AgentTypeSchema', () => {
  it('accepts valid agent types', () => {
    const validTypes: AgentType[] = [
      'supervisor',
      'worker',
      'merge-queue',
      'pr-shepherd',
      'workspace',
      'review',
      'generic-persistent',
    ];
    for (const type of validTypes) {
      expect(AgentTypeSchema.parse(type)).toBe(type);
    }
  });

  it('rejects invalid agent types', () => {
    expect(() => AgentTypeSchema.parse('invalid')).toThrow();
    expect(() => AgentTypeSchema.parse('')).toThrow();
    expect(() => AgentTypeSchema.parse(123)).toThrow();
  });
});

describe('TrackModeSchema', () => {
  it('accepts valid track modes', () => {
    expect(TrackModeSchema.parse('all')).toBe('all');
    expect(TrackModeSchema.parse('author')).toBe('author');
    expect(TrackModeSchema.parse('assigned')).toBe('assigned');
  });

  it('rejects invalid track modes', () => {
    expect(() => TrackModeSchema.parse('none')).toThrow();
    expect(() => TrackModeSchema.parse('')).toThrow();
  });
});

describe('TaskStatusSchema', () => {
  it('accepts valid task statuses', () => {
    const validStatuses: TaskStatus[] = ['open', 'merged', 'closed', 'no-pr', 'failed', 'unknown'];
    for (const status of validStatuses) {
      expect(TaskStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects invalid task statuses', () => {
    expect(() => TaskStatusSchema.parse('pending')).toThrow();
  });
});

describe('MergeQueueConfigSchema', () => {
  it('parses valid config', () => {
    const config = { enabled: true, track_mode: 'all' as const };
    expect(MergeQueueConfigSchema.parse(config)).toEqual(config);
  });

  it('rejects missing fields', () => {
    expect(() => MergeQueueConfigSchema.parse({ enabled: true })).toThrow();
    expect(() => MergeQueueConfigSchema.parse({ track_mode: 'all' })).toThrow();
  });
});

describe('PRShepherdConfigSchema', () => {
  it('parses valid config', () => {
    const config = { enabled: false, track_mode: 'author' as const };
    expect(PRShepherdConfigSchema.parse(config)).toEqual(config);
  });
});

describe('ForkConfigSchema', () => {
  it('parses minimal fork config', () => {
    const config = { is_fork: false };
    expect(ForkConfigSchema.parse(config)).toEqual(config);
  });

  it('parses full fork config', () => {
    const config = {
      is_fork: true,
      upstream_url: 'https://github.com/upstream/repo',
      upstream_owner: 'upstream',
      upstream_repo: 'repo',
      force_fork_mode: true,
    };
    expect(ForkConfigSchema.parse(config)).toEqual(config);
  });
});

describe('TaskHistoryEntrySchema', () => {
  it('parses minimal entry', () => {
    const entry = {
      name: 'worker-1',
      task: 'Fix bug',
      branch: 'fix/bug',
      status: 'open' as const,
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(TaskHistoryEntrySchema.parse(entry)).toEqual(entry);
  });

  it('parses full entry with optional fields', () => {
    const entry = {
      name: 'worker-1',
      task: 'Fix bug',
      branch: 'fix/bug',
      pr_url: 'https://github.com/owner/repo/pull/1',
      pr_number: 1,
      status: 'merged' as const,
      summary: 'Fixed the bug',
      failure_reason: undefined,
      created_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-02T00:00:00Z',
    };
    const parsed = TaskHistoryEntrySchema.parse(entry);
    expect(parsed.pr_number).toBe(1);
    expect(parsed.summary).toBe('Fixed the bug');
  });
});

describe('AgentSchema', () => {
  const validAgent = {
    type: 'worker' as const,
    worktree_path: '/path/to/worktree',
    tmux_window: 'mc-repo:worker-1',
    session_id: 'session-123',
    pid: 12345,
    created_at: '2024-01-01T00:00:00Z',
  };

  it('parses valid agent', () => {
    const agent = parseAgent(validAgent);
    expect(agent.type).toBe('worker');
    expect(agent.pid).toBe(12345);
  });

  it('parses agent with optional fields', () => {
    const agent = parseAgent({
      ...validAgent,
      task: 'Build feature X',
      summary: 'Completed successfully',
      ready_for_cleanup: true,
    });
    expect(agent.task).toBe('Build feature X');
    expect(agent.summary).toBe('Completed successfully');
    expect(agent.ready_for_cleanup).toBe(true);
  });

  it('rejects invalid agent type', () => {
    expect(() => parseAgent({ ...validAgent, type: 'invalid-type' })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => AgentSchema.parse({ type: 'worker' })).toThrow();
  });
});

describe('RepositorySchema', () => {
  it('parses minimal repository', () => {
    const repo = {
      github_url: 'https://github.com/owner/repo',
      tmux_session: 'repo-session',
      agents: {},
    };
    expect(RepositorySchema.parse(repo)).toEqual(repo);
  });

  it('parses repository with agents', () => {
    const repo = {
      github_url: 'https://github.com/owner/repo',
      tmux_session: 'repo-session',
      agents: {
        'worker-1': {
          type: 'worker' as const,
          worktree_path: '/path',
          tmux_window: 'window',
          session_id: 'session',
          pid: 123,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    };
    const parsed = parseRepository(repo);
    expect(parsed.agents['worker-1'].type).toBe('worker');
  });
});

describe('StateSchema', () => {
  it('parses empty state', () => {
    const state = parseState({ repos: {} });
    expect(state.repos).toEqual({});
  });

  it('parses state with current_repo', () => {
    const state = parseState({ repos: {}, current_repo: 'test-repo' });
    expect(state.current_repo).toBe('test-repo');
  });

  it('parses state with repos', () => {
    const state = parseState({
      repos: {
        'my-repo': {
          github_url: 'https://github.com/owner/repo',
          tmux_session: 'repo-session',
          agents: {},
        },
      },
      current_repo: 'my-repo',
    });
    expect(state.repos['my-repo'].github_url).toBe('https://github.com/owner/repo');
  });
});

describe('SocketResponseSchema', () => {
  it('parses success response', () => {
    const response = { success: true, data: { key: 'value' } };
    expect(SocketResponseSchema.parse(response)).toEqual(response);
  });

  it('parses error response', () => {
    const response = { success: false, error: 'Something went wrong' };
    expect(parseSocketResponse(response)).toEqual(response);
  });
});

describe('DaemonStatusSchema', () => {
  it('parses valid status', () => {
    const status = {
      running: true,
      pid: 12345,
      repos: 2,
      agents: 5,
      socket_path: '/tmp/multiclaude.sock',
    };
    expect(parseDaemonStatus(status)).toEqual(status);
  });
});

describe('parseState', () => {
  it('throws on invalid data', () => {
    expect(() => parseState(null)).toThrow();
    expect(() => parseState({ repos: 'invalid' })).toThrow();
    expect(() => parseState(undefined)).toThrow();
  });
});

describe('safeParseState', () => {
  it('returns parsed data on valid input', () => {
    const state = { repos: {} };
    expect(safeParseState(state)).toEqual(state);
  });

  it('returns null on invalid input', () => {
    expect(safeParseState(null)).toBeNull();
    expect(safeParseState({ repos: 'invalid' })).toBeNull();
    expect(safeParseState({ invalid: 'data' })).toBeNull();
  });
});
