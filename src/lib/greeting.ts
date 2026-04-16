export function greetingHandler(): Response {
  return new Response("hello world", { status: 200 });
}
