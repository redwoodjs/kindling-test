import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting.ts"

describe("greet()", () => {
  it("returns 'hello world' as JSON response", async () => {
    const res = greet()
    assert.ok(res instanceof Response)
    const body = (await res.json()) as { greeting: string }
    assert.strictEqual(body.greeting, "hello world")
  })
})
