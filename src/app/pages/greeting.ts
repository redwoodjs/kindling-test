export function greetingHandler(): Response {
  return new Response("hello world", { headers: { "Content-Type": "text/plain" } });
}
