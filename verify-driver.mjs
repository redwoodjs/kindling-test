import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0949-playwright-verify-homepage-heading-e2a1/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0949-playwright-verify-homepage-heading-e2a1/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0949-playwright-verify-homepage-heading-e2a1/verification-proof/step-log.md';

const log = (msg) => {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(STEP_LOG, line + '\n');
};

log('Starting Playwright verification driver');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_DIR },
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

// Capture console errors
page.on('console', msg => {
  log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
});

// Step 1: Navigate to homepage
log('Step 1: Navigating to http://localhost:5173/');
const response = await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
log(`Response status: ${response.status()}`);
log(`Response URL: ${response.url()}`);

// Step 2: Capture initial screenshot
log('Step 2: Capturing initial screenshot');
await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage-loaded.png`, fullPage: true });
log('Screenshot saved: 01-homepage-loaded.png');

// Step 3: Inspect h1 elements
log('Step 3: Inspecting h1 elements');
const h1s = await page.locator('h1').all();
log(`Found ${h1s.length} <h1> element(s)`);

for (let i = 0; i < h1s.length; i++) {
  const h1 = h1s[i];
  const text = await h1.textContent();
  const dataTestid = await h1.getAttribute('data-testid');
  const visible = await h1.isVisible();
  log(`  h1[${i}]: text="${text}", data-testid="${dataTestid}", visible=${visible}`);
}

// Step 4: Check for the specific smoke-verify-marker heading
log('Step 4: Checking for smoke-verify-marker heading');
const markerH1 = page.locator('h1[data-testid="smoke-verify-marker"]');
const markerCount = await markerH1.count();
log(`Found ${markerCount} <h1 data-testid="smoke-verify-marker"> element(s)`);

if (markerCount > 0) {
  const markerText = await markerH1.textContent();
  const markerVisible = await markerH1.isVisible();
  log(`  Marker text: "${markerText}"`);
  log(`  Marker visible: ${markerVisible}`);
}

// Step 5: Inspect main content
log('Step 5: Inspecting <main> element');
const mainEl = page.locator('main');
const mainCount = await mainEl.count();
log(`Found ${mainCount} <main> element(s)`);

if (mainCount > 0) {
  const mainHTML = await mainEl.innerHTML();
  const mainText = await mainEl.textContent();
  log(`  <main> innerHTML (first 300 chars): ${mainHTML.substring(0, 300)}`);
  log(`  <main> textContent length: ${mainText.trim().length} chars`);
  log(`  <main> textContent: "${mainText.trim()}"`);
}

// Step 6: Count all visible text content on the page
log('Step 6: Checking page body text content');
const bodyText = await page.locator('body').textContent();
log(`Body text content (${bodyText.trim().length} chars): "${bodyText.trim()}"`);

// Step 7: Capture screenshot focused on main content
log('Step 7: Capturing main content screenshot');
await mainEl.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-main-content.png`, fullPage: true });
log('Screenshot saved: 02-main-content.png');

// Step 8: Capture screenshot showing the h1 marker
log('Step 8: Capturing heading marker screenshot');
await markerH1.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-h1-marker.png`, fullPage: true });
log('Screenshot saved: 03-h1-marker.png');

// Step 9: Verify page body innerText
log('Step 9: Checking body innerText');
const bodyInnerText = await page.evaluate(() => document.body.innerText);
log(`Body innerText: "${bodyInnerText}"`);

// Step 10: DOM snapshot of main
log('Step 10: DOM snapshot of main');
if (mainCount > 0) {
  const mainSnapshot = await mainEl.innerHTML();
  fs.writeFileSync(`${SCREENSHOTS_DIR}/main-dom-snapshot.html`, mainSnapshot);
  log('DOM snapshot saved: main-dom-snapshot.html');
}

// Close context to flush video
log('Closing browser context (flushes video)');
await context.close();
await browser.close();

log('Verification driver complete');

// Summary
log('=== VERIFICATION SUMMARY ===');
log(`h1 count: ${h1s.length}`);
log(`smoke-verify-marker count: ${markerCount}`);
if (markerCount > 0) {
  const finalMarkerText = await page.evaluate(() => {
    const el = document.querySelector('h1[data-testid="smoke-verify-marker"]');
    return el ? el.textContent : null;
  });
  log(`smoke-verify-marker text: "${finalMarkerText}"`);
}
log(`Page body text: "${bodyText.trim()}"`);
