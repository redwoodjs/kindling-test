export function pingHandler(): Response {
  return Response.json({ pong: true, timestamp: Date.now() })
}
