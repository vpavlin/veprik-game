const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,1200']
  });

  const page = await browser.newPage();
  
  // Intercept all requests
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.isNavigationRequest()) {
      console.log('NAVIGATE:', req.url());
    } else {
      console.log('RESOURCE:', req.url(), 'type:', req.resourceType());
    }
    req.continue();
  });

  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle0', timeout: 10000 });
  
  // Check for any response errors
  let respErrs = [];
  const client = await page.createCDPSession();
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  
  console.log('\nPage title:', await page.title());
  
  // Check DOM
  const bodyText = await page.evaluate(() => document.body.innerHTML.substring(0, 200));
  console.log('Body preview:', bodyText);

  // Wait for canvas to render
  await new Promise(r => setTimeout(r, 3000));
  
  // Try to click buttons and navigate
  console.log('\n--- Clicking Jízda ---');
  await page.mouse.click(650, 780);
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('--- Clicking Hrát ---');
  await page.mouse.click(500, 1050);
  await new Promise(r => setTimeout(r, 3000));
  
  // Check canvas content
  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('game');
    return 'width=' + c.width + ' height=' + c.height;
  });
  console.log('Canvas:', canvasInfo);

  await browser.close();
})();
