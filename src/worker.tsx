import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { greetingMiddleware } from "@/app/greeting-middleware";
import { Home } from "@/app/pages/home";
import { Greeting } from "@/app/pages/greeting";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  greetingMiddleware(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [route("/", Home), route("/greeting", Greeting)]),
]);
