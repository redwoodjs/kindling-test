import { greeting } from "./greeting.ts"

export function greetingHandler(): Response {
  return Response.json({ message: greeting() })
}
