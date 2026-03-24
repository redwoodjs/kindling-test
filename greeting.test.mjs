import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:3000';

test('GET /greeting returns 200 status', async (t) => {
  const response = await fetch(`${BASE_URL}/greeting`);
  assert.strictEqual(response.status, 200, 'Expected status code 200');
});

test('GET /greeting returns JSON response with correct shape', async (t) => {
  const response = await fetch(`${BASE_URL}/greeting`);
  const data = await response.json();
  assert.deepStrictEqual(data, { message: 'hello world' }, 'Expected response body { message: "hello world" }');
});

test('GET /greeting has correct Content-Type header', async (t) => {
  const response = await fetch(`${BASE_URL}/greeting`);
  const contentType = response.headers.get('content-type');
  assert.match(contentType, /application\/json/, 'Expected Content-Type to be application/json');
});

test('GET /greeting returns valid JSON', async (t) => {
  const response = await fetch(`${BASE_URL}/greeting`);
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    assert.fail('Response body is not valid JSON');
  }
  assert.strictEqual(typeof parsed, 'object', 'Parsed response should be an object');
});

test('GET /greeting response message field is a string', async (t) => {
  const response = await fetch(`${BASE_URL}/greeting`);
  const data = await response.json();
  assert.strictEqual(typeof data.message, 'string', 'Expected message field to be a string');
  assert.strictEqual(data.message, 'hello world', 'Expected message field to be "hello world"');
});
