const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  
  // Override _drawDrivingScene to add logging
  await page.evaluateOnNewDocument(() => {
    const origDrawDrivingScene = Game.prototype._drawDrivingScene;
    Game.prototype._drawDrivingScene = function(w, h) {
      console.log('[DEBUG] _drawDrivingScene: w=' + w + ' h=' + h + ' viewMode=' + this.viewMode);
      console.log('[DEBUG] CAMERA_HEIGHT exists:', typeof CAMERA_HEIGHT !== 'undefined', '=', CAMERA_HEIGHT);
      console.log('[DEBUG] CarDraw exists:', typeof CarDraw, CarDraw ? Object.keys(CarDraw) : 'none');
      return origDrawDrivingScene.call(this, w, h);
    };
  });

  let logs = [];
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      logs.push(msg.text());
      console.log(msg.text());
    }
  });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Navigate to driving
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('\n=== Drawing calls count ===');
  const drawBehindCount = logs.filter(l => l.includes('drawFromBehind') || l.includes('CAR_HEIGHT')).length;
  console.log('DEBUG log entries:', logs.length);
  
  // Check if CarDraw.drawFromBehind was actually called during game loop
  // Let's also check what happens after the first frame of driving
  
  const finalCanvasState = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    
    // Count pixels by type in the bottom-center area where car should be
    let redPixels = 0, pinkPixels = 0, orangePixels = 0;
    let totalChecked = 0;
    
    for (let y = Math.floor(c.height*0.6); y < c.height*0.95; y++) {
      for (let x = Math.floor(c.width*0.2); x < c.width*0.8; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        totalChecked++;
        if (r > 150 && g < 80 && b < 80) redPixels++;
        if (r > 180 && g > 100 && b < 130) pinkPixels++;
        if (r > 150 && g > 50 && g < 120 && b < 60) orangePixels++;
      }
    }
    
    return { totalChecked, redPixels, pinkPixels, orangePixels };
  });
  
  console.log('\nCar color pixels (bottom-center):');
  console.log('  Red:', finalCanvasState.redPixels);
  console.log('  Pink:', finalCanvasState.pinkPixels); 
  console.log('  Orange:', finalCanvasState.orangePixels);
  
  // If zero car colors, the issue is clear - car isn't drawing
  
  await browser.close();
})();
