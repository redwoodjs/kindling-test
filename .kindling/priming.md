<<KINDLING:PRIMING_START>>

### Architecture
From `.docs/blueprints/api-routes.md`: Cloudflare Worker project using rwsdk.
- **GET /health**: Public liveness check returning `{"healthy": true}`. Optional uptime warning when uptime strictly exceeds 24h (default threshold). Uses mutable `START_TIME.value` (module init time) so tests can override without monkey-patching globals. Method-restricted to GET via rwsdk's `MethodHandlers`.
- **GET /**: React SSR homepage rendered through rwsdk's `render(Document, [...])` pipeline.

### Learnings & Pitfalls
- Uptime measurement relies on module initialization time (`Date.now()` captured as `START_TIME.value`). Exported as a mutable object specifically for test override support. Referenced in `.docs/learnings/cloudflare-workers-uptime.md`.

<<KINDLING:PRIMING_END>>
