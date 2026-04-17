const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  
  // Log DPR and canvas sizes on every resize
  await page.evaluateOnNewDocument(() => {
    const origResize = Game.prototype._handleResize;
    if (origResize) {
      Game.prototype._handleResize = function() {
        var dpr = window.devicePixelRatio || 1;
        console.log('[RESIZE] DPR='+dpr+' winW='+window.innerWidth+' winH='+window.innerHeight);
        origResize.call(this);
        console.log('[RESIZE] canvas='+this.joystick?this.joystick.baseX:'N/A'); // approximate
      };
    }
  });

  page.on('console', msg => {
    if (msg.text().includes('[RESIZE]') || msg.text().includes('[ERR]')) {
      console.log(msg.text());
    }
  });
  page.on('pageerror', err => console.log('[PAGE ERR] ' + err.message));

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  
  // Wait for any resize events
  await new Promise(r => setTimeout(r, 3000));
  
  // Check actual canvas dimensions
  const info = await page.evaluate(() => {
    const c = document.getElementById('game');
    return {
      cssWidth: c.style.width || 'auto',
      cssHeight: c.style.height || 'auto',
      clientW: c.clientWidth,
      clientH: c.clientHeight,
      drawW: c.width,
      drawH: c.height,
      dpr: window.devicePixelRatio
    };
  });
  
  console.log('\nCanvas info:', JSON.stringify(info, null, 2));

  // Navigate to driving and check again
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  const driveInfo = await page.evaluate(() => {
    const c = document.getElementById('game');
    return {
      drawW: c.width,
      drawH: c.height,
      dpr: window.devicePixelRatio
    };
  });
  
  console.log('\nDriving canvas:', JSON.stringify(driveInfo, null, 2));

  await browser.close();
})();
