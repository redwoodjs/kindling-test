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

## GET /greeting

**Purpose**: Simple JSON endpoint returning a static greeting payload. Used as a minimal integration target for smoke tests.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed`.

### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{"greeting": "hello world"}
```

**Implementation**: `src/lib/greeting.ts` — exports `greetingHandler()` which returns `Response.json({ greeting: "hello world" })`. Registered in `src/worker.tsx` as `route("/greeting", { get: greetingHandler })` before the `render(...)` call.

**Side effects**: None. Deterministic and read-only.

---

## GET /

React SSR homepage. Rendered via rwsdk's `render(Document, [...])` pipeline.
