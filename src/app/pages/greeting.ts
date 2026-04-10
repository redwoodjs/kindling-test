export function greetingHandler(): Response {
  return Response.json({ hello: "world" });
}
