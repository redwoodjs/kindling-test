import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { statusHandler } from "@/app/status";
import { healthHandler } from "@/app/pages/health";
import { pingHandler } from "@/lib/ping";
import { greetingHandler } from "@/lib/greetingHandler";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/status", statusHandler),
  route("/health", { get: healthHandler }),
  route("/ping", { get: pingHandler }),
  route("/hello", { get: greetingHandler }),
  render(Document, [route("/", Home)]),
]);
