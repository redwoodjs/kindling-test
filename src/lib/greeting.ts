export function greetingHandler(): Response {
  return new Response("hello world", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  })
}
