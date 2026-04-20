import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { createWriteStream } from 'fs';

const SCREENSHOTS_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0959-verify-pr-467-homepage-with-playwright-22a5/verification-proof/screenshots';
const VIDEO_DIR = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0959-verify-pr-467-homepage-with-playwright-22a5/verification-proof/video';
const STEP_LOG = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0959-verify-pr-467-homepage-with-playwright-22a5/verification-proof/step-log.md';
const PROOF_OF_WORK = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-0959-verify-pr-467-homepage-with-playwright-22a5/verification-proof/proof-of-work.md';

const PREVIEW_URL = 'http://localhost:4173/';
const HEALTH_URL = 'http://localhost:4173/health';
const PING_URL = 'http://localhost:4173/ping';

const steps = [];
const observations = [];

function log(step, msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] STEP ${step}: ${msg}`;
  observations.push(line);
  console.log(line);
}

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

// STEP 1: Navigate to homepage
log(1, 'Navigating to homepage at ' + PREVIEW_URL);
let response;
try {
  response = await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
} catch (e) {
  log(1, `ERROR: Page navigation failed: ${e.message}`);
  await context.close();
  await browser.close();
  process.exit(1);
}
const status = response ? response.status() : 'no response';
log(1, `Page response status: ${status}`);

// STEP 2: Wait a moment for any hydration
await page.waitForTimeout(1000);
log(2, 'Page loaded, waiting for hydration...');

// STEP 3: Snapshot DOM before interaction
const bodyHTML = await page.evaluate(() => document.body.innerHTML);
log(3, `DOM snapshot captured (${bodyHTML.length} chars). Body HTML:\n${bodyHTML.substring(0, 500)}...`);

// STEP 4: Screenshot 1 - Full page load
await page.screenshot({ path: `${SCREENSHOTS_DIR}/homepage-load.png`, fullPage: true });
log(4, 'Screenshot captured: homepage-load.png');

// STEP 5: Observe heading presence
const h1Locator = page.locator('h1');
const h1Count = await h1Locator.count();
log(5, `H1 elements found: ${h1Count}`);

let h1Text = '';
let h1DataTestid = '';
let h1FontSize = '';
if (h1Count > 0) {
  h1Text = (await h1Locator.first().textContent()).trim();
  log(5, `H1 text content: "${h1Text}"`);
  h1DataTestid = await h1Locator.first().getAttribute('data-testid');
  log(5, `H1 data-testid: "${h1DataTestid}"`);
  h1FontSize = await h1Locator.first().evaluate(el => window.getComputedStyle(el).fontSize);
  log(5, `H1 computed fontSize: "${h1FontSize}"`);
} else {
  log(5, 'WARNING: No h1 element found');
}

// STEP 6: Observe main element
const mainLocator = page.locator('main');
const mainCount = await mainLocator.count();
log(6, `main elements found: ${mainCount}`);

let mainBackground = '';
let mainDisplay = '';
let mainAlignItems = '';
let mainJustifyContent = '';
let mainMinHeight = '';
if (mainCount > 0) {
  mainBackground = await mainLocator.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
  mainDisplay = await mainLocator.first().evaluate(el => window.getComputedStyle(el).display);
  mainAlignItems = await mainLocator.first().evaluate(el => window.getComputedStyle(el).alignItems);
  mainJustifyContent = await mainLocator.first().evaluate(el => window.getComputedStyle(el).justifyContent);
  mainMinHeight = await mainLocator.first().evaluate(el => window.getComputedStyle(el).minHeight);
  log(6, `main computed styles: backgroundColor=${mainBackground}, display=${mainDisplay}, alignItems=${mainAlignItems}, justifyContent=${mainJustifyContent}, minHeight=${mainMinHeight}`);
}

// STEP 7: Observe main element children (verify only h1 and one p)
const mainChildren = await mainLocator.first().evaluate(el => {
  return Array.from(el.children).map(c => ({ tag: c.tagName, text: c.textContent?.substring(0, 80) }));
});
log(7, `main children: ${JSON.stringify(mainChildren)}`);

// STEP 8: Observe paragraph text
const pLocator = page.locator('main p');
const pCount = await pLocator.count();
log(8, `Paragraphs in main: ${pCount}`);
let pText = '';
if (pCount > 0) {
  pText = (await pLocator.first().textContent()).trim();
  log(8, `Paragraph text: "${pText}"`);
}

// STEP 9: Screenshot 2 - Heading detail
await page.locator('h1').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOTS_DIR}/homepage-heading-detail.png`, fullPage: true });
log(9, 'Screenshot captured: homepage-heading-detail.png');

// STEP 10: Check for Welcome remnants
const welcomeText = await page.locator('text=/welcome/i').count();
log(10, `Welcome text matches found: ${welcomeText} (should be 0)`);

// STEP 11: Check health endpoint
log(11, 'Checking /health endpoint...');
let healthStatus = 'unknown';
let healthBody = '';
try {
  const healthResp = await page.request.get(HEALTH_URL);
  healthStatus = healthResp.status();
  healthBody = await healthResp.text();
  log(11, `/health status: ${healthStatus}, body: ${healthBody}`);
} catch (e) {
  log(11, `ERROR checking /health: ${e.message}`);
}

// STEP 12: Check ping endpoint
log(12, 'Checking /ping endpoint...');
let pingStatus = 'unknown';
let pingBody = '';
try {
  const pingResp = await page.request.get(PING_URL);
  pingStatus = pingResp.status();
  pingBody = await pingResp.text();
  log(12, `/ping status: ${pingStatus}, body: ${pingBody}`);
} catch (e) {
  log(12, `ERROR checking /ping: ${e.message}`);
}

// STEP 13: Console errors
log(13, `Console errors during page load: ${consoleErrors.length}`);
consoleErrors.forEach(e => log(13, `  ERROR: ${e}`));

// STEP 14: Final DOM record
const finalBodyHTML = await page.evaluate(() => document.body.innerHTML);
log(14, `Final DOM snapshot (${finalBodyHTML.length} chars). Changed: ${finalBodyHTML !== bodyHTML}`);

await context.close();
await browser.close();

// Write step log
await writeFile(STEP_LOG, observations.join('\n'), 'utf8');
log(0, `Step log written to ${STEP_LOG}`);

// Write proof of work
const powContent = `PROOF OF WORK — PR #467 Homepage Verification
==============================================

ACTIONS TAKEN:
1. Ran \`npm run build\` — succeeded (vite build, exit 0)
2. Started \`npm run preview\` on port 4173 — confirmed HTTP 200
3. Installed Playwright Chromium via \`npx playwright install chromium\`
4. Ran Playwright driver script navigating to http://localhost:4173/
5. Captured 2 screenshots: homepage-load.png, homepage-heading-detail.png
6. Captured video via Playwright recordVideo
7. Inspected DOM for h1 element, main styles, child count
8. Verified /health and /ping endpoints

KEY OBSERVATIONS:
- H1 count: ${h1Count}
- H1 text: "${h1Text}"
- H1 data-testid: "${h1DataTestid}"
- H1 fontSize: "${h1FontSize}"
- main display: "${mainDisplay}"
- main alignItems: "${mainAlignItems}"
- main justifyContent: "${mainJustifyContent}"
- main minHeight: "${mainMinHeight}"
- main backgroundColor: "${mainBackground}"
- main children: ${JSON.stringify(mainChildren)}
- p count in main: ${pCount}
- p text: "${pText}"
- Welcome remnants found: ${welcomeText}
- /health status: ${healthStatus}, body: ${healthBody}
- /ping status: ${pingStatus}, body: ${pingBody}
- Console errors: ${consoleErrors.length}
- DOM changed after hydration: ${finalBodyHTML !== bodyHTML}

DECISIONS:
- Used vite preview (not dev server) per Cloudflare Workers/rwsdk project convention
- Used Playwright headless Chromium at 1280x720 viewport
- Captured full-page screenshots and Playwright recordVideo for proof
- Checked /health and /ping as sanity checks for build integrity
`;
await writeFile(PROOF_OF_WORK, powContent, 'utf8');
log(0, `Proof of work written to ${PROOF_OF_WORK}`);

console.log('\n=== VERIFICATION SUMMARY ===');
console.log(`H1 present: ${h1Count === 1}`);
console.log(`H1 text correct: ${h1Text === 'KINDLING SMOKE VERIFY OK'}`);
console.log(`H1 data-testid: ${h1DataTestid}`);
console.log(`H1 fontSize: ${h1FontSize}`);
console.log(`main display flex: ${mainDisplay === 'flex'}`);
console.log(`main alignItems center: ${mainAlignItems === 'center'}`);
console.log(`main justifyContent center: ${mainJustifyContent === 'center'}`);
console.log(`main minHeight: ${mainMinHeight}`);
console.log(`main background: ${mainBackground}`);
console.log(`main children count: ${mainChildren.length}`);
console.log(`p count: ${pCount}`);
console.log(`p text includes expected: ${pText.includes('This page replaces the starter homepage')}`);
console.log(`Welcome remnants: ${welcomeText}`);
console.log(`/health: ${healthStatus}`);
console.log(`/ping: ${pingStatus}`);
console.log(`Console errors: ${consoleErrors.length}`);
