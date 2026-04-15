import { describe, it } from "node:test"
import assert from "node:assert"
import { sparkHandler } from "./spark.ts"

describe("GET /spark", () => {
  it("returns HTTP 200", () => {
    const response = sparkHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns spark: true in the body", async () => {
    const response = sparkHandler()
    const body = (await response.json()) as { spark: boolean }
    assert.strictEqual(body.spark, true)
  })

  it("spark value is boolean true, not the string 'true'", async () => {
    const response = sparkHandler()
    const body = (await response.json()) as { spark: unknown }
    assert.strictEqual(typeof body.spark, "boolean")
    assert.strictEqual(body.spark, true)
  })

  it("response body contains exactly { spark: true } with no extra properties", async () => {
    const response = sparkHandler()
    const body = await response.json()
    assert.deepStrictEqual(body, { spark: true })
  })

  it("sets Content-Type to application/json", () => {
    const response = sparkHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })

  // Spec: non-GET methods (POST, PUT, DELETE) return 405 Method Not Allowed.
  // This behavior is enforced by the framework's route registration ({ get: handler })
  // and is not observable at the unit handler level. It must be verified via
  // integration or end-to-end tests against the running server.

  // Spec: trailing slash (/spark/) behavior is consistent (not a mix of 200/404).
  // This is also a framework-level routing concern, not testable via direct handler
  // invocation. Verify via integration tests.
})
