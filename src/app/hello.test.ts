import assert from "node:assert"
import { describe, it } from "node:test"

import { helloHandler } from "./hello.ts"
import { defineRoutes, route } from "../../node_modules/rwsdk/dist/runtime/lib/router.js"
import { constructWithDefaultRequestInfo } from "../../node_modules/rwsdk/dist/runtime/requestInfo/utils.js"

const routes = defineRoutes([route("/hello", helloHandler)])

async function requestHello(method = "GET") {
  const request = new Request("https://example.com/hello", { method })
  return routes.handle({
    request,
    renderPage: async () => {
      throw new Error("renderPage should not be called for /hello")
    },
    getRequestInfo: () =>
      constructWithDefaultRequestInfo({
        request,
        cf: {} as any,
      }),
    onError: (error) => {
      throw error
    },
    runWithRequestInfoOverrides: async (_overrides, fn) => await fn(),
    rscActionHandler: async () => undefined,
  })
}

describe("GET /hello", () => {
  it("returns HTTP 200", async () => {
    const response = await requestHello()
    assert.strictEqual(response.status, 200)
  })

  it('returns "Hello, world!" as the response body', async () => {
    const response = await requestHello()
    assert.strictEqual(await response.text(), "Hello, world!")
  })

  it("returns a plain text content type", async () => {
    const response = await requestHello()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("text/plain"),
      `Expected content-type to include text/plain, got: ${contentType}`,
    )
  })
})

describe("POST /hello", () => {
  it("returns HTTP 405 Method Not Allowed", async () => {
    const response = await requestHello("POST")
    assert.strictEqual(response.status, 405)
  })
})
