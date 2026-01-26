/**
 * Tests for Zod schemas and parsing utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  AgentTypeSchema,
  TrackModeSchema,
  TaskStatusSchema,
  MergeQueueConfigSchema,
  AgentSchema,
  RepositorySchema,
  StateSchema,
  parseState,
  safeParseState,
  parseAgent,
} from '../schemas';

describe('AgentTypeSchema', () => {
  it('accepts valid agent types', () => {
    expect(AgentTypeSchema.parse('supervisor')).toBe('supervisor');
    expect(AgentTypeSchema.parse('worker')).toBe('worker');
    expect(AgentTypeSchema.parse('merge-queue')).toBe('merge-queue');
    expect(AgentTypeSchema.parse('pr-shepherd')).toBe('pr-shepherd');
    expect(AgentTypeSchema.parse('workspace')).toBe('workspace');
    expect(AgentTypeSchema.parse('review')).toBe('review');
    expect(AgentTypeSchema.parse('generic-persistent')).toBe('generic-persistent');
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
    expect(() => TrackModeSchema.parse('invalid')).toThrow();
  });
});

describe('TaskStatusSchema', () => {
  it('accepts valid task statuses', () => {
    expect(TaskStatusSchema.parse('open')).toBe('open');
    expect(TaskStatusSchema.parse('merged')).toBe('merged');
    expect(TaskStatusSchema.parse('closed')).toBe('closed');
    expect(TaskStatusSchema.parse('no-pr')).toBe('no-pr');
    expect(TaskStatusSchema.parse('failed')).toBe('failed');
    expect(TaskStatusSchema.parse('unknown')).toBe('unknown');
  });
});

describe('MergeQueueConfigSchema', () => {
  it('parses valid config', () => {
    const config = MergeQueueConfigSchema.parse({
      enabled: true,
      track_mode: 'all',
    });
    expect(config.enabled).toBe(true);
    expect(config.track_mode).toBe('all');
  });

  it('rejects config with missing fields', () => {
    expect(() => MergeQueueConfigSchema.parse({ enabled: true })).toThrow();
    expect(() => MergeQueueConfigSchema.parse({ track_mode: 'all' })).toThrow();
  });
});

describe('AgentSchema', () => {
  const validAgent = {
    type: 'worker',
    worktree_path: '/path/to/worktree',
    tmux_window: 'multiclaude-ui:worker-1',
    session_id: 'session-123',
    pid: 12345,
    created_at: '2026-01-25T12:00:00Z',
  };

  it('parses valid agent', () => {
    const agent = parseAgent(validAgent);
    expect(agent.type).toBe('worker');
    expect(agent.pid).toBe(12345);
  });

  it('parses agent with optional fields', () => {
    const agent = AgentSchema.parse({
      ...validAgent,
      task: 'Fix the bug',
      summary: 'Bug fixed',
      ready_for_cleanup: true,
    });
    expect(agent.task).toBe('Fix the bug');
    expect(agent.ready_for_cleanup).toBe(true);
  });

  it('rejects agent with invalid type', () => {
    expect(() => AgentSchema.parse({ ...validAgent, type: 'invalid' })).toThrow();
  });
});

describe('RepositorySchema', () => {
  const validRepo = {
    github_url: 'https://github.com/owner/repo',
    tmux_session: 'multiclaude-repo',
    agents: {},
  };

  it('parses valid repository', () => {
    const repo = RepositorySchema.parse(validRepo);
    expect(repo.github_url).toBe('https://github.com/owner/repo');
    expect(repo.agents).toEqual({});
  });

  it('parses repository with agents', () => {
    const repo = RepositorySchema.parse({
      ...validRepo,
      agents: {
        'worker-1': {
          type: 'worker',
          worktree_path: '/path',
          tmux_window: 'win',
          session_id: 'sess',
          pid: 123,
          created_at: '2026-01-25T12:00:00Z',
        },
      },
    });
    expect(Object.keys(repo.agents)).toHaveLength(1);
    expect(repo.agents['worker-1']?.type).toBe('worker');
  });
});

describe('StateSchema', () => {
  it('parses valid state', () => {
    const state = parseState({ repos: {} });
    expect(state.repos).toEqual({});
  });

  it('parses state with current_repo', () => {
    const state = StateSchema.parse({
      repos: {},
      current_repo: 'my-repo',
    });
    expect(state.current_repo).toBe('my-repo');
  });
});

describe('safeParseState', () => {
  it('returns parsed state for valid input', () => {
    const state = safeParseState({ repos: {} });
    expect(state).not.toBeNull();
    expect(state?.repos).toEqual({});
  });

  it('returns null for invalid input', () => {
    expect(safeParseState(null)).toBeNull();
    expect(safeParseState(undefined)).toBeNull();
    expect(safeParseState({ invalid: true })).toBeNull();
    expect(safeParseState('string')).toBeNull();
  });
});
