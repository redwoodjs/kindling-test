import { describe, it, expect } from 'vitest';
import { greeting } from './greeting';

describe('greeting function', () => {
  it('returns the string "hello world"', () => {
    const result = greeting();
    expect(result).toBe('hello world');
  });

  it('returns "hello world" on every invocation', () => {
    expect(greeting()).toBe('hello world');
    expect(greeting()).toBe('hello world');
    expect(greeting()).toBe('hello world');
  });

  it('returns a string with exact case sensitivity', () => {
    const result = greeting();
    expect(result).toBe('hello world');
    expect(result).not.toBe('Hello World');
    expect(result).not.toBe('HELLO WORLD');
  });

  it('returns a string with correct whitespace', () => {
    const result = greeting();
    expect(result).toHaveLength(11); // "hello world" is 11 characters
    expect(result).toMatch(/^hello\sworld$/); // Single space between words
  });

  it('is a function that takes no required arguments', () => {
    const greetingFunction = greeting;
    expect(typeof greetingFunction).toBe('function');
    // Function should be callable with no arguments
    expect(() => greetingFunction()).not.toThrow();
  });
});
