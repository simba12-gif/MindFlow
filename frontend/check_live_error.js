import puppeteer from 'puppeteer-core';

async function run() {
  console.log('Launching headless Chrome to inspect the live site...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  try {
    await page.goto('https://mind-flow-psi.vercel.app/', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded successfully. Checking DOM...');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Body HTML length:', bodyHTML.length);
    console.log('Body HTML snapshot:', bodyHTML.substring(0, 500));
  } catch (e) {
    console.error('Navigation or execution failed:', e);
  }

  await browser.close();
  console.log('Browser closed.');
}
run();
