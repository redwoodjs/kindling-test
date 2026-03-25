import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/api/greeting", () => {
    return new Response("Hello from kindling test", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }),
  render(Document, [route("/", Home)]),
]);
