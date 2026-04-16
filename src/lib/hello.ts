export function helloHandler(): Response {
  return Response.json({ greeting: "hello world" })
}
