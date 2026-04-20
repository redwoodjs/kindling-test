import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SCREENSHOTS = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-the-changes-in-https-github-com-r-a390/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-the-changes-in-https-github-com-r-a390/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-the-changes-in-https-github-com-r-a390/verification-proof/step-log.md';
const CLI_TRANSCRIPT = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-the-changes-in-https-github-com-r-a390/verification-proof/cli-transcript.log';
const PROOF_OF_WORK = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-the-changes-in-https-github-com-r-a390/verification-proof/proof-of-work.md';
const URL = 'http://localhost:5173/';

const steps = [];
const transcript = [];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  steps.push(line);
  console.log(line);
}

async function run() {
  log('STARTING VERIFICATION');
  transcript.push('Command: node /tmp/verify-driver.mjs');
  transcript.push(`Target: ${URL}`);

  log('Step 1: Launching browser');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  log('Browser launched');

  log('Step 2: Navigating to homepage');
  const resp = await page.goto(URL, { waitUntil: 'domcontentloaded' });
  log(`HTTP response status: ${resp.status()}`);
  transcript.push(`HTTP GET ${URL} -> ${resp.status()}`);

  log('Step 3: Screenshot at initial load (before JS hydration)');
  await page.screenshot({ path: `${SCREENSHOTS}/01-initial-load.png`, fullPage: false });
  log('Screenshot saved: 01-initial-load.png');

  log('Step 4: Waiting for network to settle (no active requests for >=500ms)');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => log('networkidle timed out — using domcontentloaded fallback'));
  await page.waitForTimeout(1000);
  log('Network settled');

  log('Step 5: Screenshot after full render');
  await page.screenshot({ path: `${SCREENSHOTS}/02-full-render.png`, fullPage: true });
  log('Screenshot saved: 02-full-render.png');

  log('Step 6: DOM assertions');
  const results = {};

  // h1 exists
  const h1Locator = page.locator('h1[data-testid="smoke-verify-marker"]');
  const h1Count = await h1Locator.count();
  results['h1 exists'] = h1Count > 0;
  log(`h1[data-testid="smoke-verify-marker"] count: ${h1Count} -> ${results['h1 exists'] ? 'PASS' : 'FAIL'}`);

  // h1 text
  if (results['h1 exists']) {
    const h1Text = await h1Locator.textContent();
    results['h1 text correct'] = h1Text === 'KINDLING SMOKE VERIFY OK';
    log(`h1 text: "${h1Text}" -> ${results['h1 text correct'] ? 'PASS' : 'FAIL'}`);
  } else {
    results['h1 text correct'] = false;
  }

  // subtitle paragraph
  const pLocator = page.locator('p');
  const pCount = await pLocator.count();
  const pTexts = pCount > 0 ? await pLocator.allTextContents() : [];
  const subtitleMatch = pTexts.find(t => t.includes('If you are a verify agent'));
  results['subtitle present'] = !!subtitleMatch;
  log(`Subtitle paragraph found: ${results['subtitle present']} -> ${results['subtitle present'] ? 'PASS' : 'FAIL'}`);
  if (subtitleMatch) log(`Subtitle text: "${subtitleMatch}"`);

  // background color
  const mainBg = await page.locator('main').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  results['background color correct'] = mainBg === 'rgb(255, 251, 230)';
  log(`main background-color: "${mainBg}" -> ${results['background color correct'] ? 'PASS (matches #fffbe6)' : 'FAIL'}`);

  // centered flex
  const mainDisplay = await page.locator('main').evaluate(el => {
    const s = window.getComputedStyle(el);
    return { display: s.display, flexDirection: s.flexDirection, alignItems: s.alignItems, justifyContent: s.justifyContent };
  });
  results['centered flex layout'] = mainDisplay.display === 'flex' && mainDisplay.alignItems === 'center' && mainDisplay.justifyContent === 'center';
  log(`main display: ${JSON.stringify(mainDisplay)} -> ${results['centered flex layout'] ? 'PASS' : 'FAIL'}`);

  log('Step 7: Final screenshot with DOM confirmed');
  await page.screenshot({ path: `${SCREENSHOTS}/03-final-proof.png`, fullPage: true });
  log('Screenshot saved: 03-final-proof.png');

  log('Step 8: Closing browser (flushes .webm)');
  await context.close();
  await browser.close();
  log('Browser closed');

  // Write step log
  const stepLogContent = steps.join('\n');
  writeFileSync(STEP_LOG, stepLogContent);

  // Write CLI transcript
  const cliContent = transcript.join('\n');
  writeFileSync(CLI_TRANSCRIPT, cliContent);

  // Write proof of work
  const powContent = `PROOF OF WORK
=============

ACTIONS TAKEN:
1. Started vite dev server on port 5173 (PID from background process)
2. Verified dev server responded with HTML containing main element with flex styles
3. Installed Playwright Chromium browser (chromium-headless-shell v1217)
4. Installed Playwright system dependencies (libgl1, libxaw7, xvfb, etc.)
5. Wrote and executed /tmp/verify-driver.mjs using Playwright Node.js API
6. Navigated to http://localhost:5173/ in headless Chromium
7. Captured screenshot at initial load (before hydration)
8. Waited for network idle + settled
9. Captured screenshot after full render
10. Performed DOM assertions:
    - h1[data-testid="smoke-verify-marker"] exists: ${results['h1 exists'] ? 'PASS' : 'FAIL'}
    - h1 textContent equals "KINDLING SMOKE VERIFY OK": ${results['h1 text correct'] ? 'PASS' : 'FAIL'}
    - Subtitle paragraph present: ${results['subtitle present'] ? 'PASS' : 'FAIL'}
    - main background-color equals rgb(255, 251, 230) (#fffbe6): ${results['background color correct'] ? 'PASS' : 'FAIL'}
    - main layout is centered flex: ${results['centered flex layout'] ? 'PASS' : 'FAIL'}
11. Captured final proof screenshot
12. Closed browser context to flush .webm video

DECISIONS:
- Used vite dev server (not vite preview) per the verification plan
- Used headless Chromium (no visible window) for headless environment compatibility
- Recorded video via Playwright's built-in recordVideo (context-level) for full-session capture
- Used networkidle + 1s settle wait before final screenshot to ensure hydration complete
- Used Node.js fs.writeFileSync for durable proof workspace writes

PROOF FILES:
- screenshots/01-initial-load.png
- screenshots/02-full-render.png
- screenshots/03-final-proof.png
- video/verification.webm (flushed on context.close())
- step-log.md
- cli-transcript.log
`;
  writeFileSync(PROOF_OF_WORK, powContent);

  const allPassed = Object.values(results).every(Boolean);
  log(`\nALL ASSERTIONS: ${allPassed ? 'PASS' : 'FAIL'}`);
  log(`Results: ${JSON.stringify(results)}`);

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
