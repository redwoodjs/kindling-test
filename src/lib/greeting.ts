export function greet(): string {
  return "hello world"
}

export function greetHandler(): Response {
  return Response.json({ message: greet() })
}
