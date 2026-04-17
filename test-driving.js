const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  var dir = 'test-screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  var browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  var page = await browser.newPage();
  page.on('console', function(msg) { if (msg.type() === 'error') console.log('[ERROR] ' + msg.text()); });
  page.on('pageerror', function(err) { console.log('[PAGE ERROR] ' + err.message); });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0', timeout: 10000 });

  // === Get button positions ===
  var btns = await page.evaluate(function() {
    var w = window.innerWidth, h = window.innerHeight;
    var py = h*0.1, ph = h*0.6, bw = Math.min(180,w*0.42), bh = 45, gap = 15;
    return {
      driveX: w/2 + gap/2 + bw/2,
      driveY: py + ph - 60 + bh/2,
      playY: h*0.9 + 25,
      camX: w - 70,
      camY: 60,
      w: w, h: h
    };
  });
  console.log('Buttons: drive(' + btns.driveX+','+btns.driveY + ') play(' + btns.playY + ') cam(' + btns.camX+','+btns.camY + ')');

  // === 1. Menu ===
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-screenshots/01-menu.png' });

  // === 2. Drive to driving menu ===
  await page.mouse.click(btns.driveX, btns.driveY);
  await new Promise(r => setTimeout(r, 800));
  var st1 = await page.evaluate(() => window.gameInstance.state);
  console.log('After drive click:', st1);
  await page.screenshot({ path: 'test-screenshots/02-driving-menu.png' });

  // === 3. Start driving (behind view) ===
  await page.mouse.click(btns.w/2, btns.playY);
  await new Promise(r => setTimeout(r, 3000));
  var st2 = await page.evaluate(() => {
    var g = window.gameInstance;
    return {state: g.state, view: g.viewMode};
  });
  console.log('After play click:', st2);

  // Check behind view
  var behind = await page.evaluate(function() {
    var c = document.getElementById('game');
    var w = c.width, h = c.height;
    var d = c.getContext('2d').getImageData(0, 0, w, h).data;
    var sky = 0, totalSky = 0;
    for (var y = 0; y < h*0.45; y++) {
      for (var x = 0; x < w; x += 4) { totalSky++; var i=(y*w+x)*4; if(d[i]>100&&d[i+1]>150&&d[i+2]>180) sky++; }
    }
    var road = 0, totalRoad = 0;
    for (var y = Math.floor(h*0.45); y < h*0.7; y++) {
      for (var x = Math.floor(w*0.2); x < w*0.8; x += 4) { totalRoad++; var i=(y*w+x)*4; if(d[i]>80&&d[i]<180&&d[i+1]>80&&d[i+1]<180&&d[i+2]<120) road++; }
    }
    var red = 0;
    for (var y = Math.floor(h*0.65); y < h*0.9; y++) {
      for (var x = Math.floor(w*0.25); x < w*0.75; x += 2) { var i=(y*w+x)*4; if(d[i]>150&&d[i+1]<80&&d[i+2]<80) red++; }
    }
    var pink = 0;
    for (var y = Math.floor(h*0.6); y < h*0.8; y++) {
      for (var x = Math.floor(w*0.35); x < w*0.65; x += 2) { var i=(y*w+x)*4; if(d[i]>200&&d[i+1]>120&&d[i+1]<200&&d[i+2]<150) pink++; }
    }
    return {skyPct:(sky/Math.max(1,totalSky)*100).toFixed(1),roadPct:(road/Math.max(1,totalRoad)*100).toFixed(1),red:red,pink:pink};
  });
  console.log('Behind view - Sky:' + behind.skyPct + '% Road:' + behind.roadPct + '% Red(taillights):' + behind.red + ' Pink(Veprik):' + behind.pink);
  await page.screenshot({ path: 'test-screenshots/03-behind-view.png' });

  // === 4. Switch to cockpit ===
  await page.mouse.click(btns.camX, btns.camY);
  await new Promise(r => setTimeout(r, 1000));
  var st3 = await page.evaluate(() => {
    var g = window.gameInstance;
    return {state: g.state, view: g.viewMode};
  });
  console.log('After camera click:', st3);

  // Check cockpit view
  var cockpit = await page.evaluate(function() {
    var c = document.getElementById('game');
    var w = c.width, h = c.height;
    var d = c.getContext('2d').getImageData(0, 0, w, h).data;
    var dashY = Math.floor(h*0.7);
    var dark = 0, mid = 0, light = 0;
    for (var y = dashY; y < h; y += 2) {
      for (var x = 0; x < w; x += 2) { var i=(y*w+x)*4; var br=(d[i]+d[i+1]+d[i+2])/3; if(br<60)dark++;else if(br<150)mid++;else light++; }
    }
    var road = 0, total = 0;
    for (var y = Math.floor(h*0.45); y < dashY; y += 4) {
      for (var x = w*0.15; x < w*0.85; x += 4) { total++; var i=(y*w+x)*4; if(d[i]>80&&d[i]<180&&d[i+1]>80&&d[i+1]<180&&d[i+2]<120) road++; }
    }
    var pink = 0;
    for (var y = Math.floor(h*0.55); y < dashY; y += 2) {
      for (var x = w*0.2; x < w*0.45; x += 2) { var i=(y*w+x)*4; if(d[i]>200&&d[i+1]>120&&d[i+1]<200&&d[i+2]<150) pink++; }
    }
    return {dashPct:(dark/(dark+mid+light)*100).toFixed(1),roadPct:(road/Math.max(1,total)*100).toFixed(1),pink:pink};
  });
  console.log('Cockpit view - Dashboard:' + cockpit.dashPct + '% dark Road:' + cockpit.roadPct + '% Pink(Veprik):' + cockpit.pink);
  await page.screenshot({ path: 'test-screenshots/04-cockpit-view.png' });

  // === 5. Switch back to behind ===
  await page.mouse.click(btns.camX, btns.camY);
  await new Promise(r => setTimeout(r, 1000));
  var st4 = await page.evaluate(() => {
    var g = window.gameInstance;
    return {state: g.state, view: g.viewMode};
  });
  console.log('After second camera click:', st4);
  await page.screenshot({ path: 'test-screenshots/05-behind-view-2.png' });

  // === 6. Test steering with joystick ===
  // Simulate joystick movement to the left
  await page.evaluate(function() {
    var g = window.gameInstance;
    if (g.joystick) {
      g.joystick.active = true;
      g.joystick.dx = -0.8;
      g.joystick.dy = 0;
    }
  });
  await new Promise(r => setTimeout(r, 500));
  var carX1 = await page.evaluate(() => window.gameInstance.carX);
  console.log('Car X before joystick:', carX1);

  // Move joystick to right
  await page.evaluate(function() {
    var g = window.gameInstance;
    if (g.joystick) {
      g.joystick.dx = 0.8;
      g.joystick.dy = 0;
    }
  });
  await new Promise(r => setTimeout(r, 500));
  var carX2 = await page.evaluate(() => window.gameInstance.carX);
  console.log('Car X after joystick right:', carX2);

  // Reset joystick
  await page.evaluate(function() {
    var g = window.gameInstance;
    if (g.joystick) {
      g.joystick.active = false;
      g.joystick.dx = 0;
      g.joystick.dy = 0;
    }
  });

  // === Summary ===
  console.log('\n=== SUMMARY ===');
  console.log('Behind view: Sky=' + behind.skyPct + '% Road=' + behind.roadPct + '% Taillights=' + (behind.red > 10 ? 'YES' : 'NO') + ' Veprik=' + (behind.pink > 5 ? 'YES' : 'NO'));
  console.log('Cockpit view: Dashboard=' + cockpit.dashPct + '% dark Road=' + cockpit.roadPct + '% Veprik=' + (cockpit.pink > 5 ? 'YES' : 'NO'));
  console.log('Steering: carX changed from ' + carX1 + ' to ' + carX2);

  await browser.close();
  console.log('\nAll screenshots saved to test-screenshots/');
})();
