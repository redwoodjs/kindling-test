import { chromium } from '@playwright/test';

const SCREENSHOTS = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1006-verify-homepage-displays-verification-he-d854/verification-proof/screenshots';
const VIDEO = '/home/vscode/.kindling/state/home-vscode-repo/tasks/2026-04-20-1006-verify-homepage-displays-verification-he-d854/verification-proof/video';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5176/');
  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });

  // Step 1: Page loads without crash
  const title = await page.title();
  console.log('Page title:', title);

  // Step 2: Check h1 count
  const h1Count = await page.locator('h1').count();
  console.log('Number of h1 elements:', h1Count);

  // Step 3: Check data-testid attribute
  const testid = await page.locator('h1').getAttribute('data-testid');
  console.log('h1 data-testid:', testid);

  // Step 4: Check h1 text
  const h1Text = await page.locator('h1').textContent();
  console.log('h1 text:', h1Text);

  // Step 5: Check subtitle text
  const pText = await page.locator('main p').textContent();
  console.log('Subtitle text:', pText);

  // Step 6: Check main background color
  const mainBg = await page.locator('main').evaluate(el => window.getComputedStyle(el).backgroundColor);
  console.log('main background-color:', mainBg);

  // Step 7: Check h1 font size
  const h1FontSize = await page.locator('h1').evaluate(el => window.getComputedStyle(el).fontSize);
  console.log('h1 font-size:', h1FontSize);

  // Step 8: Check no sidebar/nav
  const navCount = await page.locator('nav').count();
  const asideCount = await page.locator('aside').count();
  console.log('nav count:', navCount, 'aside count:', asideCount);

  // Capture screenshot
  await page.screenshot({ path: `${SCREENSHOTS}/homepage-fullpage.png`, fullPage: true });
  console.log('Screenshot saved to homepage-fullpage.png');

  // Close context (flushes video)
  await context.close();
  await browser.close();
  console.log('Done. Video flushed.');
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
