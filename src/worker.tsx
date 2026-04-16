import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { statusHandler } from "@/app/status";
import { healthHandler } from "@/app/pages/health";
import { helloHandler } from "@/lib/hello";
import { pingHandler } from "@/lib/ping";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/status", statusHandler),
  route("/health", { get: healthHandler }),
  route("/hello", { get: helloHandler }),
  route("/ping", { get: pingHandler }),
  render(Document, [route("/", Home)]),
]);
