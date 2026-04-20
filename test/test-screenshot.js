const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PROTOTYPE_DIR = path.resolve(__dirname, '../test-output/prototype');
const SCREENSHOT_DIR = path.resolve(__dirname, '../test-output/screenshots');

async function findChrome() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe' : null,
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function testScreenshot() {
  console.log('\n🧪 测试7: 截图功能测试 (screenshot-capture)');
  console.log('='.repeat(60));

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const chromePath = await findChrome();
  if (!chromePath) {
    console.log('  ⚠️ 跳过: 未找到 Chrome/Edge 浏览器');
    console.log('  提示: 安装 Chrome 或 Edge 后可运行截图测试');
    return;
  }

  console.log(`  🌐 浏览器: ${chromePath}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  let passCount = 0;
  let failCount = 0;

  try {
    const indexPath = path.join(PROTOTYPE_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexUrl = 'file:///' + indexPath.replace(/\\/g, '/');
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      console.log('  📱 测试移动端原型截图...');
      await page.goto(indexUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      const pageNavButtons = await page.$$('.page-nav-btn');
      const pageCount = pageNavButtons.length;
      console.log(`  📄 发现 ${pageCount} 个页面`);

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
          const filePath = path.join(SCREENSHOT_DIR, fileName);
          await phoneContainer.screenshot({ path: filePath, padding: 10 });
          console.log(`  ✅ 截图成功: ${label} -> ${fileName}`);
          passCount++;
        } else {
          console.log(`  ❌ 截图失败: 页面 ${i} 未找到 phone-container`);
          failCount++;
        }
      }

      await page.close();
    }

    const adminPath = path.join(PROTOTYPE_DIR, 'admin.html');
    if (fs.existsSync(adminPath)) {
      const adminUrl = 'file:///' + adminPath.replace(/\\/g, '/');
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      console.log('  🖥️ 测试管理后台原型截图...');
      await page.goto(adminUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      const loginContainer = await page.$('.login-container');
      if (loginContainer) {
        const filePath = path.join(SCREENSHOT_DIR, 'admin-login.png');
        await loginContainer.screenshot({ path: filePath, padding: 10 });
        console.log('  ✅ 截图成功: 管理后台-登录页');
        passCount++;
      } else {
        console.log('  ❌ 截图失败: 未找到 login-container');
        failCount++;
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
          const filePath = path.join(SCREENSHOT_DIR, fileName);
          await adminContainer.screenshot({ path: filePath, padding: 10 });
          console.log(`  ✅ 截图成功: 管理后台-${label}`);
          passCount++;
        } else {
          console.log(`  ❌ 截图失败: 管理后台页面 ${i} 未找到 admin-main`);
          failCount++;
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n  📊 截图测试结果: ✅ ${passCount} 通过, ❌ ${failCount} 失败`);
  console.log(`  📂 截图保存目录: ${SCREENSHOT_DIR}`);

  const files = fs.readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith('.png'));
  console.log(`  📸 截图文件: ${files.join(', ')}`);
}

testScreenshot().catch((e) => {
  console.error('截图测试出错:', e.message);
  process.exit(1);
});
