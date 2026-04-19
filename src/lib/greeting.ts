export function createGreetingHandler(): Response {
  return Response.json({ greeting: "hello world" })
}

export const greetingHandler = createGreetingHandler
