# API Routes

Server-side HTTP routes exposed by the Cloudflare Worker. All routes are registered in `src/worker.tsx` via rwsdk's `defineApp` / `route` API.

---

## GET /health

**Purpose**: Liveness check for load balancers, uptime monitors, and operational dashboards.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed` (enforced by rwsdk's `MethodHandlers` built-in).

### Response — normal (uptime ≤ 24 hours)

```
HTTP/1.1 200 OK
Content-Type: application/json

{"healthy": true}
```

### Response — uptime warning (uptime > 24 hours)

```
HTTP/1.1 200 OK
Content-Type: application/json

{"healthy": true, "warning": "uptime exceeds 24h, consider recycling"}
```

**Uptime threshold**: Configurable via the `thresholdMs` parameter of `createHealthHandler`; defaults to 24 hours (86,400,000 ms). Exactly 24 hours does **not** trigger the warning (strictly greater-than comparison).

**Uptime measurement**: Module initialization time (`Date.now()` captured as `START_TIME.value` when the Worker module loads). Exported as a mutable object so tests can override it without monkey-patching globals. Resets on each cold start. See `.docs/learnings/cloudflare-workers-uptime.md` for rationale.

**Side effects**: None. Read-only.

---

## GET /ping

**Purpose**: Lightweight availability check, typically for monitoring and alerting systems.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed`.

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{"pong": true, "timestamp": 1712250000000}
```

**Timestamp**: Millisecond precision (`Date.now()`) at request time. Used for round-trip latency measurement.

**Side effects**: None. Read-only.

---

## GET /status

**Purpose**: Detailed operational status including uptime, version, and request tracking.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed`.

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "time": "2024-04-04T18:03:00.000Z",
  "uptime": 3661,
  "version": "1.0.0"
}
```

**Status**: Always `"ok"` for a healthy instance.

**RequestId**: Unique UUID v4 per request, used for request tracing.

**Time**: ISO 8601 UTC timestamp (always ends with `Z`).

**Uptime**: Seconds elapsed since Worker isolate initialization. Resets on cold start.

**Version**: Semantic version from `package.json`.

**Side effects**: None. Read-only.

---

## GET /greeting

**Purpose**: Simple greeting endpoint returning a hello world message.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed`.

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{"greeting": "hello world"}
```

**Side effects**: None. Read-only.

---

## GET /

React SSR homepage. Rendered via rwsdk's `render(Document, [...])` pipeline.
