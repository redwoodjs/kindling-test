export function greeting(): string {
  return "hello world"
}

export function greetingHandler(): Response {
  return new Response(greeting(), {
    headers: { "Content-Type": "text/plain" },
  })
}
