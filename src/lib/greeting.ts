export function createGreetingHandler(
  getGreeting: () => string = () => "hello world",
): () => Response {
  return (): Response => Response.json({ message: getGreeting() });
}

export const greetingHandler = createGreetingHandler();
