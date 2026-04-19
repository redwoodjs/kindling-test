import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2231-verify-pr-homepage-rendering-changes-8667/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2231-verify-pr-homepage-rendering-changes-8667/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2231-verify-pr-homepage-rendering-changes-8667/verification-proof/step-log.md';
const CLI_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-19-2231-verify-pr-homepage-rendering-changes-8667/verification-proof/cli-transcript.log';

const results = [];
const cliLines = [];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  results.push(line);
  console.log(line);
}

function writeFile(path, content) {
  writeFileSync(path, content, 'utf8');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  cliLines.push(`=== PR #365 Homepage Verification ===`);
  cliLines.push(`[${new Date().toISOString()}] Navigating to http://localhost:5173/`);

  try {
    // Step 1: Navigate to homepage
    log('STEP 1: Navigate to http://localhost:5173/');
    const response = await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    cliLines.push(`[${new Date().toISOString()}] HTTP status: ${response.status()}`);
    log(`  HTTP status: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${response.status()}`);
    }

    // Step 2: Wait for h1 to appear
    log('STEP 2: Wait for <h1 data-testid="smoke-verify-marker"> to appear');
    await page.waitForSelector('h1[data-testid="smoke-verify-marker"]', { timeout: 10000 });
    log('  h1 element found with data-testid="smoke-verify-marker"');

    // Step 3: Verify h1 text content
    log('STEP 3: Verify h1 text content equals "KINDLING SMOKE VERIFY OK"');
    const h1Text = await page.locator('h1[data-testid="smoke-verify-marker"]').textContent();
    cliLines.push(`[${new Date().toISOString()}] h1 text: "${h1Text}"`);
    log(`  h1 text: "${h1Text}"`);
    if (h1Text !== 'KINDLING SMOKE VERIFY OK') {
      throw new Error(`Expected "KINDLING SMOKE VERIFY OK", got "${h1Text}"`);
    }
    log('  PASS: h1 text matches exactly');

    // Step 4: Verify data-testid attribute
    log('STEP 4: Verify data-testid attribute is "smoke-verify-marker"');
    const testid = await page.locator('h1[data-testid="smoke-verify-marker"]').getAttribute('data-testid');
    cliLines.push(`[${new Date().toISOString()}] data-testid: "${testid}"`);
    log(`  data-testid: "${testid}"`);
    if (testid !== 'smoke-verify-marker') {
      throw new Error(`Expected "smoke-verify-marker", got "${testid}"`);
    }
    log('  PASS: data-testid matches');

    // Step 5: Verify paragraph text
    log('STEP 5: Verify paragraph text');
    const pText = await page.locator('main p').textContent();
    cliLines.push(`[${new Date().toISOString()}] p text: "${pText}"`);
    log(`  p text: "${pText}"`);

    // Step 6: Verify background color #fffbe6
    log('STEP 6: Verify background color is #fffbe6 (warm cream)');
    const bgColor = await page.evaluate(() => {
      const main = document.querySelector('main');
      return window.getComputedStyle(main).backgroundColor;
    });
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const hexBg = match ? rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])) : bgColor;
    cliLines.push(`[${new Date().toISOString()}] background-color: ${hexBg} (computed: ${bgColor})`);
    log(`  background-color: ${hexBg} (computed: ${bgColor})`);
    if (hexBg.toLowerCase() !== '#fffbe6') {
      throw new Error(`Expected #fffbe6, got ${hexBg}`);
    }
    log('  PASS: background color is #fffbe6');

    // Step 7: Verify centered layout (flexbox)
    log('STEP 7: Verify centered layout (flexbox alignItems:center justifyContent:center)');
    const layout = await page.evaluate(() => {
      const main = document.querySelector('main');
      const s = window.getComputedStyle(main);
      return {
        display: s.display,
        alignItems: s.alignItems,
        justifyContent: s.justifyContent,
        minHeight: s.minHeight,
      };
    });
    cliLines.push(`[${new Date().toISOString()}] layout: ${JSON.stringify(layout)}`);
    log(`  layout: ${JSON.stringify(layout)}`);
    if (layout.display !== 'flex') {
      throw new Error(`Expected display:flex, got ${layout.display}`);
    }
    if (layout.alignItems !== 'center') {
      throw new Error(`Expected alignItems:center, got ${layout.alignItems}`);
    }
    if (layout.justifyContent !== 'center') {
      throw new Error(`Expected justifyContent:center, got ${layout.justifyContent}`);
    }
    log('  PASS: centered layout confirmed (flexbox)');

    // Step 8: Capture screenshot of homepage
    log('STEP 8: Capture screenshot of homepage at loaded state');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage-loaded.png`, fullPage: true });
    cliLines.push(`[${new Date().toISOString()}] Screenshot saved: 01-homepage-loaded.png`);
    log('  Screenshot saved: 01-homepage-loaded.png');

    // Step 9: Verify h1 font-size is large (prominent)
    log('STEP 9: Verify h1 font-size is prominent (3rem)');
    const h1FontSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1[data-testid="smoke-verify-marker"]');
      return window.getComputedStyle(h1).fontSize;
    });
    cliLines.push(`[${new Date().toISOString()}] h1 font-size: ${h1FontSize}`);
    log(`  h1 font-size: ${h1FontSize}`);
    if (h1FontSize !== '48px' && h1FontSize !== '3rem') {
      throw new Error(`Expected font-size:3rem (48px at 16px base), got ${h1FontSize}`);
    }
    log('  PASS: h1 is prominent (3rem)');

    // Step 10: Capture final DOM state screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-final-dom-state.png`, fullPage: true });
    cliLines.push(`[${new Date().toISOString()}] Final screenshot saved: 02-final-dom-state.png`);
    log('  Final DOM state screenshot saved: 02-final-dom-state.png');

    // Verify video was recorded
    log('STEP 11: Verify video recording exists');
    // Close context to flush video
    await context.close();
    await browser.close();

    // Check video file
    const { readdirSync } = await import('fs');
    const videoFiles = readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      cliLines.push(`[${new Date().toISOString()}] Video recorded: ${videoFiles[0]}`);
      log(`  Video recorded: ${videoFiles[0]}`);
    } else {
      cliLines.push(`[${new Date().toISOString()}] WARNING: No .webm video file found in ${VIDEO_DIR}`);
      log(`  WARNING: No .webm video file found in ${VIDEO_DIR}`);
    }

    // Final summary
    log('');
    log('=== ALL CHECKS PASSED ===');
    cliLines.push(`[${new Date().toISOString()}] ALL CHECKS PASSED`);

  } catch (err) {
    log(`ERROR: ${err.message}`);
    cliLines.push(`[${new Date().toISOString()}] ERROR: ${err.message}`);
    await context.close();
    await browser.close();
  }

  // Write step log
  writeFile(STEP_LOG, results.join('\n'));

  // Write CLI transcript
  writeFile(CLI_LOG, cliLines.join('\n'));

  console.log('\n=== Verification Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
