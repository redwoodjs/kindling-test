export function greet(): string {
  return "Hello, World!";
}

export function greetingHandler(): Response {
  return Response.json({ message: greet() });
}
