export function greetHandler(): Response {
  return Response.json({ greeting: "hello world" })
}
