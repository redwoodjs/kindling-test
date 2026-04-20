import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:4173');
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Check for the smoke-verify-marker
  const marker = await page.locator('[data-testid="smoke-verify-marker"]');
  const markerVisible = await marker.isVisible();
  const markerText = await marker.textContent();
  
  console.log(`Marker visible: ${markerVisible}`);
  console.log(`Marker text: ${markerText}`);
  
  // Get the h1 content
  const h1 = await page.locator('h1').first();
  const h1Text = await h1.textContent();
  const h1FontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
  
  console.log(`H1 text: ${h1Text}`);
  console.log(`H1 font size: ${h1FontSize}`);
  
  // Take a screenshot
  await page.screenshot({ path: './screenshots/homepage.png', fullPage: true });
  console.log('Screenshot saved to ./screenshots/homepage.png');
  
  // Take a screenshot of just the main content
  await page.locator('main').screenshot({ path: './screenshots/homepage-main.png' });
  console.log('Main content screenshot saved to ./screenshots/homepage-main.png');
  
  // Get viewport info
  const viewport = page.viewportSize();
  console.log(`Viewport: ${viewport.width}x${viewport.height}`);
  
  await browser.close();
  console.log('Verification complete!');
})();
