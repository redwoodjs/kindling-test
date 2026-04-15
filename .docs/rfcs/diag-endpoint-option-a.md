# RFC: `/diag` Endpoint, Option A

**Date**: 2026-04-15  
**Author**: DeveloperA  
**Status**: Draft

---

## Summary

Option A makes `/diag` a narrowly gated operator snapshot. It uses a single shared secret checked inside the worker, returns only an allowlisted JSON payload, and fails closed with a generic `404` when the caller is not authorized. The design avoids new platform dependencies and keeps the endpoint useful for support without turning it into a general debug dump.

This is the smallest safe surface area I think we can ship while still making the endpoint operationally useful.

---

## Contract

- Method: `GET` only.
- Success: `200` with JSON.
- Unauthorized or misconfigured access: `404` with no diagnostic hints.
- Cache policy: `no-store`.
- Side effects: none.

The route is intentionally not a public status check. It exists for trusted operators and automation only.

---

## Access Model

- The deployment provides one opaque secret per environment via `DIAG_TOKEN`.
- The caller sends the secret as `Authorization: Bearer <token>`.
- The worker compares the presented value server-side and never echoes it back.
- Missing secret configuration means inaccessible by default; the route must not open itself in development or preview without an explicit secret.

I recommend `Authorization: Bearer <token>` so operators can use existing tooling without a custom auth flow. The important constraint is that the gate is a single shared secret and the application fails closed when it is absent or incorrect.

---

## Response Shape

| Field | Required | Notes |
| --- | --- | --- |
| `status` | yes | Constant `ok`. |
| `schemaVersion` | yes | Fixed integer `1`. |
| `requestId` | yes | Fresh UUID per request. |
| `time` | yes | UTC ISO timestamp. |
| `uptime` | yes | Whole seconds since module start. |
| `build.version` | yes | Application version from package metadata. |
| `runtime.platform` | yes | Fixed to `cloudflare-workers`. |
| `runtime.environment` | conditional | Deployment label from `DIAG_ENVIRONMENT` if configured; omitted otherwise. |
| `checks.redacted` | yes | `true` when the response is built from the allowlist. |
| `checks.environmentConfigured` | yes | `true` when `DIAG_ENVIRONMENT` is present. |

The payload is a stable snapshot, not a free-form dump. If a value is unknown or unavailable, it should be omitted rather than replaced with a placeholder that looks authoritative.

---

## Safety and Redaction

- Do not return raw environment variables, request headers, cookies, request bodies, stack traces, or configuration blobs.
- Do not include request-derived identifiers other than `requestId`.
- Do not vary the schema based on caller identity.
- Keep the payload stable across deployments so automation can parse it safely.
- Do not log request contents in the handler itself.

The main safety rule is simple: every returned field must be on the allowlist. Nothing else should be serialized.

---

## Tradeoffs

### Pros

- Smallest operational footprint.
- No new auth service or platform dependency.
- Easy to reason about in code review and during incident response.
- Avoids a public debug leak by default.

### Cons

- Operators must distribute and rotate a secret.
- The app still owns access control logic instead of delegating it to infrastructure.
- There is no user identity model, only possession of the shared secret.

Compared with a platform-gated design, this option is easier to ship but slightly less centralized.

---

## Deployment Assumptions

- The deployment environment can store one secret per environment.
- Operators or automation can attach a request header when calling the endpoint.
- The worker can read deployment metadata synchronously at request time.
- The app does not rely on any existing account or session system.

If any of those assumptions do not hold, this option loses most of its simplicity advantage.

---

## Open Questions

1. Should the shared secret live in an environment variable or a platform secret binding?
2. Should local development require the same secret, or should it allow an explicit override for developer convenience?
3. Is `runtime.environment` mandatory in all deployments, or should it be omitted when the environment label is unknown?
4. Should the failure response be `404` in all cases, or should some deployments prefer `401` or `403` for operator tooling?
5. Is `schemaVersion: 1` the desired long-term starting point?
