const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function findChrome() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe' : null,
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function captureScreenshots(prototypeDir, outputDir, options = {}) {
  const screenshotDir = outputDir || path.join(path.dirname(prototypeDir), 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error(
      'No Chrome/Edge browser found. Please install Chrome or Edge to use the screenshot feature.'
    );
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const screenshots = [];

  try {
    const indexPath = path.join(prototypeDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexUrl = 'file:///' + indexPath.replace(/\\/g, '/');
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      console.log('[screenshot-capture] Loading mobile prototype...');
      await page.goto(indexUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      const pageNavButtons = await page.$$('.page-nav-btn');
      const pageCount = pageNavButtons.length;

      if (pageCount > 0) {
        for (let i = 0; i < pageCount; i++) {
          await page.evaluate((idx) => {
            const btns = document.querySelectorAll('.page-nav-btn');
            if (btns[idx]) btns[idx].click();
          }, i);
          await new Promise((r) => setTimeout(r, 500));

          const phoneContainer = await page.$('.phone-container');
          if (phoneContainer) {
            const label = await page.evaluate((idx) => {
              const btns = document.querySelectorAll('.page-nav-btn');
              return btns[idx] ? btns[idx].textContent.trim() : `page-${idx}`;
            }, i);
            const fileName = `mobile-${label.replace(/\s+/g, '-').toLowerCase()}.png`;
            const filePath = path.join(screenshotDir, fileName);
            await phoneContainer.screenshot({ path: filePath, padding: 10 });
            screenshots.push({
              name: label,
              file: fileName,
              path: filePath,
              type: 'mobile',
            });
            console.log(`[screenshot-capture] Saved: ${label} -> ${filePath}`);
          }
        }
      } else {
        const phoneContainer = await page.$('.phone-container');
        if (phoneContainer) {
          const filePath = path.join(screenshotDir, 'mobile-home.png');
          await phoneContainer.screenshot({ path: filePath, padding: 10 });
          screenshots.push({
            name: '首页',
            file: 'mobile-home.png',
            path: filePath,
            type: 'mobile',
          });
        }
      }

      await page.close();
    }

    const adminPath = path.join(prototypeDir, 'admin.html');
    if (fs.existsSync(adminPath)) {
      const adminUrl = 'file:///' + adminPath.replace(/\\/g, '/');
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      console.log('[screenshot-capture] Loading admin prototype...');
      await page.goto(adminUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      const loginContainer = await page.$('.login-container');
      if (loginContainer) {
        const filePath = path.join(screenshotDir, 'admin-login.png');
        await loginContainer.screenshot({ path: filePath, padding: 10 });
        screenshots.push({
          name: '管理后台-登录页',
          file: 'admin-login.png',
          path: filePath,
          type: 'admin',
        });
        console.log('[screenshot-capture] Saved: admin-login');
      }

      await page.evaluate(() => {
        if (typeof doLogin === 'function') doLogin();
      });
      await new Promise((r) => setTimeout(r, 500));

      const sidebarItems = await page.$$('.sidebar-item');
      for (let i = 0; i < sidebarItems.length; i++) {
        await page.evaluate((idx) => {
          const items = document.querySelectorAll('.sidebar-item');
          if (items[idx]) items[idx].click();
        }, i);
        await new Promise((r) => setTimeout(r, 300));

        const adminContainer = await page.$('.admin-main');
        if (adminContainer) {
          const label = await page.evaluate((idx) => {
            const items = document.querySelectorAll('.sidebar-item');
            return items[idx] ? items[idx].textContent.trim() : `admin-${idx}`;
          }, i);
          const fileName = `admin-${label.replace(/\s+/g, '-').toLowerCase()}.png`;
          const filePath = path.join(screenshotDir, fileName);
          await adminContainer.screenshot({ path: filePath, padding: 10 });
          screenshots.push({
            name: `管理后台-${label}`,
            file: fileName,
            path: filePath,
            type: 'admin',
          });
          console.log(`[screenshot-capture] Saved: admin-${label}`);
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`[screenshot-capture] Total screenshots: ${screenshots.length}`);
  return screenshots;
}

module.exports = {
  captureScreenshots,
  findChrome,
};
