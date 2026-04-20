import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Navigate to homepage
  console.log('Navigating to http://localhost:4173...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  
  // Wait for content to render
  await page.waitForTimeout(1000);
  
  // Capture initial screenshot
  await page.screenshot({ path: 'screenshots/01-homepage-loaded.png' });
  console.log('Screenshot saved: screenshots/01-homepage-loaded.png');
  
  // Check for the heading
  const heading = await page.locator('h1').first();
  const headingText = await heading.textContent();
  const hasDataTestId = await heading.getAttribute('data-testid');
  
  console.log('Heading text:', headingText);
  console.log('data-testid:', hasDataTestId);
  
  // Verify heading text matches expected
  if (headingText === 'KINDLING SMOKE VERIFY OK') {
    console.log('✓ Heading text matches expected');
    await page.screenshot({ path: 'screenshots/02-heading-verified.png' });
    console.log('Screenshot saved: screenshots/02-heading-verified.png');
  } else {
    console.log('✗ Heading text does NOT match expected');
  }
  
  // Verify data-testid
  if (hasDataTestId === 'smoke-verify-marker') {
    console.log('✓ data-testid matches expected');
  } else {
    console.log('✗ data-testid does NOT match expected');
  }
  
  // Get the DOM structure
  const mainContent = await page.locator('main').innerHTML();
  console.log('\n--- Main content DOM ---');
  console.log(mainContent);
  
  // Final screenshot showing full page
  await page.screenshot({ path: 'screenshots/03-full-page.png', fullPage: true });
  console.log('Screenshot saved: screenshots/03-full-page.png');
  
  await browser.close();
  console.log('\nVerification complete!');
})();
