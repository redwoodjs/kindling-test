import { after, before, describe, it } from "node:test"
import assert from "node:assert"
import { spawn } from "node:child_process"
import { createServer } from "node:net"

const HOST = "127.0.0.1"
const STARTUP_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 250
const REQUEST_TIMEOUT_MS = 3_000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const findAvailablePort = async (): Promise<number> => {
  const server = createServer()

  return await new Promise<number>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, HOST, () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        reject(new Error("Failed to determine an available port"))
        return
      }

      const { port } = address
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve(port)
      })
    })
  })
}

const isProcessRunning = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const waitForServer = async (baseUrl: string, pid: number) => {
  const start = Date.now()

  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    if (!isProcessRunning(pid)) {
      throw new Error(`Dev server exited early before becoming reachable at ${baseUrl}`)
    }

    try {
      const response = await fetch(`${baseUrl}/`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (response.status >= 200 && response.status < 500) {
        return
      }
    } catch {
      // Server not reachable yet.
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`Timed out waiting for dev server at ${baseUrl}`)
}

const stopServer = async (pid: number | undefined) => {
  if (!pid || !isProcessRunning(pid)) {
    return
  }

  process.kill(-pid, "SIGTERM")

  for (let i = 0; i < 20; i += 1) {
    if (!isProcessRunning(pid)) {
      return
    }
    await sleep(250)
  }

  if (isProcessRunning(pid)) {
    process.kill(-pid, "SIGKILL")
  }
}

describe("GET /version", () => {
  let devServerPid: number | undefined
  let baseUrl = ""

  before(async () => {
    const port = await findAvailablePort()
    baseUrl = `http://${HOST}:${port}`

    const devServerProcess = spawn(
      "npm",
      ["run", "dev", "--", "--host", HOST, "--port", String(port)],
      {
        cwd: process.cwd(),
        env: { ...process.env, NO_COLOR: "1" },
        stdio: "ignore",
        detached: true,
      },
    )
    devServerProcess.unref()

    devServerPid = devServerProcess.pid

    if (!devServerPid) {
      throw new Error("Failed to start dev server process")
    }

    await waitForServer(baseUrl, devServerPid)
  })

  after(async () => {
    await stopServer(devServerPid)
  })

  it("returns HTTP 200 and application/json content type", async () => {
    const response = await fetch(`${baseUrl}/version`)

    assert.strictEqual(response.status, 200)
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )
  })

  it("returns exactly {\"version\":\"1.0.0\"} with no additional top-level fields", async () => {
    const response = await fetch(`${baseUrl}/version`)
    const body = (await response.json()) as Record<string, unknown>

    assert.deepStrictEqual(body, { version: "1.0.0" })
  })

  it("is accessible without authentication headers or session", async () => {
    const response = await fetch(`${baseUrl}/version`, {
      headers: {},
    })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(await response.json(), { version: "1.0.0" })
  })

  it("rejects unsupported methods with HTTP 405", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const response = await fetch(`${baseUrl}/version`, { method })
      assert.strictEqual(response.status, 405, `${method} /version must return 405`)
    }
  })

  it("returns consistent side-effect-free results across repeated GET calls", async () => {
    for (let i = 0; i < 3; i += 1) {
      const response = await fetch(`${baseUrl}/version`)
      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), { version: "1.0.0" })
    }
  })
})
