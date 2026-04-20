import { chromium } from 'playwright';

const screenshotsDir = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1030-playwright-verify-homepage-heading-rende-7b3b/verification-proof/screenshots';
const videoDir = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1030-playwright-verify-homepage-heading-rende-7b3b/verification-proof/video';
const stepLogPath = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1030-playwright-verify-homepage-heading-rende-7b3b/verification-proof/step-log.md';
const cliTranscriptPath = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1030-playwright-verify-homepage-heading-rende-7b3b/verification-proof/cli-transcript.log';

const steps = [];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  steps.push(line);
  console.log(line);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to homepage
    log('STEP 1: Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotsDir}/01-homepage-load.png`, fullPage: true });
    log('STEP 1: Screenshot saved: 01-homepage-load.png');

    // Step 2: Locate the smoke-verify marker
    log('STEP 2: Querying for [data-testid="smoke-verify-marker"]');
    const marker = page.locator('[data-testid="smoke-verify-marker"]');
    const count = await marker.count();
    log(`STEP 2: Found ${count} element(s) with data-testid="smoke-verify-marker"`);
    await page.screenshot({ path: `${screenshotsDir}/02-marker-visible.png`, fullPage: true });
    log('STEP 2: Screenshot saved: 02-marker-visible.png');

    // Step 3: Assert heading text
    log('STEP 3: Reading innerText of marker element');
    const innerText = await marker.innerText();
    log(`STEP 3: innerText = "${innerText}"`);
    const textMatch = innerText.trim() === 'KINDLING SMOKE VERIFY OK';
    log(`STEP 3: Text assertion ${textMatch ? 'PASSED' : 'FAILED'} (expected "KINDLING SMOKE VERIFY OK")`);
    await page.screenshot({ path: `${screenshotsDir}/03-heading-text.png`, fullPage: true });
    log('STEP 3: Screenshot saved: 03-heading-text.png');

    // Step 4: Assert only one main h1 exists inside main
    log('STEP 4: Checking main element for only heading + paragraph children');
    const mainH1s = await page.locator('main h1').count();
    const mainChildren = await page.locator('main > *').count();
    log(`STEP 4: <main> has ${mainChildren} direct children, ${mainH1s} h1(s)`);
    const structureOk = mainChildren <= 2 && mainH1s === 1;
    log(`STEP 4: Structure assertion ${structureOk ? 'PASSED' : 'FAILED'}`);
    await page.screenshot({ path: `${screenshotsDir}/04-main-structure.png`, fullPage: true });
    log('STEP 4: Screenshot saved: 04-main-structure.png');

    // Step 5: Scroll to marker and highlight it
    log('STEP 5: Scrolling marker into view and taking focused screenshot');
    await marker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotsDir}/05-marker-focused.png`, fullPage: true });
    log('STEP 5: Screenshot saved: 05-marker-focused.png');

    // Step 6: Final full-page screenshot
    log('STEP 6: Final full-page screenshot');
    await page.screenshot({ path: `${screenshotsDir}/06-final.png`, fullPage: true });
    log('STEP 6: Screenshot saved: 06-final.png');

    // Summary
    log('SUMMARY: All steps completed.');
    log(`  - marker count: ${count} (expected 1) -> ${count === 1 ? 'PASS' : 'FAIL'}`);
    log(`  - text: "${innerText}" (expected "KINDLING SMOKE VERIFY OK") -> ${textMatch ? 'PASS' : 'FAIL'}`);
    log(`  - main children: ${mainChildren} (expected <=2) -> ${mainChildren <= 2 ? 'PASS' : 'FAIL'}`);
    log(`  - main h1 count: ${mainH1s} (expected 1) -> ${mainH1s === 1 ? 'PASS' : 'FAIL'}`);

  } finally {
    await context.close(); // flushes video
    await browser.close();
  }

  // Write step log
  const stepLog = steps.join('\n');
  await Bun.write(stepLogPath, stepLog);
  console.log('Step log written to:', stepLogPath);
})();
