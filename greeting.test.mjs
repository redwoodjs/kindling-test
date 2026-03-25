#!/usr/bin/env node

/**
 * Integration tests for the greeting endpoint.
 * Framework-agnostic test runner using Node's built-in fetch.
 * Tests derived from black-box behavioral specs.
 *
 * Usage:
 *   npm run dev  # in one terminal
 *   node greeting.test.mjs  # in another
 *
 * Or with custom base URL:
 *   TEST_BASE_URL=http://localhost:3000 node greeting.test.mjs
 */

const baseURL = process.env.TEST_BASE_URL || "http://localhost:5173";
const greetingPath = "/greeting";

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

// Test utilities
async function test(description, fn) {
  try {
    await fn();
    console.log(`✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  ${error.message}`);
    testsFailed++;
    failures.push({ description, error });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Got: ${JSON.stringify(actual)}`);
  }
}

function assertMatch(actual, pattern, message) {
  if (!pattern.test(actual)) {
    throw new Error(`${message}\n  Expected to match: ${pattern}\n  Got: ${actual}`);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(`${message}\n  Should not be: ${JSON.stringify(expected)}`);
  }
}

function assertStatusNotSuccess(status, message) {
  if (status >= 200 && status < 300) {
    throw new Error(`${message}\n  Status ${status} is success, expected failure`);
  }
}

// Tests

console.log(`Testing greeting endpoint at ${baseURL}${greetingPath}\n`);

// Spec 1: Successful Greeting Response
console.log("Spec 1: Successful Greeting Response");
await test("GET /greeting returns status 200", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  assertEqual(res.status, 200, "Status should be 200");
});

await test("GET /greeting returns 'hello world' in response body", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

await test("GET /greeting returns content-type text/plain", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  const contentType = res.headers.get("content-type");
  assertMatch(contentType, /^text\/plain/, "Content-Type should be text/plain");
});

// Spec 2: Consistency Across Multiple Requests
console.log("\nSpec 2: Consistency Across Multiple Requests");
await test("Multiple GET requests return consistent responses", async () => {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${baseURL}${greetingPath}`);
    assertEqual(res.status, 200, `Request ${i + 1}: Status should be 200`);
    const body = await res.text();
    assertEqual(body, "hello world", `Request ${i + 1}: Body should be 'hello world'`);
    const contentType = res.headers.get("content-type");
    assertMatch(contentType, /^text\/plain/, `Request ${i + 1}: Content-Type should be text/plain`);
  }
});

// Spec 3: Endpoint Path Specificity
console.log("\nSpec 3: Endpoint Path Specificity");
await test("GET /greeting returns the greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  assertEqual(res.status, 200, "Status should be 200");
});

await test("GET /greet does not return the greeting", async () => {
  const res = await fetch(`${baseURL}/greet`);
  if (res.status === 200) {
    const body = await res.text();
    assertNotEqual(body, "hello world", "Body should not be 'hello world'");
  } else {
    assertNotEqual(res.status, 200, "Status should not be 200");
  }
});

await test("GET /hello does not return the greeting", async () => {
  const res = await fetch(`${baseURL}/hello`);
  if (res.status === 200) {
    const body = await res.text();
    assertNotEqual(body, "hello world", "Body should not be 'hello world'");
  } else {
    assertNotEqual(res.status, 200, "Status should not be 200");
  }
});

// Spec 4: HTTP Method Support
console.log("\nSpec 4: HTTP Method Support");
await test("GET /greeting is supported and returns 200", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, { method: "GET" });
  assertEqual(res.status, 200, "Status should be 200");
});

await test("HEAD /greeting returns 200 with empty body or is supported", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, { method: "HEAD" });
  if (res.status === 200) {
    const body = await res.text();
    assertEqual(body, "", "HEAD response body should be empty");
  }
  // HEAD returning non-200 is also acceptable
});

await test("POST /greeting is not supported (returns non-200)", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assertNotEqual(res.status, 200, "POST should not return 200");
});

await test("DELETE /greeting is not supported (returns non-200)", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, { method: "DELETE" });
  assertNotEqual(res.status, 200, "DELETE should not return 200");
});

await test("PUT /greeting is not supported (returns non-200)", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assertNotEqual(res.status, 200, "PUT should not return 200");
});

// Spec 5: Content-Type Header
console.log("\nSpec 5: Content-Type Header");
await test("Response includes Content-Type header", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  const contentType = res.headers.get("content-type");
  assert(contentType !== null, "Content-Type header should be present");
});

await test("Content-Type is text/plain or text/plain with charset", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  const contentType = res.headers.get("content-type");
  assertMatch(contentType, /^text\/plain(;|$)/, "Content-Type should be text/plain");
});

// Spec 6: Request Body Handling
console.log("\nSpec 6: Request Body Handling");
await test("GET without request body returns greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, { method: "GET" });
  assertEqual(res.status, 200, "Status should be 200");
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

await test("GET with request body still returns greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`, {
    method: "GET",
    body: "ignored",
  });
  assertEqual(res.status, 200, "Status should be 200");
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

// Spec 7: Query Parameters
console.log("\nSpec 7: Query Parameters");
await test("GET /greeting without query parameters returns greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}`);
  assertEqual(res.status, 200, "Status should be 200");
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

await test("GET /greeting?foo=bar returns greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}?foo=bar`);
  assertEqual(res.status, 200, "Status should be 200");
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

await test("GET /greeting with multiple query params returns greeting", async () => {
  const res = await fetch(`${baseURL}${greetingPath}?foo=bar&baz=qux&hello=world`);
  assertEqual(res.status, 200, "Status should be 200");
  const body = await res.text();
  assertEqual(body, "hello world", "Body should be 'hello world'");
});

// Spec 8: Response Timing
console.log("\nSpec 8: Response Timing");
await test("GET /greeting responds within reasonable time (< 1 second)", async () => {
  const start = Date.now();
  const res = await fetch(`${baseURL}${greetingPath}`);
  const elapsed = Date.now() - start;
  assertEqual(res.status, 200, "Status should be 200");
  assert(elapsed < 1000, `Response time ${elapsed}ms should be < 1000ms`);
});

// Summary
console.log("\n" + "=".repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log("=".repeat(50));

if (testsFailed > 0) {
  console.log("\nFailures:");
  failures.forEach(({ description, error }) => {
    console.log(`\n  - ${description}`);
    console.log(`    ${error.message}`);
  });
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
  process.exit(0);
}
