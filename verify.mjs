import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Navigating to http://localhost:4173/ ...');
const response = await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
console.log('HTTP status:', response.status());

// Wait for hydration
await page.waitForTimeout(2000);

// Check page title
const title = await page.title();
console.log('Page title:', title);

// Check for the marker heading
const heading = await page.locator('h1[data-testid="smoke-verify-marker"]').textContent();
console.log('Heading text:', heading);

// Check the body background color
const bodyBg = await page.evaluate(() => {
  return window.getComputedStyle(document.body).backgroundColor;
});
console.log('Body background:', bodyBg);

// Check all h1 elements
const h1s = await page.locator('h1').allTextContents();
console.log('All h1 text contents:', h1s);

// Take screenshot
await page.screenshot({ path: '/tmp/homepage.png', fullPage: true });
console.log('Screenshot saved to /tmp/homepage.png');

await browser.close();
console.log('Done.');
