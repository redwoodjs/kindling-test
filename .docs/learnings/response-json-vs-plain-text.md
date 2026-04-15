# Response.json() Only Works for JSON Payloads

## Problem

The `Response.json()` static method only serializes objects as JSON and sets `Content-Type: application/json`. It cannot produce plain-text responses.

## Finding

`Response.json()` accepts a serializable value and returns a `Response` with `Content-Type: application/json`. For any other content type, use the `Response` constructor directly:

```typescript
// ✅ JSON response — Content-Type: application/json automatically
return Response.json({ pong: true, timestamp: Date.now() });

// ✅ Plain-text response — must use the Response constructor
return new Response("hello world", {
  headers: { "Content-Type": "text/plain" },
});
```

## Context

The `/greeting` endpoint returns the string `"hello world"` as plain text. Using `Response.json("hello world")` would JSON-encode the string as `"hello world"` (with quotes) and set the content type to `application/json`, which is wrong. The `new Response()` constructor is the correct choice when the response body is not JSON.

## Reference

- MDN: [`Response.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) — equivalent to `new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })`
- MDN: [`Response()` constructor](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) — accepts any `BodyInit` (string, Blob, ArrayBuffer, etc.)
