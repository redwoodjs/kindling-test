export function greeting(): string {
  return "hello world";
}

export function greetingHandler(): Response {
  return new Response(greeting(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
