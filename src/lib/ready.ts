export function readyHandler(): Response {
  return Response.json({ ready: true })
}
