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

## GET /status

**Purpose**: Machine-readable liveness and version report. Returns the server status, a per-request UUID, the current server time, uptime in seconds, and the application version.

**Authentication**: None. Publicly accessible by design.

**Method restriction**: GET only. All other methods return `405 Method Not Allowed` (enforced by rwsdk's `MethodHandlers` built-in).

### Response — success

```
HTTP/1.1 200 OK
Content-Type: application/json

{"status": "ok", "requestId": "<uuid>", "time": "<iso-8601>", "uptime": <seconds>, "version": "1.0.0"}
```

**`status`**: Always `"ok"`.

**`requestId`**: A fresh UUID v4 generated on each request via `crypto.randomUUID()`.

**`time`**: ISO 8601 UTC timestamp of the server's wall-clock time at request time, produced by `new Date().toISOString()`.

**`uptime`**: Whole seconds elapsed since the Worker module was first loaded (cold-start). Calculated as `Math.floor((Date.now() - START_TIME) / 1000)`. Resets on each cold start. See `.docs/learnings/cloudflare-workers-uptime.md` for rationale.

**`version`**: The application version string read once from `package.json` at module initialisation. Never re-read per request.

**Side effects**: None. Read-only.

---

## GET /

React SSR homepage. Rendered via rwsdk's `render(Document, [...])` pipeline.
