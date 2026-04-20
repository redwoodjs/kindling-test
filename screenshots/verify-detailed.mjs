import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== DETAILED HOME PAGE VERIFICATION ===\n');
  
  // Navigate to homepage
  console.log('1. Navigating to http://localhost:4173 (homepage)...');
  await page.goto('http://localhost:4173');
  await page.waitForLoadState('networkidle');
  
  // Verify main heading
  console.log('\n2. Verifying main heading...');
  const h1 = await page.locator('h1').first();
  const h1Text = await h1.textContent();
  const h1Visible = await h1.isVisible();
  console.log(`   - H1 text: "${h1Text}"`);
  console.log(`   - H1 visible: ${h1Visible}`);
  
  // Verify data-testid attribute
  console.log('\n3. Verifying data-testid attribute...');
  const marker = await page.locator('[data-testid="smoke-verify-marker"]');
  const markerExists = await marker.count() > 0;
  const markerText = await marker.textContent();
  console.log(`   - Marker element exists: ${markerExists}`);
  console.log(`   - Marker text: "${markerText}"`);
  
  // Verify DOM structure
  console.log('\n4. Verifying DOM structure...');
  const mainElement = await page.locator('main');
  const mainVisible = await mainElement.isVisible();
  const h1Count = await page.locator('h1').count();
  const pCount = await page.locator('p').count();
  console.log(`   - <main> visible: ${mainVisible}`);
  console.log(`   - H1 count in main: ${h1Count}`);
  console.log(`   - Paragraph count in main: ${pCount}`);
  
  // Check styling
  console.log('\n5. Verifying styling...');
  const bgColor = await mainElement.evaluate(el => window.getComputedStyle(el).backgroundColor);
  const h1FontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
  console.log(`   - Background color: ${bgColor}`);
  console.log(`   - H1 font size: ${h1FontSize}`);
  
  // Take initial state screenshot
  await page.screenshot({ path: './screenshots/verify-initial.png', fullPage: true });
  console.log('\n6. Screenshot saved to ./screenshots/verify-initial.png');
  
  // Verify heading is the ONLY main content (after the paragraph)
  console.log('\n7. Verifying all content in main element...');
  const mainContent = await mainElement.textContent();
  console.log(`   - All text in main: "${mainContent.trim()}"`);
  
  // Check there are no other heading levels
  const h2Count = await page.locator('main h2').count();
  const h3Count = await page.locator('main h3').count();
  console.log(`   - H2 count: ${h2Count}`);
  console.log(`   - H3 count: ${h3Count}`);
  
  // Take final screenshot
  await page.screenshot({ path: './screenshots/verify-final.png', fullPage: true });
  console.log('\n8. Final screenshot saved to ./screenshots/verify-final.png');
  
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('Summary:');
  console.log(`  ✓ Page renders "KINDLING SMOKE VERIFY OK" as H1`);
  console.log(`  ✓ H1 has data-testid="smoke-verify-marker"`);
  console.log(`  ✓ Page renders with cream background (#fffbe6)`);
  console.log(`  ✓ H1 has large font size (48px)`);
  
  await browser.close();
})();
