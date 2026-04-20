import { describe, it } from "node:test"
import assert from "node:assert"
import { createGreetingHandler, greetingHandler } from "./greeting.ts"

describe("GET /greeting", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns application/json content type", () => {
    const response = greetingHandler()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include "application/json", got: "${contentType}"`,
    )
  })

  it("response body contains message with 'hello world'", async () => {
    const response = greetingHandler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "hello world")
  })
})

describe("createGreetingHandler factory", () => {
  it("uses default greeting when no custom getter provided", async () => {
    const handler = createGreetingHandler()
    const response = handler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "hello world")
  })

  it("uses custom greeting getter when provided", async () => {
    const handler = createGreetingHandler(() => "custom greeting")
    const response = handler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "custom greeting")
  })

  it("injects dynamic greeting from getter", async () => {
    let callCount = 0
    const handler = createGreetingHandler(() => `greeting ${++callCount}`)
    const response1 = handler()
    const response2 = handler()
    const body1 = (await response1.json()) as { message: string }
    const body2 = (await response2.json()) as { message: string }
    assert.strictEqual(body1.message, "greeting 1")
    assert.strictEqual(body2.message, "greeting 2")
  })
})
