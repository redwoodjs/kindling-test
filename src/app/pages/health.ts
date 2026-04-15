export type HealthResponse = {
  status: "ok";
};

export function healthHandler(): Response {
  const body: HealthResponse = { status: "ok" };
  return Response.json(body);
}
