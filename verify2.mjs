import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  
  const response = await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const heading = await page.locator('h1[data-testid="smoke-verify-marker"]').textContent();
  const fontSize = await page.evaluate(() => {
    const h1 = document.querySelector('h1[data-testid="smoke-verify-marker"]');
    return window.getComputedStyle(h1).fontSize;
  });
  const textAlign = await page.evaluate(() => {
    const main = document.querySelector('main');
    return window.getComputedStyle(main).textAlign;
  });
  
  console.log(`[${vp.name} ${vp.width}x${vp.height}] heading="${heading}" fontSize=${fontSize} textAlign=${textAlign}`);
  await page.screenshot({ path: `/tmp/homepage-${vp.name}.png`, fullPage: true });
  console.log(`  Screenshot: /tmp/homepage-${vp.name}.png`);
  await page.close();
}

await browser.close();
console.log('All done.');
