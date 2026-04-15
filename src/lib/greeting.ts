export function greetingHandler(): Response {
  return Response.json({ greeting: "hello world" })
}
