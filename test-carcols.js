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
  
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Find EXACT car color pixels (red body, pink ears)
  const carAnalysis = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    
    // Car-specific colors: red body (#cc4444 ≈ R>150,G<80,B<80), pink ears (#ff8899 ≈ R>200,G>130,B>140)
    const carPixels = {};
    
    for (let y = 0; y < c.height; y++) {
      let redInRow = 0, pinkInRow = 0;
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        
        // Red body colors
        if (r > 150 && g < 100 && b < 100) redInRow++;
        // Pink ear colors  
        if (r > 200 && g > 100 && g < 170 && b > 130) pinkInRow++;
      }
      if (redInRow > 5 || pinkInRow > 5) {
        carPixels[y] = { red: redInRow, pink: pinkInRow };
      }
    }
    
    // Show clusters
    const clusters = [];
    let cs = null;
    for (let y = 0; y < c.height; y++) {
      if (carPixels[y]) {
        if (cs === null) cs = y;
      } else if (cs !== null) {
        clusters.push({start: cs, end: y-1, height: y-cs});
        cs = null;
      }
    }
    if (cs !== null) clusters.push({start: cs, end: c.height-1, height: c.height-cs});
    
    // Show top 5 color buckets in car area
    const bucketColors = {};
    for (let y = Math.floor(c.height*0.5); y < c.height*0.9; y++) {
      for (let x = Math.floor(c.width*0.2); x < c.width*0.8; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        if (r > 100 || g > 100 || b > 100) {
          const key = Math.floor(r/30)*30+','+Math.floor(g/30)*30+','+Math.floor(b/30)*30;
          bucketColors[key] = (bucketColors[key]||0)+1;
        }
      }
    }
    
    const sorted = Object.entries(bucketColors).sort((a,b)=>b[1]-a[1]).slice(0,8);
    
    return { clusters: clusters.slice(0, 10), topColors: sorted };
  });
  
  console.log('=== CAR COLOR PIXELS (red body + pink ears) ===');
  carAnalysis.clusters.forEach(c => console.log('  y='+c.start+'-'+c.end+' (height '+c.height+'px)'));
  
  console.log('\n=== TOP COLORS IN MIDDLE-BOTTOM AREA ===');
  carAnalysis.topColors.forEach(([color,count]) => {
    console.log('  RGB('+color+'): '+count+' pixels');
  });

  await browser.close();
})();
