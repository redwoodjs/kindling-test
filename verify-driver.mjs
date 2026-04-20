import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0955-playwright-verification-of-homepage-2adc/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0955-playwright-verification-of-homepage-2adc/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0955-playwright-verification-of-homepage-2adc/verification-proof/step-log.md';
const BASE_URL = 'http://localhost:8787';

const results = {
  steps: [],
  checks: [],
  errors: []
};

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
}

async function run() {
  log('=== Starting verification ===');

  // Launch browser - use full chromium for better ALSA compatibility
  log('Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  log('Browser launched successfully');

  // Create context with video recording
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 }
  });
  log('Browser context created with video recording');

  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Step 1: Navigate to homepage
  log('Step 1: Navigating to homepage...');
  const response = await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  const status = response.status();
  log(`HTTP status: ${status}`);
  results.steps.push({ step: 1, action: 'Navigate to homepage', result: status === 200 ? 'PASS' : 'FAIL', details: `HTTP ${status}` });
  results.checks.push({ item: 'Dev server boots and / returns HTTP 200', passed: status === 200 });

  // Step 2: Wait for page load
  await page.waitForLoadState('domcontentloaded');
  log('Step 2: Page DOM loaded');
  results.steps.push({ step: 2, action: 'Wait for page DOM load', result: 'PASS', details: 'DOM content loaded' });

  // Step 3: Check for h1 with testid
  log('Step 3: Checking for h1[data-testid="smoke-verify-marker"]...');
  const h1 = await page.locator('h1[data-testid="smoke-verify-marker"]');
  const h1Exists = await h1.count() > 0;
  log(`h1 exists: ${h1Exists}`);
  results.steps.push({ step: 3, action: 'Check h1[data-testid="smoke-verify-marker"] exists', result: h1Exists ? 'PASS' : 'FAIL' });
  results.checks.push({ item: 'h1[data-testid="smoke-verify-marker"] exists', passed: h1Exists });

  // Step 4: Check h1 text
  log('Step 4: Checking h1 text content...');
  const h1Text = h1Exists ? await h1.innerText() : '';
  const textMatches = h1Text === 'KINDLING SMOKE VERIFY OK';
  log(`h1 text: "${h1Text}" (expected: "KINDLING SMOKE VERIFY OK")`);
  results.steps.push({ step: 4, action: 'Check h1 innerText', result: textMatches ? 'PASS' : 'FAIL', details: `Got "${h1Text}"` });
  results.checks.push({ item: 'h1 innerText equals "KINDLING SMOKE VERIFY OK"', passed: textMatches });

  // Step 5: Capture screenshot of heading
  log('Step 5: Capturing screenshot of heading...');
  await h1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/step-01-heading-visible.png`, fullPage: true });
  log('Screenshot saved: step-01-heading-visible.png');
  results.steps.push({ step: 5, action: 'Capture screenshot of heading', result: 'PASS' });
  results.checks.push({ item: 'Screenshot step-01-heading-visible.png captured', passed: true });

  // Step 6: Check background color
  log('Step 6: Checking background color...');
  const bgColor = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? getComputedStyle(main).backgroundColor : null;
  });
  const expectedBg = 'rgb(255, 251, 230)';
  const bgMatches = bgColor === expectedBg;
  log(`Background color: ${bgColor} (expected: ${expectedBg})`);
  results.steps.push({ step: 6, action: 'Check main background color', result: bgMatches ? 'PASS' : 'FAIL', details: `${bgColor}` });
  results.checks.push({ item: 'main background is #fffbe6', passed: bgMatches });

  // Step 7: Count paragraphs
  log('Step 7: Counting p elements in main...');
  const paragraphCount = await page.locator('main p').count();
  const oneParagraph = paragraphCount === 1;
  log(`Paragraph count: ${paragraphCount} (expected: 1)`);
  results.steps.push({ step: 7, action: 'Count p elements in main', result: oneParagraph ? 'PASS' : 'FAIL', details: `Count: ${paragraphCount}` });
  results.checks.push({ item: 'Exactly one p inside main', passed: oneParagraph });

  // Step 8: Count main children
  log('Step 8: Counting direct children of main...');
  const mainChildrenCount = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.children.length : 0;
  });
  const twoChildren = mainChildrenCount === 2;
  log(`Main children count: ${mainChildrenCount} (expected: 2)`);
  results.steps.push({ step: 8, action: 'Count main direct children', result: twoChildren ? 'PASS' : 'FAIL', details: `Count: ${mainChildrenCount}` });
  results.checks.push({ item: 'main has exactly 2 direct children', passed: twoChildren });

  // Step 9: Capture screenshot of layout
  log('Step 9: Capturing screenshot of full layout...');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/step-02-clean-layout.png`, fullPage: true });
  log('Screenshot saved: step-02-clean-layout.png');
  results.steps.push({ step: 9, action: 'Capture screenshot of layout', result: 'PASS' });
  results.checks.push({ item: 'Screenshot step-02-clean-layout.png captured', passed: true });

  // Step 10: Check no Welcome component
  log('Step 10: Checking for absence of Welcome component...');
  const welcomeExists = await page.locator('[data-testid*="welcome"], .welcome, #welcome, [class*="welcome"]').count() > 0;
  const noWelcome = !welcomeExists;
  log(`Welcome component present: ${welcomeExists} (expected: false)`);
  results.steps.push({ step: 10, action: 'Check Welcome component absent', result: noWelcome ? 'PASS' : 'FAIL' });
  results.checks.push({ item: 'No Welcome component present', passed: noWelcome });

  // Step 11: Check console errors
  log('Step 11: Checking console errors...');
  const noErrors = consoleErrors.length === 0;
  log(`Console errors: ${consoleErrors.length} (expected: 0)`);
  results.steps.push({ step: 11, action: 'Check browser console for errors', result: noErrors ? 'PASS' : 'FAIL', details: `Errors: ${consoleErrors.length}` });
  results.checks.push({ item: 'No browser console errors', passed: noErrors });

  // Write step log
  log('Writing step log...');
  const stepLogContent = `# Verification Step Log
Date: ${new Date().toISOString()}
URL: ${BASE_URL}

## Steps Executed
${results.steps.map(s => `- Step ${s.step}: ${s.action} -- ${s.result}${s.details ? ` (${s.details})` : ''}`).join('\n')}

## Console Errors
${consoleErrors.length === 0 ? 'None' : consoleErrors.map(e => `- ${e}`).join('\n')}
`;
  writeFileSync(STEP_LOG, stepLogContent);

  // Close context (flushes video)
  log('Closing browser context to flush video...');
  await context.close();
  await browser.close();

  log('=== Verification complete ===');

  // Print summary
  console.log('\n=== RESULTS SUMMARY ===');
  console.log(`Total steps: ${results.steps.length}`);
  console.log(`Passed: ${results.steps.filter(s => s.result === 'PASS').length}`);
  console.log(`Failed: ${results.steps.filter(s => s.result === 'FAIL').length}`);
  console.log(`\nChecks:`);
  results.checks.forEach(c => console.log(`  ${c.passed ? '✓' : '✗'} ${c.item}`));
}

run().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
