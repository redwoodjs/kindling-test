/**
 * Greeting utility function
 */

export function greet(): string {
  return "Hello, World!";
}

/**
 * HTTP GET handler for the /greet endpoint
 * Returns the greeting message as JSON
 */
export async function greetHandler(): Promise<Response> {
  return Response.json({ message: greet() });
}
