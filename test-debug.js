const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  const page = await browser.newPage();
  
  // Inject debug hooks into the game code before it runs
  await page.evaluateOnNewDocument(() => {
    const origDrawDrivingScene = window.Game ? null : null;
    
    // Wrap CarDraw functions to log calls
    if (typeof CarDraw !== 'undefined') {
      const origBehind = CarDraw.drawFromBehind;
      CarDraw.drawFromBehind = function(ctx, config, x, y, scale, steerAngle) {
        console.log('[CarDraw] drawFromBehind called: x='+x+' y='+y+' scale='+scale+' type='+(config&&config.type));
        return origBehind.apply(this, arguments);
      };
      
      const origInCar = CarDraw.drawInCar;
      CarDraw.drawInCar = function(ctx, config, w, h, steerAngle) {
        console.log('[CarDraw] drawInCar called: w='+w+' h='+h);
        return origInCar.apply(this, arguments);
      };
    }
  });

  let errors = [];
  page.on('console', msg => {
    if (msg.text().includes('[CarDraw]') || msg.type() === 'error') {
      console.log(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[PAGE ERROR] ' + err.message);
  });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to driving
  await page.mouse.click(620, 560);
  await new Promise(r => setTimeout(r, 1000));
  
  // Check state before starting
  const beforeState = await page.evaluate(() => {
    return JSON.stringify({
      viewMode: window.game ? null : 'no-game',
      driveConfig: window.game ? null : 'no-game'
    });
  });
  console.log('Before start:', beforeState);
  
  await page.mouse.click(500, 1080);
  await new Promise(r => setTimeout(r, 3000));
  
  // Check game state
  const afterState = await page.evaluate(() => {
    // Find the Game instance - it's created at bottom with `new Game()`
    // We can find it by checking what's in scope or by using a global
    return 'canvas: ' + document.getElementById('game').width + 'x' + document.getElementById('game').height;
  });
  console.log('After start:', afterState);
  
  // Now check - is CarDraw accessible? What does it contain?
  const carDrawInfo = await page.evaluate(() => {
    if (typeof CarDraw === 'undefined') return 'CarDraw undefined';
    const keys = Object.keys(CarDraw);
    return 'CarDraw keys: ' + JSON.stringify(keys);
  });
  console.log('CarDraw:', carDrawInfo);
  
  // Check viewMode - is it being set to cockpit somehow?
  const viewCheck = await page.evaluate(() => {
    // Try to find the game instance through canvas context closure
    // The Game object calls draw methods, let's check what happens in the next frame
    // by manually calling _drawDrivingScene and seeing output
    
    // Actually let's just check if the functions exist and are callable
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    
    // Manually test CarDraw.drawFromBehind
    try {
      CarDraw.drawFromBehind(ctx, {type:'tractor', paletteIndex:0, wheelStyle:'standard'}, 400, 900, 1.2, 0);
      return 'drawFromBehind succeeded';
    } catch(e) {
      return 'drawFromBehind failed: ' + e.message;
    }
  });
  console.log('Manual draw test:', viewCheck);

  // Check canvas after manual draw
  const postDraw = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    // Check center-bottom area
    let colored = 0;
    for (let y = 850; y < 970; y++) {
      for (let x = 340; x < 460; x++) {
        const i = (y * c.width + x) * 4;
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        if (Math.abs(r-g)>30 || Math.abs(g-b)>30 || Math.abs(r-b)>30) colored++;
      }
    }
    return 'colored pixels in car area after manual draw: ' + colored;
  });
  console.log('After manual draw:', postDraw);
  
  // Show top colors in car area after manual draw
  const colorsAfter = await page.evaluate(() => {
    const c = document.getElementById('game');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const buckets = {};
    for (let y = 850; y < 970; y++) {
      for (let x = 340; x < 460; x++) {
        const i = (y * c.width + x) * 4;
        const key = Math.floor(data.data[i]/50)*50+','+Math.floor(data.data[i+1]/50)*50+','+Math.floor(data.data[i+2]/50)*50;
        buckets[key] = (buckets[key]||0)+1;
      }
    }
    return Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+v);
  });
  console.log('Colors after manual draw:', colorsAfter);

  await browser.close();
})();
