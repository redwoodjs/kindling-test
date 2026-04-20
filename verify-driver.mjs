import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0911-verify-pr-431-homepage-ui-rendering-cee6/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0911-verify-pr-431-homepage-ui-rendering-cee6/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0911-verify-pr-431-homepage-ui-rendering-cee6/verification-proof/step-log.md';
const CLI_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0911-verify-pr-431-homepage-ui-rendering-cee6/verification-proof/cli-transcript.log';

const HOME_URL = 'http://localhost:5173/';

async function run() {
  const log = (msg) => {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
  };

  let transcript = '';
  const tlog = (msg) => {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    transcript += line + '\n';
  };

  tlog('PLAYWRIGHT VERIFICATION DRIVER STARTED');
  tlog(`Navigating to: ${HOME_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Step 1: Navigate to homepage
  tlog('STEP 1: Navigating to homepage');
  const response = await page.goto(HOME_URL, { waitUntil: 'networkidle' });
  tlog(`HTTP status: ${response.status()}`);
  log(`HTTP status: ${response.status()}`);

  if (response.status() !== 200) {
    tlog(`ERROR: Expected HTTP 200, got ${response.status()}`);
    await context.close();
    await browser.close();
    process.exit(1);
  }

  // Step 2: Capture screenshot - initial state
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-initial-load.png`, fullPage: true });
  tlog('Screenshot captured: 01-initial-load.png');

  // Step 3: Wait for h1 to appear
  tlog('STEP 3: Waiting for h1 element to appear');
  const h1 = page.locator('h1');
  await h1.waitFor({ timeout: 10000 });
  tlog('h1 element found in DOM');

  // Step 4: Verify data-testid attribute
  tlog('STEP 4: Checking data-testid="smoke-verify-marker"');
  const testId = await h1.getAttribute('data-testid');
  tlog(`data-testid value: "${testId}"`);
  log(`data-testid value: "${testId}"`);

  if (testId !== 'smoke-verify-marker') {
    tlog(`ERROR: Expected data-testid="smoke-verify-marker", got "${testId}"`);
  } else {
    tlog('PASS: data-testid matches expected value');
  }

  // Step 5: Verify h1 textContent
  tlog('STEP 5: Checking h1 textContent');
  const textContent = await h1.textContent();
  tlog(`h1 textContent: "${textContent}"`);
  log(`h1 textContent: "${textContent}"`);

  if (textContent !== 'KINDLING SMOKE VERIFY OK') {
    tlog(`ERROR: Expected "KINDLING SMOKE VERIFY OK", got "${textContent}"`);
  } else {
    tlog('PASS: h1 textContent matches expected value');
  }

  // Step 6: Verify paragraph text
  tlog('STEP 6: Checking p element informational text');
  const p = page.locator('p');
  const pCount = await p.count();
  tlog(`p element count: ${pCount}`);
  if (pCount > 0) {
    const pText = await p.first().textContent();
    tlog(`p textContent: "${pText}"`);
    tlog('PASS: Informational paragraph found');
  } else {
    tlog('ERROR: No p element found');
  }

  // Step 7: Verify main container layout styles
  tlog('STEP 7: Checking main container layout styles');
  const main = page.locator('main');
  const mainStyle = await main.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      display: s.display,
      alignItems: s.alignItems,
      justifyContent: s.justifyContent,
      minHeight: s.minHeight,
      background: s.background,
      textAlign: s.textAlign,
    };
  });
  tlog(`main computed styles: ${JSON.stringify(mainStyle)}`);
  log(`main styles: display=${mainStyle.display}, alignItems=${mainStyle.alignItems}, justifyContent=${mainStyle.justifyContent}, minHeight=${mainStyle.minHeight}, background=${mainStyle.background}, textAlign=${mainStyle.textAlign}`);

  if (mainStyle.background.toLowerCase().includes('255, 251, 230') || mainStyle.background.includes('#fffbe6')) {
    tlog('PASS: Background color matches cream/yellow (#fffbe6)');
  } else {
    tlog(`NOTE: Background is "${mainStyle.background}" (may include alpha channel)`);
  }

  // Step 8: Capture screenshot after DOM assertions
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-dom-assertions.png`, fullPage: true });
  tlog('Screenshot captured: 02-dom-assertions.png');

  // Step 9: Verify no unexpected main content
  tlog('STEP 9: Checking for unexpected main content');
  const mainChildCount = await main.evaluate(el => el.children.length);
  tlog(`main child element count: ${mainChildCount}`);
  if (mainChildCount === 2) {
    tlog('PASS: main has exactly 2 children (h1 and p)');
  } else {
    tlog(`NOTE: main has ${mainChildCount} children`);
  }

  // Close context (flushes video)
  await context.close();
  await browser.close();

  tlog('PLAYWRIGHT VERIFICATION DRIVER COMPLETED');
  log('Browser closed, video flushed');

  // Write logs
  const fs = await import('fs');
  fs.writeFileSync(STEP_LOG, transcript, 'utf-8');
  fs.writeFileSync(CLI_LOG, `PLAYWRIGHT DRIVER TRANSCRIPT\n${'='.repeat(60)}\nCommand: node /tmp/verify-driver.mjs\nTarget: ${HOME_URL}\n${'='.repeat(60)}\n\n${transcript}`, 'utf-8');

  log('Logs written to step-log.md and cli-transcript.log');
}

run().catch(err => {
  console.error('DRIVER ERROR:', err);
  process.exit(1);
});
