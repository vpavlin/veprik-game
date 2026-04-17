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
  
  // Analyze car shape
  const shape = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const w = c.width, h = c.height;
    
    const startX = Math.floor(w * 0.25);
    const endX = Math.floor(w * 0.75);
    const startY = Math.floor(h * 0.6);
    const endY = Math.floor(h * 0.95);
    
    let minX = w, maxX = 0, minY = h, maxY = 0;
    let totalColored = 0;
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * w + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        const isCarColor = (r > 100 && g < 150 && (r > g + 30 || r > b + 30));
        
        if (isCarColor) {
          totalColored++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // ASCII art representation
    const asciiW = 40, asciiH = 20;
    const sx = (maxX - minX) / asciiW || 1;
    const sy = (maxY - minY) / asciiH || 1;
    
    let rows = [];
    for (let row = 0; row < asciiH; row++) {
      let line = '';
      for (let col = 0; col < asciiW; col++) {
        const px = Math.floor(minX + col * sx);
        const py = Math.floor(minY + row * sy);
        if (px >= startX && px < endX && py >= startY && py < endY) {
          const i = (py * w + px) * 4;
          const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
          const hit = (r > 100 && g < 150 && (r > g + 30 || r > b + 30));
          line += hit ? '#' : '.';
        } else {
          line += ' ';
        }
      }
      rows.push(line);
    }
    
    return {
      bbox: minX+'..'+maxX+', '+minY+'..'+maxY,
      size: maxX-minX + 'x' + (maxY-minY),
      pixels: totalColored,
      ascii: rows.join('\n')
    };
  });
  
  console.log('=== CAR SHAPE ===');
  console.log('Bounding box:', shape.bbox);
  console.log('Dimensions:', shape.size);
  console.log('Colored pixels:', shape.pixels);
  console.log('\nASCII (top=front, bottom=back):');
  console.log(shape.ascii);

  await browser.close();
})();
