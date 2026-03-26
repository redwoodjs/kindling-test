import { strict as assert } from 'assert';
import { greet } from './greeting';

describe('greet()', () => {
  it('exports greet function', () => {
    assert(typeof greet === 'function', 'greet should be a function');
  });

  it('returns exactly "hello world"', () => {
    const result = greet();
    assert.strictEqual(result, 'hello world', 'greet() should return exactly "hello world"');
  });

  it('returns a string type', () => {
    const result = greet();
    assert.strictEqual(typeof result, 'string', 'return value should be of type string');
  });

  it('returns consistent results on multiple calls', () => {
    const result1 = greet();
    const result2 = greet();
    const result3 = greet();
    assert.strictEqual(result1, result2, 'first call should equal second call');
    assert.strictEqual(result2, result3, 'second call should equal third call');
    assert.strictEqual(result1, 'hello world', 'all calls should return "hello world"');
  });

  it('accepts no arguments', () => {
    // Function should be callable with no arguments (constructor.length tells us parameter count)
    assert.strictEqual(greet.length, 0, 'greet function should accept zero arguments');
  });
});
