import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1006-verify-homepage-displays-verification-he-d854/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1006-verify-homepage-displays-verification-he-d854/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1006-verify-homepage-displays-verification-he-d854/verification-proof/step-log.md';
const URL = 'http://localhost:5174/';

const steps = [];

function log(msg) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${msg}`;
  console.log(entry);
  steps.push(entry + '\n');
}

async function main() {
  log('=== VERIFICATION SCRIPT STARTED ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Step 1: Open homepage
  log('Step 1: Navigating to ' + URL);
  const response = await page.goto(URL, { waitUntil: 'networkidle' });
  log('HTTP status: ' + response.status());
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage-loaded.png`, fullPage: true });
  log('Screenshot: 01-homepage-loaded.png');

  // Step 2: Check for exactly one <h1>
  log('Step 2: Counting <h1> elements');
  const h1Count = await page.locator('h1').count();
  log('h1 count: ' + h1Count);
  if (h1Count !== 1) {
    log('FAIL: Expected exactly 1 h1, got ' + h1Count);
  } else {
    log('PASS: Exactly 1 h1 found');
  }

  // Step 3: Check data-testid
  log('Step 3: Checking data-testid="smoke-verify-marker"');
  const marker = page.locator('[data-testid="smoke-verify-marker"]');
  const markerCount = await marker.count();
  log('data-testid="smoke-verify-marker" count: ' + markerCount);
  if (markerCount !== 1) {
    log('FAIL: Expected exactly 1 marker, got ' + markerCount);
  } else {
    log('PASS: data-testid="smoke-verify-marker" found');
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-h1-with-testid.png`, fullPage: true });
  log('Screenshot: 02-h1-with-testid.png');

  // Step 4: Check h1 text
  log('Step 4: Checking h1 text content');
  const h1Text = await page.locator('h1').textContent();
  log('h1 text: "' + h1Text + '"');
  const expectedText = 'KINDLING SMOKE VERIFY OK';
  if (h1Text === expectedText) {
    log('PASS: h1 text matches expected');
  } else {
    log('FAIL: h1 text "' + h1Text + '" !== "' + expectedText + '"');
  }

  // Step 5: Check subtitle
  log('Step 5: Checking subtitle paragraph');
  const subtitleEl = page.locator('main p');
  const subtitleCount = await subtitleEl.count();
  const subtitleText = subtitleCount > 0 ? await subtitleEl.textContent() : '';
  log('p count inside main: ' + subtitleCount);
  log('p text: "' + subtitleText + '"');
  const expectedSubtitle = 'This page replaces the starter homepage. If you are a verify agent, this is your manual-verification target.';
  if (subtitleCount === 1 && subtitleText === expectedSubtitle) {
    log('PASS: Subtitle paragraph matches');
  } else {
    log('FAIL: Subtitle mismatch');
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-subtitle-visible.png`, fullPage: true });
  log('Screenshot: 03-subtitle-visible.png');

  // Step 6: Check main background color
  log('Step 6: Checking <main> computed background');
  const mainBg = await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor);
  log('main background-color: ' + mainBg);
  // rgb(255, 251, 230) = #fffbe6
  if (mainBg === 'rgb(255, 251, 230)') {
    log('PASS: main background is rgb(255, 251, 230) = #fffbe6');
  } else {
    log('FAIL: Expected rgb(255, 251, 230), got ' + mainBg);
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-main-background.png`, fullPage: true });
  log('Screenshot: 04-main-background.png');

  // Step 7: Check h1 font size
  log('Step 7: Checking <h1> computed font size');
  const h1FontSize = await page.locator('h1').evaluate(el => getComputedStyle(el).fontSize);
  log('h1 font-size: ' + h1FontSize);
  if (h1FontSize === '48px') {
    log('PASS: h1 font-size is 48px = 3rem');
  } else {
    log('FAIL: Expected 48px, got ' + h1FontSize);
  }

  // Step 8: Check no nav, aside, or extra main elements
  log('Step 8: Checking for unwanted elements (nav, aside, extra main)');
  const navCount = await page.locator('nav').count();
  const asideCount = await page.locator('aside').count();
  const mainCount = await page.locator('main').count();
  log('nav count: ' + navCount);
  log('aside count: ' + asideCount);
  log('main count: ' + mainCount);
  if (navCount === 0 && asideCount === 0 && mainCount === 1) {
    log('PASS: No nav, no aside, exactly one main');
  } else {
    log('FAIL: Unexpected elements present');
  }

  // Final full-page screenshot
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-final-full-page.png`, fullPage: true });
  log('Screenshot: 05-final-full-page.png');

  // Write step log
  const fs = await import('fs');
  fs.writeFileSync(STEP_LOG, steps.join(''));
  log('Step log written to: ' + STEP_LOG);

  // Close context (flushes video)
  await context.close();
  await browser.close();

  log('=== VERIFICATION SCRIPT COMPLETED ===');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
