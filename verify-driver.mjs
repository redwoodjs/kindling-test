import { chromium } from 'playwright';

const SCREENSHOTS = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0702-verify-homepage-renders-smoke-message-3cc6/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0702-verify-homepage-renders-smoke-message-3cc6/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0702-verify-homepage-renders-smoke-message-3cc6/verification-proof/step-log.md';
const CLI_TRANSCRIPT = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0702-verify-homepage-renders-smoke-message-3cc6/verification-proof/cli-transcript.log';

import { writeFileSync } from 'fs';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  writeFileSync(STEP_LOG, line + '\n', { flag: 'a' });
  writeFileSync(CLI_TRANSCRIPT, line + '\n', { flag: 'a' });
}

log('=== Playwright verification driver starting ===');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_DIR },
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();

// Step 1: Navigate to homepage
log('STEP 1: Navigating to http://localhost:4173/');
const response = await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
log(`HTTP status: ${response.status()}`);

const results = {};

// Step 2: Capture initial full-page screenshot
log('STEP 2: Capturing initial full-page screenshot');
await page.screenshot({ path: `${SCREENSHOTS}/01-initial.png`, fullPage: true });
log('Screenshot saved: 01-initial.png');

// Step 3: Wait for hydration
log('STEP 3: Waiting for hydration (1s pause)');
await page.waitForTimeout(1000);

// Step 4: Verify H1 with data-testid="smoke-verify-marker" exists
log('STEP 4: Querying h1[data-testid="smoke-verify-marker"]');
const h1 = page.locator('h1[data-testid="smoke-verify-marker"]');
const h1Count = await h1.count();
log(`Found ${h1Count} matching h1 element(s)`);
results['h1_exists'] = h1Count === 1;

// Step 5: Read innerText of H1
const h1Text = await h1.innerText();
log(`H1 innerText: "${h1Text}"`);
results['h1_text'] = h1Text;
results['h1_text_matches'] = h1Text === 'KINDLING SMOKE VERIFY OK';

// Step 6: Read computed fontSize of H1
const h1FontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
log(`H1 computed fontSize: ${h1FontSize}`);
results['h1_font_size'] = h1FontSize;
const fontSizeMatch = h1FontSize.match(/^(\d+(?:\.\d+)?)/);
const fontSizeNum = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 0;
results['h1_font_size_prominent'] = fontSizeNum >= 48; // 3rem = 48px

// Step 7: Read background color of <main>
const mainBg = await page.locator('main').evaluate(el => window.getComputedStyle(el).backgroundColor);
log(`Main background color: ${mainBg}`);
results['main_bg'] = mainBg;
results['main_bg_cream'] = mainBg === 'rgb(255, 251, 230)' || mainBg === '#fffbe6';

// Step 8: Count children of <main>
const mainChildren = await page.locator('main > *').count();
log(`<main> direct children count: ${mainChildren}`);
results['main_children'] = mainChildren;
results['main_children_two'] = mainChildren === 2;

// Step 9: Check page title
const title = await page.title();
log(`Page title: "${title}"`);

// Step 10: Capture heading crop screenshot
log('STEP 10: Capturing heading crop screenshot');
await h1.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOTS}/02-heading-crop.png`, fullPage: true });
log('Screenshot saved: 02-heading-crop.png');

// Step 11: Capture main element only
log('STEP 11: Capturing main element screenshot');
const mainEl = page.locator('main');
await mainEl.scrollIntoViewIfNeeded();
await mainEl.screenshot({ path: `${SCREENSHOTS}/03-main-element.png` });
log('Screenshot saved: 03-main-element.png');

// Step 12: Final full-page screenshot
log('STEP 12: Capturing final full-page screenshot');
await page.screenshot({ path: `${SCREENSHOTS}/04-final.png`, fullPage: true });
log('Screenshot saved: 04-final.png');

// Summary
log('\n=== VERIFICATION RESULTS ===');
for (const [key, value] of Object.entries(results)) {
  log(`  ${key}: ${value}`);
}

const allPassed = Object.values(results).every(v => v === true);
log(`\nALL CHECKS PASSED: ${allPassed}`);

// Write results summary
writeFileSync('/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0702-verify-homepage-renders-smoke-message-3cc6/verification-proof/verification-results.json', JSON.stringify({ results, allPassed }, null, 2));

await context.close();
await browser.close();
log('=== Playwright verification driver complete ===');
