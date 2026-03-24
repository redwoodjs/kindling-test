import { defineConfig } from "vitest/config";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    {
      ...cloudflare({
        viteEnvironment: { name: "worker" },
      }),
      apply: "build",
    },
    redwood(),
  ],
  test: {
    environment: "jsdom",
  },
});
