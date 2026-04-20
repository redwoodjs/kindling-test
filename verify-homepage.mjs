import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 }
});
const page = await context.newPage();

// Navigate to the homepage
console.log('Navigating to homepage...');
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Wait a bit for any client-side hydration
await page.waitForTimeout(2000);

// Take screenshot of initial load
await page.screenshot({ path: '/tmp/homepage-initial.png', fullPage: true });
console.log('Screenshot saved to /tmp/homepage-initial.png');

// Get the page title
const title = await page.title();
console.log('Page title:', title);

// Check for the expected text
const heading = await page.locator('main h1').textContent().catch(() => 'NOT FOUND');
console.log('Main heading text:', heading);

// Get all visible text on the page
const bodyText = await page.locator('body').textContent();
console.log('Body text:', bodyText.trim());

// Check the HTML structure of main
const mainContent = await page.locator('main').innerHTML();
console.log('Main element HTML:', mainContent);

// Check for any h1 elements
const h1Count = await page.locator('h1').count();
console.log('Number of h1 elements:', h1Count);

if (h1Count > 0) {
  const allH1Texts = await page.locator('h1').allTextContents();
  console.log('All h1 texts:', allH1Texts);
  
  // Check if the expected text is present
  const expectedText = 'KINDLING SMOKE VERIFY OK';
  const hasExpected = allH1Texts.some(text => text.includes(expectedText));
  console.log('Has expected text "KINDLING SMOKE VERIFY OK":', hasExpected);
}

// Take a final screenshot
await page.screenshot({ path: '/tmp/homepage-final.png', fullPage: true });
console.log('Final screenshot saved to /tmp/homepage-final.png');

await browser.close();
console.log('Verification complete!');
