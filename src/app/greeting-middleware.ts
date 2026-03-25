import { RouteMiddleware } from "rwsdk/router";

export const greetingMiddleware = (): RouteMiddleware => {
  return ({ request, response }) => {
    if (request.url.pathname === "/greeting" && request.method === "GET") {
      response.statusCode = 200;
      response.body = "hello world";
      response.headers.set("Content-Type", "text/plain");
      response.headers.set("Content-Length", "11");
    }
  };
};
