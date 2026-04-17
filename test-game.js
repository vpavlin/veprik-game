const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  const page = await browser.newPage();
  let errors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('ERROR:', msg.text());
    } else {
      console.log('LOG:', msg.text().substring(0, 120));
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  // Navigate to game
  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0', timeout: 10000 });
  
  // Wait a bit for rendering
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n=== SCREENSHOT: Main Menu ===');
  await page.screenshot({ path: 'test-screenshots/menu.png', fullPage: true });
  
  console.log('Errors after menu load:', errors.length);
  if (errors.length > 0) {
    console.log('All errors:', errors.join('\n'));
  }

  // Click "Jízda" button (right button in menu)
  // The button is roughly at w/2 + gap/2 + bw/2, around x=550, y=750 on 800x1200
  console.log('\n=== Clicking Jízda button ===');
  await page.mouse.click(650, 750);
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Errors after jízda click:', errors.filter(e => !errors.slice(0, errors.indexOf(e)+1).includes(e)).length);
  if (errors.length > 0) {
    // Show only new errors
    console.log('Current errors:', [...new Set(errors)].join('\n'));
  }
  
  console.log('\n=== SCREENSHOT: Driving Menu ===');
  await page.screenshot({ path: 'test-screenshots/driving-menu.png', fullPage: true });

  // Click "Hrát" button (green play button at bottom)
  console.log('\n=== Clicking Hrát button ===');
  await page.mouse.click(500, 1050);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Errors after hrát click:', errors.length);
  if (errors.length > 0) {
    console.log('All current errors:', [...new Set(errors)].join('\n'));
  }
  
  console.log('\n=== SCREENSHOT: Driving Scene ===');
  await page.screenshot({ path: 'test-screenshots/driving.png', fullPage: true });

  // Wait a bit more and check for ongoing errors
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n=== Final error count:', errors.length, '===');
  if (errors.length > 0) {
    const unique = [...new Set(errors)];
    console.log('Unique errors:');
    unique.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
  }

  await browser.close();
})();
