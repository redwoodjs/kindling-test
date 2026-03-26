import { describe, it, expect } from 'vitest';
import { greet } from './greeting';

describe('greet', () => {
  it('returns the exact string "hello world"', () => {
    const result = greet();
    expect(result).toBe('hello world');
  });

  it('returns a string type', () => {
    const result = greet();
    expect(typeof result).toBe('string');
  });

  it('returns the same value on multiple calls', () => {
    const result1 = greet();
    const result2 = greet();
    expect(result1).toEqual(result2);
    expect(result1).toBe('hello world');
    expect(result2).toBe('hello world');
  });

  it('does not throw an error when called', () => {
    expect(() => greet()).not.toThrow();
  });
});
