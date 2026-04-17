const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  const page = await browser.newPage();
  let allErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      allErrors.push(msg.text());
      console.log('[ERROR] ' + msg.text().substring(0, 200));
    } else if (msg.type() === 'warning') {
      console.log('[WARN] ' + msg.text().substring(0, 200));
    }
  });

  page.on('pageerror', err => {
    allErrors.push(err.message);
    console.log('[PAGE ERROR] ' + err.message.substring(0, 300));
  });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0', timeout: 15000 });
  
  // Wait for render
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n=== SCREENSHOTS ===\n');
  
  // 1. Menu
  await page.screenshot({ path: 'test-screenshots/01-menu.png', fullPage: true });
  console.log('1. Menu screenshot saved');
  
  // 2. Click Jízda button (right side of screen, lower half)
  // Based on code: buttons are around y=py+ph-60 where py=h*0.1, ph=h*0.6 → y≈540
  console.log('\n--- Navigating to driving menu ---');
  await page.mouse.click(620, 560); // Right button area
  await new Promise(r => setTimeout(r, 1500));
  
  await page.screenshot({ path: 'test-screenshots/02-driving-menu.png', fullPage: true });
  console.log('2. Driving menu screenshot saved');
  
  // 3. Click Hrát (play) button at bottom of driving menu
  console.log('\n--- Starting driving ---');
  await page.mouse.click(500, 1080); // Bottom play button
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'test-screenshots/03-driving.png', fullPage: true });
  console.log('3. Driving scene screenshot saved');
  
  // 4. Wait more and take another screenshot
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test-screenshots/04-driving-2.png', fullPage: true });
  console.log('4. Driving scene (later) screenshot saved');

  // 5. Check if there were any errors during gameplay
  console.log('\n=== ERRORS DURING TESTING ===');
  if (allErrors.length === 0) {
    console.log('No errors! Game runs clean.');
  } else {
    const unique = [...new Set(allErrors)];
    console.log('Total errors:', allErrors.length);
    console.log('Unique errors:', unique.length);
    unique.forEach((e, i) => console.log(`  ${i+1}. ${e.substring(0, 250)}`));
  }

  // 6. Check canvas pixel data at center of screen during driving
  const centerPixels = await page.evaluate(() => {
    const c = document.getElementById('game');
    if (!c || !c.width) return null;
    const ctx = c.getContext('2d');
    try {
      // Sample center area for color variety (indicates rendering)
      const data = ctx.getImageData(0, 0, c.width, c.height);
      let colors = new Set();
      // Sample every 50th pixel
      for (let i = 0; i < data.data.length; i += 200) {
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        colors.add(r + ',' + g + ',' + b);
      }
      return 'total pixels: ' + (c.width * c.height) + ', unique colors sampled: ' + colors.size;
    } catch(e) {
      return 'error reading canvas: ' + e.message;
    }
  });
  console.log('\nCanvas rendering:', centerPixels);

  await browser.close();
})();
