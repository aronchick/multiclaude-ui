import { describe, it, expect } from 'vitest';
import {
  StateSchema,
  AgentSchema,
  RepositorySchema,
  parseState,
  safeParseState,
} from './index.js';

describe('@multiclaude/core exports', () => {
  it('exports Zod schemas', () => {
    expect(StateSchema).toBeDefined();
    expect(AgentSchema).toBeDefined();
    expect(RepositorySchema).toBeDefined();
  });

  it('exports parse functions', () => {
    expect(parseState).toBeTypeOf('function');
    expect(safeParseState).toBeTypeOf('function');
  });

  it('safeParseState returns null for invalid input', () => {
    const result = safeParseState({ invalid: 'data' });
    expect(result).toBeNull();
  });

  it('safeParseState parses valid minimal state', () => {
    const validState = {
      repos: {},
    };
    const result = safeParseState(validState);
    expect(result).not.toBeNull();
    expect(result).toEqual({ repos: {} });
  });
});
