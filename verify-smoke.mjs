import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Navigate to the homepage
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

// ── Check the smoke-verify h1 ──────────────────────────────────────────────
const h1 = page.locator('h1[data-testid="smoke-verify-marker"]');
const h1Text = await h1.textContent();
const testid = await h1.getAttribute('data-testid');
console.log('✅ H1 text:', h1Text?.trim());
console.log('✅ H1 data-testid:', testid);

// ── Check background color (should be the yellow-cream #fffbe6) ────────────
const bgColor = await page.evaluate(() => {
  return window.getComputedStyle(document.querySelector('main')).backgroundColor;
});
console.log('✅ Main background color (rgb):', bgColor);

// ── Check old Welcome component is NOT present ─────────────────────────────
const welcomePresent = await page.locator('.welcome, [class*="welcome"]').count();
console.log('✅ Old Welcome element present:', welcomePresent > 0 ? 'YES (FAIL)' : 'NO (correct)');

// ── Page title ──────────────────────────────────────────────────────────────
const title = await page.title();
console.log('✅ Page title:', title);

// ── Full body text ─────────────────────────────────────────────────────────
const bodyText = await page.textContent('body');
console.log('✅ Body text snippet:', bodyText?.trim().slice(0, 300));

// ── Verify only one h1 ─────────────────────────────────────────────────────
const h1Count = await page.locator('h1').count();
console.log('✅ H1 count:', h1Count, '(expected 1)');

// ── Screenshot ─────────────────────────────────────────────────────────────
await page.screenshot({ path: '/home/vscode/repo/homepage-screenshot.png', fullPage: true });
console.log('✅ Screenshot saved → /home/vscode/repo/homepage-screenshot.png');

await browser.close();
console.log('Done.');
