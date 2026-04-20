import { describe, it } from "node:test"
import assert from "node:assert"
import { helloHandler } from "./hello.ts"

describe("GET /hello", () => {
  it("returns HTTP 200", async () => {
    const response = helloHandler()
    assert.strictEqual(response.status, 200)
  })

  it("sets Content-Type to application/json", () => {
    const response = helloHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })

  it("returns a valid JSON body", async () => {
    const response = helloHandler()
    // json() rejects on invalid JSON; if it resolves the body is valid
    const body = await response.json()
    assert.ok(body !== null && body !== undefined)
  })

  it("body contains a message key", async () => {
    const response = helloHandler()
    const body = (await response.json()) as Record<string, unknown>
    assert.ok("message" in body)
  })

  it("message value is exactly \"Hello, World!\"", async () => {
    const response = helloHandler()
    const body = (await response.json()) as { message: unknown }
    assert.strictEqual(body.message, "Hello, World!")
  })

  it("body contains no extra fields", async () => {
    const response = helloHandler()
    const body = (await response.json()) as Record<string, unknown>
    const keys = Object.keys(body)
    assert.deepStrictEqual(keys, ["message"])
  })

  it("repeated calls return the same greeting (idempotent)", async () => {
    const first = (await helloHandler().json()) as { message: string }
    const second = (await helloHandler().json()) as { message: string }
    assert.strictEqual(first.message, second.message)
  })

  // Note: non-GET requests returning 405 is enforced at the routing layer
  // (route("/hello", { get: helloHandler })) and is not testable at the handler level.
})
