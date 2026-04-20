import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0843-manually-verify-pr-homepage-ui-changes-8216/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0843-manually-verify-pr-homepage-ui-changes-8216/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0843-manually-verify-pr-homepage-ui-changes-8216/verification-proof/step-log.md';
const CLI_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0843-manually-verify-pr-homepage-ui-changes-8216/verification-proof/cli-transcript.log';

const now = () => new Date().toISOString();

function log(msg) {
  const entry = `[${now()}] ${msg}`;
  console.log(entry);
  fs.appendFileSync(STEP_LOG, entry + '\n');
}

async function run() {
  fs.writeFileSync(STEP_LOG, `[${now()}] Starting verification driver\n`);
  fs.writeFileSync(CLI_LOG, `[${now()}] Playwright driver started\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Step 1: Navigate to homepage
  log('Step 1: Navigating to http://localhost:5173/');
  const response = await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const status = response?.status();
  fs.appendFileSync(CLI_LOG, `[${now()}] GET / -> status: ${status}\n`);
  log(`Step 1: HTTP status ${status}`);

  // Screenshot 1: initial page load
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage-load.png`, fullPage: true });
  log('Step 1: Screenshot captured -> 01-homepage-load.png');

  // Step 2: Verify <h1> with data-testid="smoke-verify-marker" exists
  log('Step 2: Querying for <h1 data-testid="smoke-verify-marker">');
  const h1 = page.locator('h1[data-testid="smoke-verify-marker"]');
  const h1Count = await h1.count();
  fs.appendFileSync(CLI_LOG, `[${now()}] h1[data-testid="smoke-verify-marker"] count: ${h1Count}\n`);
  log(`Step 2: Found ${h1Count} matching element(s)`);

  // Step 3: Verify text content
  log('Step 3: Reading textContent of h1');
  const text = await h1.textContent();
  fs.appendFileSync(CLI_LOG, `[${now()}] h1 textContent: "${text}"\n`);
  log(`Step 3: textContent = "${text}"`);

  // Screenshot 2: heading visible
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-heading-visible.png`, fullPage: true });
  log('Step 3: Screenshot captured -> 02-heading-visible.png');

  // Step 4: Inspect <main> styles
  log('Step 4: Inspecting <main> computed styles');
  const mainBg = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).backgroundColor : null;
  });
  const mainDisplay = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).display : null;
  });
  const mainAlignItems = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).alignItems : null;
  });
  const mainJustifyContent = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).justifyContent : null;
  });
  const mainTextAlign = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).textAlign : null;
  });

  fs.appendFileSync(CLI_LOG, `[${now()}] main bg=${mainBg}, display=${mainDisplay}, alignItems=${mainAlignItems}, justifyContent=${mainJustifyContent}, textAlign=${mainTextAlign}\n`);
  log(`Step 4: background=${mainBg}, display=${mainDisplay}, alignItems=${mainAlignItems}, justifyContent=${mainJustifyContent}, textAlign=${mainTextAlign}`);

  // Step 5: Check for extra headings (h2-h6)
  log('Step 5: Checking for extra heading elements (h2-h6)');
  const extraHeadings = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6'));
    return headings.map(h => ({ tag: h.tagName, text: h.textContent?.trim() })).filter(h => h.text);
  });
  fs.appendFileSync(CLI_LOG, `[${now()}] Extra headings (h2-h6): ${JSON.stringify(extraHeadings)}\n`);
  log(`Step 5: Extra headings found: ${JSON.stringify(extraHeadings)}`);

  // Step 6: Scroll to heading and capture final screenshot
  if (h1Count === 1) {
    await h1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-heading-scrolled.png`, fullPage: true });
  log('Step 6: Final screenshot captured -> 03-heading-scrolled.png');

  log('Verification complete — closing browser');
  await context.close();
  await browser.close();
  fs.appendFileSync(CLI_LOG, `[${now()}] Browser closed, driver finished\n`);
  log('Driver finished successfully');
}

run().catch(err => {
  const msg = `[${now()}] ERROR: ${err.message}\n${err.stack}`;
  console.error(msg);
  try { fs.appendFileSync(CLI_LOG, msg + '\n'); } catch (_) {}
  process.exit(1);
});
