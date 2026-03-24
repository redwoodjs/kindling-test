import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('Scenario: Code outputs "Hello World" to stdout and exits successfully', async (t) => {
  await t.test('stdout contains "Hello World"', (t, done) => {
    const proc = spawn('node', ['hello-world.js'], {
      cwd: __dirname,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      assert.strictEqual(code, 0, 'process exits with code 0');
      assert.match(stdout, /Hello World/, 'stdout contains "Hello World"');
      done();
    });
  });
});

test('Scenario: Output is exactly "Hello World" with no extraneous text', async (t) => {
  await t.test('stdout is exactly "Hello World" plus line ending', (t, done) => {
    const proc = spawn('node', ['hello-world.js'], {
      cwd: __dirname,
    });

    let stdout = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('close', (code) => {
      // Normalize: verify output is "Hello World" followed only by newline
      const expected = 'Hello World\n';
      assert.strictEqual(stdout, expected, `stdout is exactly "${expected.trim()}" with line ending`);
      assert.strictEqual(code, 0, 'process exits with code 0');
      done();
    });
  });
});
