import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { statusHandler } from "@/app/status";
import { healthHandler } from "@/app/pages/health";
import { pingHandler } from "@/lib/ping";
import { greetingHandler } from "@/lib/greeting";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/status", statusHandler),
  route("/health", { get: healthHandler }),
  route("/greeting", { get: greetingHandler }),
  route("/ping", { get: pingHandler }),
  render(Document, [route("/", Home)]),
]);
