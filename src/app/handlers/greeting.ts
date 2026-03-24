import { RouteMiddleware } from "rwsdk/router";

export const greetingHandler =
  (): RouteMiddleware =>
  ({ request, response }) => {
    // Exact path matching for /greeting
    const url = new URL(request.url);
    if (url.pathname === "/greeting" && request.method === "GET") {
      // Create response with greeting text and set security headers from response
      const greetingResponse = new Response("hello world", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });

      // Copy security headers from the response object that was set by setCommonHeaders
      response.headers.forEach((value, key) => {
        greetingResponse.headers.set(key, value);
      });

      return greetingResponse;
    }

    // Pass through if not the greeting endpoint
    return;
  };
