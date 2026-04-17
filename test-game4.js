const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[ERROR] ' + msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERROR] ' + err.message));

  // Fix URL - missing colon
  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0', timeout: 10000 });
  
  // Navigate to driving
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Analyze car area (bottom center)
  const analysis = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const w = c.width, h = c.height;
    
    const carY = Math.floor(h * 0.65);
    const carH = Math.floor(h * 0.35);
    const carX1 = Math.floor(w * 0.25);
    const carX2 = Math.floor(w * 0.75);
    
    const colorBuckets = {};
    let totalPixels = 0, visiblePixels = 0;
    
    for (let y = carY; y < carY + carH; y++) {
      for (let x = carX1; x < carX2; x++) {
        totalPixels++;
        const i = (y * w + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        const key = Math.floor(r/50)*50 + ',' + Math.floor(g/50)*50 + ',' + Math.floor(b/50)*50;
        colorBuckets[key] = (colorBuckets[key] || 0) + 1;
      }
    }
    
    const sorted = Object.entries(colorBuckets).sort((a,b) => b[1]-a[1]);
    
    return {
      total: totalPixels,
      visible: totalPixels, // all pixels in this rect are "visible" since it's a canvas
      topColors: sorted.slice(0, 10).map(([k,v]) => ({color: k, count: v}))
    };
  });
  
  console.log('\n=== CAR AREA ANALYSIS ===');
  console.log('Total pixels:', analysis.total);
  console.log('\nTop colors in car area (bottom-center):');
  analysis.topColors.forEach(({color, count}) => {
    const pct = (count / analysis.total * 100).toFixed(2);
    console.log('  RGB(' + color + '): ' + count + ' (' + pct + '%)');
  });

  // Check car state
  const carState = await page.evaluate(() => {
    const c = document.getElementById('game');
    // Get pixel data at specific car positions to verify rendering
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const data = ctx.getImageData(0, 0, w, h);
    
    // Check center-bottom area (where car should be in behind-view mode)
    const cx = Math.floor(w/2), cy = Math.floor(h*0.75);
    const samples = [];
    for (let dy = -30; dy <= 30; dy += 10) {
      for (let dx = -30; dx <= 30; dx += 10) {
        const px = Math.max(0, Math.min(w-1, cx+dx));
        const py = Math.max(0, Math.min(h-1, cy+dy));
        const i = (py * w + px) * 4;
        samples.push({dx, dy, r: data.data[i], g: data.data[i+1], b: data.data[i+2]});
      }
    }
    
    // Count non-gray pixels in car area - pink/red would indicate car body
    let coloredPixels = 0;
    for (let y = Math.floor(h*0.6); y < Math.floor(h*0.95); y++) {
      for (let x = Math.floor(w*0.3); x < Math.floor(w*0.7); x++) {
        const i = (y * w + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        // Check if color is not gray-ish
        if (Math.abs(r-g) > 30 || Math.abs(g-b) > 30 || Math.abs(r-b) > 30) {
          coloredPixels++;
        }
      }
    }
    
    return {
      centerSamples: samples,
      coloredInCarArea: coloredPixels + ' pixels are non-gray in car area (' + 
        Math.round(coloredPixels / (w*0.4*h*0.35) * 100) + '% of car area)'
    };
  });
  
  console.log('\n=== CAR CENTER PIXELS ===');
  console.log(carState.coloredInCarArea);
  
  // Show samples around center-bottom
  const cx = Math.floor(400), cy = Math.floor(900);
  console.log('Pixels at car position (cx=' + cx + ', cy=' + cy + '):');
  carState.centerSamples.forEach(s => {
    if (s.r > 50 || s.g > 50 || s.b > 50) {
      console.log('  (' + String(s.dx).padStart(3) + ',' + String(s.dy).padStart(3) + '): RGB(' + s.r + ',' + s.g + ',' + s.b + ')');
    }
  });

  await browser.close();
})();
