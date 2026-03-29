// Default threshold for the uptime warning: 24 hours in milliseconds.
// Pass a different value to createHealthHandler's thresholdMs parameter to
// override it (e.g. a shorter window in staging, or a longer one on low-churn
// deployments). When uptime exceeds this threshold the response includes a
// warning recommending a worker recycle.
const DEFAULT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type HealthResponse =
  | { healthy: true }
  | { healthy: true; warning: "uptime exceeds 24h, consider recycling" };

// START_TIME holds the millisecond timestamp at which this module was first
// loaded (i.e. when the Worker isolate started). It is exported as a mutable
// object so tests can override START_TIME.value to simulate an aged-out
// instance without waiting real time.
export const START_TIME = { value: Date.now() };

function defaultGetUptimeMs(): number {
  return Date.now() - START_TIME.value;
}

export function createHealthHandler(
  getUptimeMs: () => number = defaultGetUptimeMs,
  // thresholdMs: how long (in ms) before the warning is included in the
  // response. Defaults to DEFAULT_THRESHOLD_MS (24 h). Inject a smaller value
  // in tests or environments that recycle workers more aggressively.
  thresholdMs: number = DEFAULT_THRESHOLD_MS,
): () => Response {
  return (): Response => {
    // Emit a recycling advisory once the isolate has been alive longer than
    // the configured threshold. The healthy flag remains true regardless —
    // the warning is informational only.
    const body: HealthResponse =
      getUptimeMs() > thresholdMs
        ? { healthy: true, warning: "uptime exceeds 24h, consider recycling" }
        : { healthy: true };

    return Response.json(body);
  };
}

export const healthHandler = createHealthHandler();
