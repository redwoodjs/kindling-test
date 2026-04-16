import { describe, it } from "node:test"
import assert from "node:assert"
import { defineApp } from "rwsdk/worker"
import { route } from "rwsdk/router"
import { helloHandler } from "./hello.ts"

const env = {
  ASSETS: {
    fetch: async () => new Response(null, { status: 404 }),
  } as Fetcher,
  DB: {} as D1Database,
} as Env

const executionContext = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
} as ExecutionContext

const app = defineApp([
  route("/hello", {
    get: helloHandler,
  }),
])

async function fetchHello(method = "GET") {
  return app.fetch(
    new Request("https://example.test/hello", { method }),
    env,
    executionContext,
  )
}

describe("GET /hello", () => {
  it("returns HTTP 200 with a JSON hello world payload", async () => {
    const response = await fetchHello()

    assert.strictEqual(response.status, 200)
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )

    const body = (await response.json()) as { greeting: string }
    assert.deepStrictEqual(body, { greeting: "hello world" })
  })

  it("returns HTTP 405 for POST", async () => {
    const response = await fetchHello("POST")
    assert.strictEqual(response.status, 405)
  })
})
