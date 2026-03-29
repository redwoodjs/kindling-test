const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type HealthResponse =
  | { healthy: true }
  | { healthy: true; warning: "uptime exceeds 24h, consider recycling" };

const startTime = Date.now();

function defaultGetUptimeMs(): number {
  return Date.now() - startTime;
}

export function createHealthHandler(
  getUptimeMs: () => number = defaultGetUptimeMs,
): () => Response {
  return (): Response => {
    const body: HealthResponse =
      getUptimeMs() > TWENTY_FOUR_HOURS_MS
        ? { healthy: true, warning: "uptime exceeds 24h, consider recycling" }
        : { healthy: true };

    return Response.json(body);
  };
}

export const healthHandler = createHealthHandler();
