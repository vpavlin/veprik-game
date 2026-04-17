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
  
  // Check for BLACK pixels (wheels) around the car body y=778-826
  const wheelAnalysis = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    
    // Search for black/dark pixels in a band around the car body
    const startY = 750, endY = 900;
    const startX = 300, endX = 500;
    
    let darkRows = {};
    for (let y = startY; y < endY; y++) {
      let darkInRow = 0;
      for (let x = startX; x < endX; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        // Black wheels: all channels < 60
        if (r < 60 && g < 60 && b < 60) darkInRow++;
      }
      if (darkInRow > 5) darkRows[y] = darkInRow;
    }
    
    // Also check for wheel hub colors (gray ~#888)
    let grayRows = {};
    for (let y = startY; y < endY; y++) {
      let grayInRow = 0;
      for (let x = startX; x < endX; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        // Gray hubs: all channels between 100-160 and close together
        if (r > 100 && r < 170 && Math.abs(r-g) < 30 && Math.abs(g-b) < 30) grayInRow++;
      }
      if (grayInRow > 5) grayRows[y] = grayInRow;
    }
    
    // Show dark pixel rows with positions
    let darkDetails = {};
    for (let y = startY; y < endY; y++) {
      if (darkRows[y]) {
        // Find x-positions of dark pixels in this row
        let positions = [];
        for (let x = startX; x < endX; x += 2) {
          const i = (y * c.width + x) * 4;
          if (data.data[i] < 60 && data.data[i+1] < 60 && data.data[i+2] < 60) {
            positions.push(x);
          }
        }
        darkDetails[y] = { count: darkRows[y], xRange: positions[0]+'-'+positions[positions.length-1] };
      }
    }
    
    return { darkRows, grayRows, darkDetails };
  });
  
  console.log('=== DARK PIXELS (wheels?) around car body ===');
  const keys = Object.keys(wheelAnalysis.darkDetails).sort((a,b) => parseInt(a)-parseInt(b));
  let inCluster = false, clusterStart = null;
  keys.forEach(y => {
    const d = wheelAnalysis.darkDetails[y];
    if (!inCluster) { clusterStart = y; inCluster = true; }
    if (parseInt(y) - parseInt(Object.keys(wheelAnalysis.darkDetails).filter(k=>k<y).pop()||y-1) > 5) {
      console.log('  Cluster: y='+clusterStart+'-'+(parseInt(y)-1)+' ('+d.count+' dark px at x='+d.xRange+')');
      clusterStart = y;
    }
  });
  if (clusterStart) {
    const lastY = keys[keys.length-1];
    console.log('  Cluster: y='+clusterStart+'-'+lastY);
  }

  await browser.close();
})();
