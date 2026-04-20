import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SCR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1229-verify-pr-523-homepage-changes-3262/verification-proof/screenshots';
const VID = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1229-verify-pr-523-homepage-changes-3262/verification-proof/video';
const LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1229-verify-pr-523-homepage-changes-3262/verification-proof/step-log.md';
const CLI = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1229-verify-pr-523-homepage-changes-3262/verification-proof/cli-transcript.log';
const POW = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1229-verify-pr-523-homepage-changes-3262/verification-proof/proof-of-work.md';

const URL = 'http://localhost:5173/';
const results = [];
const steps = [];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  steps.push(line);
}

async function run() {
  log('Starting Playwright verification driver');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VID },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Step 1: Navigate to homepage
  log('STEP 1: Navigating to homepage');
  const response = await page.goto(URL, { waitUntil: 'networkidle' });
  const status = response.status();
  log(`HTTP status: ${status}`);
  results.push({ step: 1, pass: status === 200, detail: `HTTP ${status}` });
  await page.screenshot({ path: `${SCR}/01-homepage-load.png`, fullPage: true });
  log('Screenshot: 01-homepage-load.png');

  // Step 2: Verify h1 is present with correct text
  log('STEP 2: Verifying h1 heading');
  const h1 = page.locator('h1');
  const h1Count = await h1.count();
  log(`h1 count: ${h1Count}`);
  const h1Text = await h1.textContent();
  log(`h1 text: "${h1Text}"`);
  const textMatch = h1Text.trim() === 'KINDLING SMOKE VERIFY OK';
  results.push({ step: 2, pass: h1Count === 1 && textMatch, detail: `h1 count=${h1Count}, text="${h1Text.trim()}"` });

  // Step 3: Verify data-testid attribute
  log('STEP 3: Verifying data-testid="smoke-verify-marker"');
  const marker = page.locator('[data-testid="smoke-verify-marker"]');
  const markerCount = await marker.count();
  log(`data-testid count: ${markerCount}`);
  results.push({ step: 3, pass: markerCount === 1, detail: `marker count=${markerCount}` });

  // Step 4: Verify font-size is 3rem
  log('STEP 4: Verifying h1 font-size is 3rem');
  const fontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
  log(`h1 font-size: ${fontSize}`);
  results.push({ step: 4, pass: fontSize === '48px', detail: `font-size=${fontSize} (3rem=48px at default)` });

  // Step 5: Verify main content: only h1 and p inside <main>
  log('STEP 5: Verifying <main> contains only h1 and p');
  const main = page.locator('main');
  const mainChildCount = await main.evaluate(el => el.children.length);
  const mainTagNames = await main.evaluate(el => Array.from(el.children).map(c => c.tagName.toLowerCase()));
  log(`main children count: ${mainChildCount}, tags: ${mainTagNames.join(', ')}`);
  results.push({ step: 5, pass: mainChildCount === 2 && mainTagNames.includes('h1') && mainTagNames.includes('p'), detail: `children=${mainChildCount}, tags=${mainTagNames.join(',')}` });
  await page.screenshot({ path: `${SCR}/02-main-content.png`, fullPage: true });
  log('Screenshot: 02-main-content.png');

  // Step 6: Scroll heading into view and capture centered
  log('STEP 6: Scrolling heading into view and capturing viewport');
  await h1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCR}/03-heading-centered.png`, fullPage: true });
  log('Screenshot: 03-heading-centered.png');

  // Console errors check
  log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => log(`  ERROR: ${e}`));
  }

  // Summary
  log('=== VERIFICATION SUMMARY ===');
  results.forEach(r => {
    log(`Step ${r.step}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.detail}`);
  });

  const allPassed = results.every(r => r.pass);
  log(`Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);

  // Write step log
  const logContent = steps.join('\n');
  writeFileSync(LOG, logContent);
  log(`Step log written to ${LOG}`);

  // Write proof of work
  const powContent = `ACTIONS TAKEN:
1. Inspected src/app/pages/home.tsx — confirmed h1[data-testid="smoke-verify-marker"] with text "KINDLING SMOKE VERIFY OK" at 3rem font-size and helper <p>
2. Confirmed no dev server running on port 4200 or 8787
3. Booted vite dev (port 5173) via "npm run dev" — confirmed listening on http://localhost:5173/
4. Installed Playwright (v1.59.1) and Chromium browser
5. Ran Playwright driver script at /tmp/verify-driver.mjs — navigated to homepage, captured screenshots at 3 checkpoints, recorded video
6. Inspected DOM assertions: h1 count, text content, data-testid, computed font-size, main children count/tags

DECISIONS:
- Decision: Used vite dev (port 5173) instead of wrangler dev since vite dev is the primary dev workflow for this project
- Decision: Used Playwright with headless Chromium (recordVideo) to capture both screenshots and .webm video as required proof
- Decision: Verified 3rem via computed style (48px at default 16px root) rather than inline style string inspection

RESULTS:
${results.map(r => `Step ${r.step}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.detail}`).join('\n')}

Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}

PROOF FILES:
- ${SCR}/01-homepage-load.png
- ${SCR}/02-main-content.png
- ${SCR}/03-heading-centered.png
- ${VID}/*.webm (captured via Playwright recordVideo)
`;
  writeFileSync(POW, powContent);
  log(`Proof of work written to ${POW}`);

  await context.close();
  await browser.close();

  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Driver error:', err);
  process.exit(1);
});
