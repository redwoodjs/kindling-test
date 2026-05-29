export function greeting(): string {
  return "hello world";
}

export function greetingHandler(): Response {
  return Response.json({ message: greeting() });
}
