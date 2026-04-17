const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  
  // Patch drawFromBehind to log its scale value
  await page.evaluateOnNewDocument(() => {
    const _origDraw = CarDraw ? CarDraw.drawFromBehind : null;
    if (_origDraw) {
      CarDraw.drawFromBehind = function(ctx, config, x, y, scale, steerAngle) {
        console.log('[CarDraw] fromBehind: x='+x+' y='+y+' s='+scale+' type='+(config?config.type:'null'));
        // Draw a test red rectangle to verify position/scale
        ctx.save();
        ctx.translate(x,y);
        console.log('[CarDraw] after translate, transform:', JSON.stringify(ctx.getTransform()));
        
        const result = _origDraw.call(this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
        
        ctx.restore();
        return result;
      };
    }
  });

  let logs = [];
  page.on('console', msg => {
    if (msg.text().includes('[CarDraw]')) {
      logs.push(msg.text());
      console.log(msg.text());
    }
  });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Check the last few frames' values
  console.log('\n=== LAST 5 CAR DRAW CALLS ===');
  logs.slice(-5).forEach(l => console.log(l));
  
  // The key question: is the car drawn at reasonable screen coordinates?
  // At 800x1200 with scale=1.2:
  // carScreenX = 400 + cameraOffset.x*1.5 ≈ 400
  // carScreenY = 900
  // scale = min(1.2, 800/600) = 1.2

  await browser.close();
})();
