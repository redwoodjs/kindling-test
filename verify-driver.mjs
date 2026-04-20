import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-pr-503-homepage-changes-8e30/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-pr-503-homepage-changes-8e30/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-pr-503-homepage-changes-8e30/verification-proof/step-log.md';
const CLI_TRANSCRIPT = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1033-verify-pr-503-homepage-changes-8e30/verification-proof/cli-transcript.log';

const URL = 'http://localhost:4173/';
const EXPECTED_H1_TEXT = 'KINDLING SMOKE VERIFY OK';
const EXPECTED_TESTID = 'smoke-verify-marker';

async function logStep(log, msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  log.push(line);
  console.log(line);
}

async function run() {
  const stepLog = [];
  const transcript = [];

  const transcriptWrite = (label, content) => {
    transcript.push(`[${label}]\n${content}\n`);
  };

  try {
    await logStep(stepLog, 'LAUNCHING BROWSER');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      recordVideo: { dir: VIDEO_DIR },
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to homepage
    await logStep(stepLog, 'STEP 1: Navigating to homepage');
    const response = await page.goto(URL, { waitUntil: 'networkidle' });
    transcriptWrite('HTTP_RESPONSE', `status=${response.status()} url=${response.url()}`);
    await logStep(stepLog, `HTTP status: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${response.status()}`);
    }

    // Step 2: Screenshot initial state
    await logStep(stepLog, 'STEP 2: Capturing initial screenshot');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-initial.png`, fullPage: true });
    await logStep(stepLog, 'Screenshot saved: 01-initial.png');

    // Step 3: Assert h1 text
    await logStep(stepLog, 'STEP 3: Asserting h1 text');
    const h1Text = await page.locator('h1').textContent();
    transcriptWrite('H1_TEXT', h1Text);
    await logStep(stepLog, `h1 text: "${h1Text}"`);
    if (h1Text !== EXPECTED_H1_TEXT) {
      throw new Error(`Expected h1 text "${EXPECTED_H1_TEXT}", got "${h1Text}"`);
    }
    await logStep(stepLog, 'h1 text assertion PASSED');

    // Step 4: Assert data-testid attribute
    await logStep(stepLog, 'STEP 4: Asserting data-testid attribute');
    const testId = await page.locator('h1').getAttribute('data-testid');
    transcriptWrite('H1_DATATESTID', testId);
    await logStep(stepLog, `data-testid: "${testId}"`);
    if (testId !== EXPECTED_TESTID) {
      throw new Error(`Expected data-testid="${EXPECTED_TESTID}", got "${testId}"`);
    }
    await logStep(stepLog, 'data-testid assertion PASSED');

    // Step 5: Screenshot clean render state (after h1 assertions pass)
    await logStep(stepLog, 'STEP 5: Capturing clean render screenshot');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-h1-asserted.png`, fullPage: true });
    await logStep(stepLog, 'Screenshot saved: 02-h1-asserted.png');

    // Step 6: Assert subtitle paragraph exists
    await logStep(stepLog, 'STEP 6: Asserting subtitle paragraph');
    const paragraphs = await page.locator('main p').allTextContents();
    transcriptWrite('PARAGRAPHS_IN_MAIN', JSON.stringify(paragraphs));
    await logStep(stepLog, `Paragraphs found in <main>: ${paragraphs.length}`);
    if (paragraphs.length === 0) {
      throw new Error('Expected at least one <p> inside <main>, found none');
    }
    const subtitle = paragraphs[0];
    await logStep(stepLog, `Subtitle text: "${subtitle}"`);
    if (!subtitle || subtitle.trim().length === 0) {
      throw new Error('Subtitle paragraph is empty');
    }
    await logStep(stepLog, 'Subtitle paragraph assertion PASSED');

    // Step 7: Screenshot complete page state
    await logStep(stepLog, 'STEP 7: Capturing complete page screenshot');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-complete.png`, fullPage: true });
    await logStep(stepLog, 'Screenshot saved: 03-complete.png');

    // Step 8: Check main element background style
    await logStep(stepLog, 'STEP 8: Checking main element styles');
    const mainBg = await page.locator('main').evaluate(el => window.getComputedStyle(el).backgroundColor);
    transcriptWrite('MAIN_BG_COLOR', mainBg);
    await logStep(stepLog, `Main background-color: ${mainBg}`);
    // #fffbe6 is rgb(255, 251, 230)
    if (mainBg !== 'rgb(255, 251, 230)') {
      throw new Error(`Expected main background rgb(255, 251, 230) (#fffbe6), got ${mainBg}`);
    }
    await logStep(stepLog, 'Main background-color assertion PASSED');

    // Step 9: Final screenshot after all assertions
    await logStep(stepLog, 'STEP 9: Capturing final screenshot');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-final.png`, fullPage: true });
    await logStep(stepLog, 'Screenshot saved: 04-final.png');

    // Console errors check
    await logStep(stepLog, `CONSOLE ERRORS: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      transcriptWrite('CONSOLE_ERRORS', consoleErrors.join('\n'));
      await logStep(stepLog, 'Console errors found:');
      for (const err of consoleErrors) {
        await logStep(stepLog, `  ERROR: ${err}`);
      }
    } else {
      await logStep(stepLog, 'No console errors on page load');
    }

    // Close context (flushes video)
    await logStep(stepLog, 'CLOSING BROWSER');
    await context.close();
    await browser.close();

    // Write step log to disk
    const fs = await import('fs');
    fs.writeFileSync(STEP_LOG, stepLog.join('\n'), 'utf8');
    fs.writeFileSync(CLI_TRANSCRIPT, transcript.join('\n---\n'), 'utf8');

    await logStep(stepLog, 'VERIFICATION COMPLETE — ALL STEPS PASSED');
    console.log('\n=== ALL STEPS PASSED ===');

  } catch (err) {
    console.error(`VERIFICATION FAILED: ${err.message}`);
    // Still write step log on failure
    try {
      const fs = await import('fs');
      fs.writeFileSync(STEP_LOG, stepLog.join('\n'), 'utf8');
      fs.writeFileSync(CLI_TRANSCRIPT, transcript.join('\n---\n'), 'utf8');
    } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

run();
