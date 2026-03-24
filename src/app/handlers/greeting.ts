import { RouteMiddleware } from "rwsdk/router";

export const greetingHandler =
  (): RouteMiddleware =>
  ({ request, response }) => {
    // Exact path matching for /greeting
    const url = new URL(request.url);
    if (url.pathname === "/greeting" && request.method === "GET") {
      response.body = "hello world";
      response.headers.set("Content-Type", "text/plain");
      return;
    }

    // Pass through if not the greeting endpoint
    return;
  };
