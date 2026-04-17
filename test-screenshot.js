const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  
  page.on('pageerror', err => console.log('[ERR] ' + err.message));
  
  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Navigate to driving
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot at exact canvas size (not fullPage)
  const c = await page.$('#game');
  await c.screenshot({ path: 'test-screenshots/driving-car-test.png' });
  
  // Analyze vertical clusters of colored pixels
  const analysis = await page.evaluate(() => {
    const canvasEl = document.getElementById('game');
    const ctx = canvasEl.getContext('2d');
    const data = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
    
    // Group colored pixels by row
    const rows = {};
    for (let y = 0; y < canvasEl.height; y++) {
      let coloredInRow = 0;
      for (let x = 0; x < canvasEl.width; x++) {
        const i = (y * canvasEl.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        if (Math.abs(r-g) > 20 || Math.abs(g-b) > 20 || (r>150 && g<80)) {
          coloredInRow++;
        }
      }
      if (coloredInRow > 50) rows[y] = coloredInRow;
    }
    
    // Find clusters
    const clusters = [];
    let cs = null, ce = null, cc = 0;
    for (let y = 0; y < canvasEl.height; y++) {
      if (rows[y] !== undefined) {
        if (cs === null) { cs = y; ce = y; cc = rows[y]; }
        else if (y - ce <= 5) { ce = y; cc += rows[y]; }
        else { clusters.push({y: cs+'-'+ce, h: ce-cs, p: cc}); cs = y; ce = y; cc = rows[y]; }
      }
    }
    if (cs !== null) clusters.push({y: cs+'-'+ce, h: ce-cs, p: cc});
    
    return clusters;
  });
  
  console.log('=== VERTICAL CLUSTERS OF COLORED PIXELS ===');
  analysis.forEach(c => console.log('  y='+c.y+' (h='+c.h+'px): '+c.p+' colored pixels'));

  await browser.close();
})();
