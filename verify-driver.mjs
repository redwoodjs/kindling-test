import { chromium } from 'playwright';
import { appendFileSync, writeFileSync } from 'fs';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0619-verify-pr-homepage-changes-e1c5/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0619-verify-pr-homepage-changes-e1c5/verification-proof/video';
const LOG_FILE = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0619-verify-pr-homepage-changes-e1c5/verification-proof/cli-transcript.log';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0619-verify-pr-homepage-changes-e1c5/verification-proof/step-log.md';
const URL = 'http://localhost:4174/';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(STEP_LOG, line + '\n');
}

const results = {};

(async () => {
  let browser;
  try {
    log('Launching Chromium browser (headless)...');
    browser = await chromium.launch({ headless: true });
    log('Browser launched successfully.');

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
        log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Step 2: Navigate
    log(`Navigating to ${URL}...`);
    const response = await page.goto(URL, { waitUntil: 'networkidle' });
    const status = response ? response.status() : 'no-response';
    results['http_status'] = status;
    log(`HTTP response status: ${status}`);

    // Step 3: Full-page screenshot
    log('Capturing full-page screenshot...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/verify_homepage_full.png`, fullPage: true });
    log('Full-page screenshot saved.');

    // Step 4: DOM check — marker element
    log('Checking for [data-testid="smoke-verify-marker"]...');
    const markerCount = await page.locator('[data-testid="smoke-verify-marker"]').count();
    results['marker_count'] = markerCount;
    log(`Marker element count: ${markerCount}`);

    if (markerCount === 1) {
      const markerTag = await page.locator('[data-testid="smoke-verify-marker"]').evaluate(el => el.tagName);
      const markerText = await page.locator('[data-testid="smoke-verify-marker"]').innerText();
      results['marker_tag'] = markerTag;
      results['marker_text'] = markerText;
      log(`Marker tag: ${markerTag}, text: "${markerText}"`);
    } else {
      log(`ERROR: Expected 1 marker element, found ${markerCount}`);
    }

    // Step 5: DOM check — page structure
    log('Checking page structure (main element)...');
    const mainCount = await page.locator('main').count();
    results['main_count'] = mainCount;
    log(`<main> element count: ${mainCount}`);

    if (mainCount === 1) {
      const mainChildren = await page.locator('main').evaluate(el =>
        Array.from(el.children).map(c => ({ tag: c.tagName, text: c.innerText.substring(0, 80) }))
      );
      results['main_children'] = mainChildren;
      log(`<main> children: ${JSON.stringify(mainChildren)}`);

      const h1Count = await page.locator('main h1').count();
      results['main_h1_count'] = h1Count;
      log(`<h1> count inside <main>: ${h1Count}`);

      const pCount = await page.locator('main p').count();
      results['main_p_count'] = pCount;
      log(`<p> count inside <main>: ${pCount}`);
    }

    // Step 6: Visual check — computed styles
    log('Checking computed styles...');

    if (markerCount === 1) {
      const h1Styles = await page.locator('[data-testid="smoke-verify-marker"]').evaluate(el => {
        const cs = window.getComputedStyle(el);
        return { fontSize: cs.fontSize, textAlign: cs.textAlign };
      });
      results['h1_font_size'] = h1Styles.fontSize;
      results['h1_text_align'] = h1Styles.textAlign;
      log(`<h1> font-size: ${h1Styles.fontSize}, text-align: ${h1Styles.textAlign}`);
    }

    if (mainCount === 1) {
      const mainStyles = await page.locator('main').evaluate(el => {
        const cs = window.getComputedStyle(el);
        return { backgroundColor: cs.backgroundColor };
      });
      results['main_bg'] = mainStyles.backgroundColor;
      log(`<main> background-color: ${mainStyles.backgroundColor}`);
    }

    // Marker screenshot
    log('Capturing marker screenshot...');
    try {
      await page.locator('[data-testid="smoke-verify-marker"]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    } catch (e) {
      log(`scrollIntoViewIfNeeded: ${e.message}`);
    }
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/verify_homepage_marker.png`, fullPage: true });
    log('Marker screenshot saved.');

    // Step 7: Clean load / console errors
    log('Refreshing page to check for console errors...');
    const consoleErrorsBefore = [...consoleErrors];
    await page.reload({ waitUntil: 'networkidle' });
    const consoleErrorsAfter = [...consoleErrors];
    const newErrors = consoleErrorsAfter.filter(e => !consoleErrorsBefore.includes(e));
    results['console_errors'] = newErrors;
    log(`Console errors after refresh: ${JSON.stringify(newErrors)}`);

    // Final summary
    log('\n=== VERIFICATION SUMMARY ===');
    log(JSON.stringify(results, null, 2));

    // Write results to file
    writeFileSync(LOG_FILE, JSON.stringify(results, null, 2) + '\n');

    await context.close();
    await browser.close();
    log('Browser closed.');
  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(`Stack: ${err.stack}`);
    writeFileSync(LOG_FILE, `ERROR: ${err.message}\n${err.stack}\n`);
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
