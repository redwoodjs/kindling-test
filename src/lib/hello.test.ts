import { after, before, describe, it } from "node:test"
import assert from "node:assert"
import { once } from "node:events"
import { spawn, type ChildProcess } from "node:child_process"

const HELLO_PATH = "/hello"
const READY_URL_PATTERN = /Local:\s+http:\/\/([^:\s]+):(\d+)\//
const DEV_SERVER_STARTUP_TIMEOUT_MS = 120_000
const DEV_SERVER_SHUTDOWN_TIMEOUT_MS = 5_000

type DevServer = {
  child: ChildProcess
  baseUrl: string
}

let devServer: DevServer | undefined
let baseUrl = ""

const terminateDevServer = (child: ChildProcess, signal: NodeJS.Signals) => {
  if (child.pid === undefined) {
    child.kill(signal)
    return
  }

  try {
    process.kill(-child.pid, signal)
  } catch {
    child.kill(signal)
  }
}

const startDevServer = () =>
  new Promise<DevServer>((resolve, reject) => {
    const child = spawn("pnpm", ["dev"], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    })
    const stdout = child.stdout
    const stderr = child.stderr

    if (!stdout || !stderr) {
      child.kill("SIGTERM")
      reject(new Error("The dev server process did not expose stdout/stderr pipes."))
      return
    }

    let combinedOutput = ""
    let settled = false

    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      terminateDevServer(child, "SIGTERM")
      reject(
        new Error(
          `Timed out waiting for the dev server to become ready.\n${combinedOutput}`,
        ),
      )
    }, DEV_SERVER_STARTUP_TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timeout)
      stdout.off("data", onData)
      stderr.off("data", onData)
      child.off("error", onError)
      child.off("exit", onExit)
    }

    const onData = (chunk: Buffer) => {
      combinedOutput += chunk.toString("utf8")
      const match = combinedOutput.match(READY_URL_PATTERN)

      if (!match || settled) {
        return
      }

      settled = true
      cleanup()
      const [, host, port] = match
      resolve({
        child,
        baseUrl: `http://${host}:${port}`,
      })
    }

    const onError = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return
      settled = true
      cleanup()
      reject(
        new Error(
          `The dev server exited before it was ready (code ${code}, signal ${signal}).\n${combinedOutput}`,
        ),
      )
    }

    stdout.on("data", onData)
    stderr.on("data", onData)
    child.on("error", onError)
    child.on("exit", onExit)
  })

before(async () => {
  // Exercise the public HTTP surface so the POST 405 check comes from routing.
  devServer = await startDevServer()
  baseUrl = devServer.baseUrl
})

after(async () => {
  if (!devServer || devServer.child.exitCode !== null || devServer.child.signalCode !== null) {
    return
  }

  terminateDevServer(devServer.child, "SIGTERM")

  let shutdownTimeout: NodeJS.Timeout | undefined
  await Promise.race([
    once(devServer.child, "exit"),
    new Promise<void>((resolve) => {
      shutdownTimeout = setTimeout(resolve, DEV_SERVER_SHUTDOWN_TIMEOUT_MS)
    }),
  ])

  if (shutdownTimeout) {
    clearTimeout(shutdownTimeout)
  }

  if (devServer.child.exitCode === null && devServer.child.signalCode === null) {
    terminateDevServer(devServer.child, "SIGKILL")
    await once(devServer.child, "exit")
  }
})

describe("GET /hello", () => {
  it("returns HTTP 200", async () => {
    const response = await fetch(`${baseUrl}${HELLO_PATH}`)
    assert.strictEqual(response.status, 200)
  })

  it("sets a JSON content-type header", async () => {
    const response = await fetch(`${baseUrl}${HELLO_PATH}`)
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )
  })

  it("returns the exact greeting JSON body", async () => {
    const response = await fetch(`${baseUrl}${HELLO_PATH}`)
    const body = await response.text()
    assert.strictEqual(body, '{"message":"Hello, world!"}')
  })
})

describe("POST /hello", () => {
  it("returns HTTP 405", async () => {
    const response = await fetch(`${baseUrl}${HELLO_PATH}`, {
      method: "POST",
    })
    assert.strictEqual(response.status, 405)
  })
})
