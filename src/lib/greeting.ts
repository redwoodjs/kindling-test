export function greet(): string {
  return "hello world"
}

export function greetingHandler(): Response {
  return Response.json({ greeting: greet() })
}
