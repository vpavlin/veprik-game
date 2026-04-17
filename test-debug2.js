const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set the actual viewport to match what game expects
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  
  let errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.log('[ERR] ' + err.message); });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Check actual canvas size after game init
  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('game');
    return { w: c.width, h: c.height, dpr: window.devicePixelRatio };
  });
  console.log('Canvas:', JSON.stringify(canvasInfo));

  // Navigate to driving
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Check canvas size again and car rendering
  const postDriveInfo = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    
    // Sample the entire canvas for color diversity
    let colors = new Set();
    const step = Math.max(1, Math.floor(c.width * c.height / 5000));
    for (let i = 0; i < c.data && false; i += step) {} // skip
    
    // Get image data properly
    try {
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const buckets = {};
      let total = 0;
      
      // Sample every 100th pixel to keep it fast
      for (let i = 0; i < data.data.length; i += 400) {
        total++;
        const key = Math.floor(data.data[i]/50)*50+','+Math.floor(data.data[i+1]/50)*50+','+Math.floor(data.data[i+2]/50)*50;
        buckets[key] = (buckets[key]||0)+1;
      }
      
      const sorted = Object.entries(buckets).sort((a,b)=>b[1]-a[1]);
      
      // Check car-specific area: center-bottom
      const cx = Math.floor(c.width/2), cy = Math.floor(c.height*0.75);
      let carColored = 0;
      for (let y = cy-40; y < cy+40; y++) {
        for (let x = cx-40; x < cx+40; x++) {
          if (x<0||y<0||x>=c.width||y>=c.height) continue;
          const i2 = (y*c.width+x)*4;
          const r=data.data[i2], g=data.data[i2+1], b=data.data[i2+2];
          if (Math.abs(r-g)>30 || Math.abs(g-b)>30 || Math.abs(r-b)>30) carColored++;
        }
      }
      
      return {
        canvasW: c.width, canvasH: c.height,
        totalSamples: total,
        uniqueColors: colors.size || sorted.length,
        top5: sorted.slice(0,5).map(([k,v])=>({color:k,count:v})),
        carAreaColoredPixels: carColored + ' out of 160'
      };
    } catch(e) {
      return 'getImageData error: ' + e.message;
    }
  });
  
  console.log('Driving state:', JSON.stringify(postDriveInfo, null, 2));

  // Now test: manually draw a colored rectangle at the car position to verify canvas works
  const manualTest = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    
    // Draw a bright red square at car position
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(c.width/2 - 30, c.height*0.75 - 30, 60, 60);
    
    // Check if we can read it back
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const centerI = (Math.floor(c.height*0.75)*c.width + Math.floor(c.width/2))*4;
    return { r: data.data[centerI], g: data.data[centerI+1], b: data.data[centerI+2] };
  });
  
  console.log('Manual red square test:', JSON.stringify(manualTest));
  if (manualTest.r === 255 && manualTest.g === 0 && manualTest.b === 0) {
    console.log('Canvas READBACK WORKS - getImageData is functional');
  } else {
    console.log('Canvas READBACK BROKEN - getImageData returning wrong values!');
  }

  await browser.close();
})();
