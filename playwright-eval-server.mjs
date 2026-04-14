#!/usr/bin/env node
import { chromium } from "playwright";
import { createServer } from "node:http";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    port: { type: "string", default: "9222" },
    "video-dir": { type: "string", default: "/tmp/pw-video" },
    headless: { type: "boolean", default: true },
    "screenshot-dir": { type: "string", default: "/tmp/pw-screenshots" },
  },
});

const PORT = parseInt(args.port, 10);
const VIDEO_DIR = args["video-dir"];
const SCREENSHOT_DIR = args["screenshot-dir"];
const HEADLESS = args.headless;

let browser = null;
let context = null;
let page = null;

async function ensureBrowser() {
  if (browser && page) {
    return;
  }
  browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();
  console.log(`[pw-eval] browser launched (headless=${HEADLESS}, video=${VIDEO_DIR})`);
}

async function handleEval(body) {
  await ensureBrowser();
  const fn = new Function(
    "page",
    "context",
    "browser",
    `return (async () => { ${body} })()`,
  );
  const result = await fn(page, context, browser);
  return { ok: true, result: result ?? null };
}

async function handleScreenshot(name) {
  await ensureBrowser();
  const filename = name || `screenshot-${Date.now()}`;
  const filepath = `${SCREENSHOT_DIR}/${filename}.png`;
  await page.screenshot({ path: filepath, fullPage: true });
  return { ok: true, path: filepath };
}

async function handleClose() {
  const paths = {};
  if (page) {
    await page.close();
    page = null;
  }
  if (context) {
    const pages = context.pages();
    if (pages.length === 0) {
      await context.close();
    } else {
      for (const p of pages) {
        const video = p.video();
        if (video) {
          try {
            paths.video = await video.path();
          } catch {
            // video not available
          }
        }
        await p.close();
      }
      await context.close();
    }
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
  return { ok: true, paths };
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      resolve(body);
    });
  });
}

const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === "/eval" && req.method === "POST") {
      const body = await readBody(req);
      const result = await handleEval(body);
      res.end(JSON.stringify(result));
    } else if (url.pathname === "/screenshot") {
      const name = url.searchParams.get("name");
      const result = await handleScreenshot(name);
      res.end(JSON.stringify(result));
    } else if (url.pathname === "/close" && req.method === "POST") {
      const result = await handleClose();
      res.end(JSON.stringify(result));
      server.close();
      process.exit(0);
    } else if (url.pathname === "/health") {
      res.end(JSON.stringify({ ok: true, hasPage: !!page }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "not found" }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err.message, stack: err.stack }));
  }
});

server.listen(PORT, () => {
  console.log(`[pw-eval] listening on http://localhost:${PORT}`);
  console.log(`[pw-eval] POST /eval — send Playwright code, get results`);
  console.log(`[pw-eval] GET /screenshot?name=foo — save screenshot`);
  console.log(`[pw-eval] POST /close — finalize video, shut down`);
  console.log(`[pw-eval] GET /health — check status`);
});
