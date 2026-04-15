# Cloudflare Workers: Measuring Instance Uptime

## Problem

Cloudflare Workers do not expose `process.uptime()`. Even with `nodejs_compat` enabled in `wrangler.jsonc`, `process.uptime()` is not available as a reliable measure of how long the current Worker instance has been running.

## Solution

Capture `Date.now()` at module initialization time as the instance start timestamp:

```typescript
const startTime = Date.now();

function getUptimeMs(): number {
  return Date.now() - startTime;
}
```

This is idiomatic for the Workers runtime and correctly captures when the current isolate was initialized.

## Semantics

- **Resets on cold start**: Each new Worker isolate gets a fresh `startTime`. This is the intended behavior — uptime tracks the current instance's age, not any global wall-clock lifetime.
- **Accurate within an isolate**: All requests to the same isolate share the same `startTime`, so uptime grows monotonically within a single instance.

## Context

This is the correct way to measure instance age in Cloudflare Workers whenever a route genuinely needs uptime. The current health endpoint no longer uses an uptime warning, but any future time-based handler should use this pattern.
