import { describe, it, expect } from 'vitest';
import {
  AgentTypeSchema,
  TrackModeSchema,
  TaskStatusSchema,
  StateSchema,
  AgentSchema,
  RepositorySchema,
  parseState,
  safeParseState,
  type AgentType,
  type TaskStatus,
  type Agent,
  type Repository,
  type State,
} from './schemas';

describe('AgentTypeSchema', () => {
  it('should accept valid agent types', () => {
    const validTypes: AgentType[] = ['supervisor', 'worker', 'merge-queue', 'pr-shepherd', 'workspace', 'review', 'generic-persistent'];
    for (const type of validTypes) {
      expect(AgentTypeSchema.parse(type)).toBe(type);
    }
  });

  it('should reject invalid agent types', () => {
    expect(() => AgentTypeSchema.parse('invalid')).toThrow();
  });
});

describe('TrackModeSchema', () => {
  it('should accept valid track modes', () => {
    expect(TrackModeSchema.parse('all')).toBe('all');
    expect(TrackModeSchema.parse('author')).toBe('author');
    expect(TrackModeSchema.parse('assigned')).toBe('assigned');
  });
});

describe('TaskStatusSchema', () => {
  it('should accept valid task statuses', () => {
    const validStatuses: TaskStatus[] = ['open', 'merged', 'closed', 'no-pr', 'failed', 'unknown'];
    for (const status of validStatuses) {
      expect(TaskStatusSchema.parse(status)).toBe(status);
    }
  });
});

describe('AgentSchema', () => {
  it('should parse a valid agent', () => {
    const agent: Agent = {
      type: 'worker',
      worktree_path: '/path/to/worktree',
      tmux_window: 'window-1',
      session_id: 'session-123',
      pid: 12345,
      created_at: '2026-01-25T00:00:00Z',
    };
    expect(AgentSchema.parse(agent)).toEqual(agent);
  });

  it('should accept optional fields', () => {
    const agent: Agent = {
      type: 'worker',
      worktree_path: '/path/to/worktree',
      tmux_window: 'window-1',
      session_id: 'session-123',
      pid: 12345,
      task: 'Fix a bug',
      summary: 'Fixed the bug',
      created_at: '2026-01-25T00:00:00Z',
      ready_for_cleanup: true,
    };
    const parsed = AgentSchema.parse(agent);
    expect(parsed.task).toBe('Fix a bug');
    expect(parsed.ready_for_cleanup).toBe(true);
  });
});

describe('RepositorySchema', () => {
  it('should parse a minimal repository', () => {
    const repo: Repository = {
      github_url: 'https://github.com/owner/repo',
      tmux_session: 'repo-session',
      agents: {},
    };
    expect(RepositorySchema.parse(repo)).toEqual(repo);
  });
});

describe('StateSchema', () => {
  it('should parse an empty state', () => {
    const state: State = { repos: {} };
    expect(StateSchema.parse(state)).toEqual(state);
  });

  it('should parse a state with repos', () => {
    const state: State = {
      repos: {
        'my-repo': {
          github_url: 'https://github.com/owner/repo',
          tmux_session: 'repo-session',
          agents: {},
        },
      },
      current_repo: 'my-repo',
    };
    expect(StateSchema.parse(state)).toEqual(state);
  });
});

describe('parseState', () => {
  it('should throw on invalid data', () => {
    expect(() => parseState(null)).toThrow();
    expect(() => parseState({ repos: 'invalid' })).toThrow();
  });
});

describe('safeParseState', () => {
  it('should return parsed data on valid input', () => {
    const state: State = { repos: {} };
    expect(safeParseState(state)).toEqual(state);
  });

  it('should return null on invalid input', () => {
    expect(safeParseState(null)).toBeNull();
    expect(safeParseState({ repos: 'invalid' })).toBeNull();
  });
});
