import { describe, it, expect } from 'vitest';
import { greet } from './greeting';

describe('greet function', () => {
  it('returns the string "hello world"', () => {
    const result = greet();
    expect(result).toBe('hello world');
  });

  it('return type is string', () => {
    const result = greet();
    expect(typeof result).toBe('string');
  });

  it('returns exact string match with lowercase and single space', () => {
    const result = greet();
    expect(result).toBe('hello world');
    expect(result).not.toBe('Hello world');
    expect(result).not.toBe('hello  world');
  });

  it('function accepts no required parameters', () => {
    expect(() => greet()).not.toThrow();
    const result = greet();
    expect(result).toBe('hello world');
  });

  it('behavior is deterministic across multiple invocations', () => {
    const result1 = greet();
    const result2 = greet();
    const result3 = greet();
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe('hello world');
  });
});
