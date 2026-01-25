import { describe, it, expect } from 'vitest';
import {
  parseState,
  safeParseState,
  parseAgent,
  StateSchema,
  AgentSchema,
} from '../schemas';

describe('schemas', () => {
  describe('StateSchema', () => {
    it('parses valid empty state', () => {
      const state = parseState({ repos: {} });
      expect(state.repos).toEqual({});
    });

    it('parses state with current_repo', () => {
      const state = parseState({ repos: {}, current_repo: 'test-repo' });
      expect(state.current_repo).toBe('test-repo');
    });

    it('returns null for invalid state with safeParseState', () => {
      const result = safeParseState({ invalid: 'data' });
      expect(result).toBeNull();
    });
  });

  describe('AgentSchema', () => {
    const validAgent = {
      type: 'worker',
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
      });
      expect(agent.task).toBe('Build feature X');
      expect(agent.summary).toBe('Completed successfully');
    });

    it('rejects invalid agent type', () => {
      expect(() =>
        parseAgent({ ...validAgent, type: 'invalid-type' })
      ).toThrow();
    });
  });
});
