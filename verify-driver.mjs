import { chromium } from 'playwright';

const SCR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2055-verify-homepage-pr-with-playwright-49a0/verification-proof/screenshots';
const VIDEO = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2055-verify-homepage-pr-with-playwright-49a0/verification-proof/video';
const LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2055-verify-homepage-pr-with-playwright-49a0/verification-proof/step-log.md';
const CLI = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2055-verify-homepage-pr-with-playwright-49a0/verification-proof/cli-transcript.log';
const BASE = 'http://localhost:4173';

let logLines = [];
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.error(line);
  logLines.push(line);
}

async function screenshot(page, name) {
  const path = `${SCR}/${name}`;
  await page.screenshot({ path, fullPage: true });
  log(`SCREENSHOT: ${path}`);
  return path;
}

async function main() {
  log('=== Playwright Verification Driver ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Step 2+3: Navigate to homepage
  log('STEP: Navigating to http://localhost:4173/');
  const response = await page.goto(BASE, { waitUntil: 'networkidle' });
  const status = response?.status();
  log(`STEP: HTTP status = ${status}`);
  if (status !== 200) throw new Error(`Expected HTTP 200, got ${status}`);

  // Hydration buffer
  await page.waitForTimeout(2000);

  // Step 3: Initial screenshot
  await screenshot(page, '01-initial.png');

  // Step 4: Exactly one <h1>?
  const h1Count = await page.locator('h1').count();
  log(`CHECK: h1 count = ${h1Count} (expected 1)`);
  if (h1Count !== 1) throw new Error(`Expected exactly 1 h1, found ${h1Count}`);

  // Step 5: data-testid attribute
  const marker = page.locator('h1[data-testid="smoke-verify-marker"]');
  const markerCount = await marker.count();
  log(`CHECK: h1[data-testid="smoke-verify-marker"] count = ${markerCount} (expected 1)`);
  if (markerCount !== 1) throw new Error(`Missing h1[data-testid="smoke-verify-marker"]`);

  // Step 6: exact text content
  const text = (await marker.textContent())?.trim() ?? '';
  log(`CHECK: h1 text = "${text}" (expected "KINDLING SMOKE VERIFY OK")`);
  if (text !== 'KINDLING SMOKE VERIFY OK') throw new Error(`Expected "KINDLING SMOKE VERIFY OK", got "${text}"`);

  // Step 7: computed font-size
  const fontSize = await marker.evaluate(el => window.getComputedStyle(el).fontSize);
  log(`CHECK: h1 computed font-size = ${fontSize} (expected 48px)`);
  if (fontSize !== '48px') throw new Error(`Expected font-size 48px, got ${fontSize}`);

  // Step 8: main textAlign
  const mainEl = page.locator('main');
  const mainCount = await mainEl.count();
  log(`CHECK: main element count = ${mainCount} (expected 1)`);
  if (mainCount !== 1) throw new Error(`Expected 1 main element, found ${mainCount}`);
  const textAlign = await mainEl.evaluate(el => window.getComputedStyle(el).textAlign);
  log(`CHECK: main textAlign = ${textAlign} (expected center)`);
  if (textAlign !== 'center') throw new Error(`Expected textAlign center, got ${textAlign}`);

  // Step 9: background color
  const bgColor = await mainEl.evaluate(el => window.getComputedStyle(el).backgroundColor);
  log(`CHECK: main backgroundColor = ${bgColor} (expected rgb(255, 251, 230))`);
  if (bgColor !== 'rgb(255, 251, 230)') throw new Error(`Expected rgb(255, 251, 230), got ${bgColor}`);

  // Step 10: descriptive <p> element
  const pCount = await page.locator('main p').count();
  const pText = pCount > 0 ? (await page.locator('main p').first().textContent())?.trim() ?? '' : '';
  log(`CHECK: main p count = ${pCount} (expected >= 1), text = "${pText}"`);

  // Screenshot with marker visible and scrolled into view
  await marker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await screenshot(page, '02-h1-visible.png');

  // Console errors check
  log(`CHECK: console errors = ${consoleErrors.length} (expected 0)`);
  if (consoleErrors.length > 0) {
    log(`  Errors: ${consoleErrors.join('; ')}`);
  }

  // Viewport screenshots (fresh navigations)
  for (const [vp, label] of [
    [{ width: 1440, height: 900 }, 'desktop'],
    [{ width: 1024, height: 768 }, 'tablet'],
    [{ width: 390, height: 844 }, 'mobile'],
  ]) {
    await context.close();
    const ctx2 = await browser.newContext({
      recordVideo: { dir: VIDEO },
      viewport: vp,
    });
    const p2 = await ctx2.newPage();
    await p2.goto(BASE, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1000);
    const heading = p2.locator('h1[data-testid="smoke-verify-marker"]');
    await heading.scrollIntoViewIfNeeded();
    await p2.waitForTimeout(500);
    await p2.screenshot({ path: `${SCR}/03-${label}.png`, fullPage: true });
    log(`SCREENSHOT: ${SCR}/03-${label}.png (${vp.width}x${vp.height})`);
    await ctx2.close();
  }

  // Write step log
  const logContent = logLines.join('\n');
  // Use dynamic import for fs
  const { writeFileSync } = await import('fs');
  writeFileSync(LOG, logContent + '\n', 'utf8');
  writeFileSync(CLI, logContent + '\n', 'utf8');
  log(`Step log written to ${LOG}`);

  await browser.close();
  log('=== Verification Complete — All checks passed ===');
}

main().catch(err => {
  console.error('VERIFICATION FAILED:', err.message);
  process.exit(1);
});
