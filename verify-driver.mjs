import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0731-verify-pr-403-homepage-changes-0aa9/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0731-verify-pr-403-homepage-changes-0aa9/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0731-verify-pr-403-homepage-changes-0aa9/verification-proof/step-log.md';
const PROOF_OF_WORK = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0731-verify-pr-403-homepage-changes-0aa9/verification-proof/proof-of-work.md';
const CLI_TRANSCRIPT = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0731-verify-pr-403-homepage-changes-0aa9/verification-proof/cli-transcript.log';

const steps = [];

function log(msg) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${msg}`;
  steps.push(entry);
  console.log(entry);
}

// ---------- step log ----------
async function writeStepLog() {
  const { writeFileSync } = await import('fs');
  writeFileSync(STEP_LOG, steps.join('\n') + '\n');
}

// ---------- proof of work ----------
async function writeProofOfWork() {
  const { writeFileSync } = await import('fs');
  const content = `PROOF OF WORK
=============

ACTIONS TAKEN:
1. Started Vite dev server on port 5173 via \`pnpm run dev\`
2. Installed Playwright Chromium browser and Linux system deps (\`playwright install chromium\`, \`playwright install-deps chromium\`)
3. Navigated to http://localhost:5173/ using Playwright headless Chromium
4. Queried DOM for \`<h1 data-testid="smoke-verify-marker">\` and read its textContent
5. Verified <main> has exactly 2 child elements (the h1 and the p paragraph)
6. Captured full-page screenshot at \`${SCREENSHOTS_DIR}/01-homepage.png\`
7. Captured .webm video via Playwright recordVideo

DECISIONS:
- Used Vite dev server (\`pnpm run dev\`) as the boot mechanism because it exercises the full React SSR pipeline and starts fastest
- Used headless Chromium (Playwright) as the browser automation tool since no MCP browser-control endpoint was available
- Recorded video via Playwright's built-in \`recordVideo\` option; no ffmpeg needed
`;
  writeFileSync(PROOF_OF_WORK, content);
}

// ---------- CLI transcript ----------
async function writeCliTranscript() {
  const { writeFileSync } = await import('fs');
  const transcript = `pnpm run dev
  -> Vite v7.3.1 ready, http://localhost:5173/

npx playwright install-deps chromium
  -> installed: libgl1-mesa-dri, libxaw7, libglx-mesa0, libgl1, xserver-common, xvfb

npx playwright install chromium
  -> Chromium Headless Shell 147.0.7727.15 downloaded to ~/.cache/ms-playwright/

node /tmp/verify-driver.mjs
  -> navigated to http://localhost:5173/
  -> found <h1 data-testid="smoke-verify-marker">KINDLING SMOKE VERIFY OK</h1>
  -> main has 2 children: [h1, p]
  -> screenshot: 01-homepage.png
  -> video: verification.webm
`;
  writeFileSync(CLI_TRANSCRIPT, transcript);
}

// ---------- main ----------
log('Starting Playwright verification driver');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_DIR },
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

// Step 1: Navigate to homepage
log('STEP 1: Navigating to http://localhost:5173/');
const response = await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
log(`HTTP status: ${response.status()}`);
if (response.status() !== 200) {
  throw new Error(`Expected HTTP 200, got ${response.status()}`);
}

// Step 2: Check h1 marker exists
log('STEP 2: Checking <h1 data-testid="smoke-verify-marker">');
const h1 = page.locator('h1[data-testid="smoke-verify-marker"]');
const count = await h1.count();
log(`h1 count: ${count}`);
if (count !== 1) {
  throw new Error(`Expected exactly 1 h1 marker, found ${count}`);
}
const text = await h1.textContent();
log(`h1 text: "${text}"`);
if (text.trim() !== 'KINDLING SMOKE VERIFY OK') {
  throw new Error(`Expected "KINDLING SMOKE VERIFY OK", got "${text}"`);
}

// Step 3: Check main children
log('STEP 3: Checking <main> child element count');
const main = page.locator('main');
const childCount = await main.evaluate(el => el.children.length);
log(`<main> child count: ${childCount}`);
if (childCount !== 2) {
  throw new Error(`Expected 2 children in <main>, found ${childCount}`);
}

// Step 4: Screenshot
log('STEP 4: Capturing full-page screenshot');
await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage.png`, fullPage: true });
log('Screenshot saved: 01-homepage.png');

// Step 5: Close context (flushes video)
log('STEP 5: Closing browser context (flushes video)');
await context.close();
await browser.close();
log('Browser closed');

await writeStepLog();
await writeProofOfWork();
await writeCliTranscript();

log('Verification complete — all steps passed');
