export function greetingHandler(): Response {
  return Response.json({ greeting: "Hello, World!" })
}
