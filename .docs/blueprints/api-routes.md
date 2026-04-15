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

**Purpose**: Minimal liveness probe. Returns a timestamp so callers can measure round-trip latency.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed`.

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{"pong": true, "timestamp": <unix-ms>}
```

**Side effects**: None. Read-only.

---

## GET /status

**Purpose**: Operational status endpoint. Returns server liveness, a per-request trace ID, server time, instance uptime, and application version.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed` (enforced by rwsdk's `MethodHandlers` built-in).

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "running",
  "requestId": "<uuid-v4>",
  "time": "<ISO-8601-UTC>",
  "uptime": <non-negative-integer-seconds>,
  "version": "<semver>"
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"running"`. Signals the instance is alive and serving. |
| `requestId` | string | UUID v4 generated fresh per request via `crypto.randomUUID()`. Useful for log correlation. |
| `time` | string | Current server time in ISO 8601 UTC format (ends with `Z`). |
| `uptime` | number | Whole seconds since this Worker isolate initialized (`Math.floor`). Resets on cold start. |
| `version` | string | Application version from `package.json`. Read once at module load; never per-request I/O. |

**Uptime measurement**: Module initialization time (`Date.now()` captured as `START_TIME.value`). Exported as a mutable object so tests can override without monkey-patching globals. See `.docs/learnings/cloudflare-workers-uptime.md` and `.docs/learnings/testable-time-dependent-handlers.md`.

**Side effects**: None. Read-only.

---

## GET /

React SSR homepage. Rendered via rwsdk's `render(Document, [...])` pipeline.
