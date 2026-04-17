const fs = require('fs');
const path = require('path');

const COLORS = {
  primary: '#0052A5',
  primaryLight: '#E8F0FE',
  success: '#34A853',
  warning: '#FBBC04',
  danger: '#EA4335',
  text: '#262626',
  textSecondary: '#5F6368',
  border: '#DADCE0',
  bg: '#F5F7FA',
  white: '#FFFFFF',
  shadow: '0 2px 8px rgba(0,0,0,0.1)',
};

function generateMobilePage(feature, moduleName) {
  const featureId = feature.name.replace(/\s+/g, '-').toLowerCase();
  const interactions = feature.interactions || [];
  const hasForm = interactions.some(i => /输入|填写|提交|选择/.test(i));
  const hasList = interactions.some(i => /列表|查看|浏览/.test(i));
  const hasDetail = interactions.some(i => /详情|查看详情|信息/.test(i));

  let contentHtml = '';

  if (hasForm) {
    contentHtml = generateFormContent(feature);
  } else if (hasList) {
    contentHtml = generateListContent(feature);
  } else if (hasDetail) {
    contentHtml = generateDetailContent(feature);
  } else {
    contentHtml = generateDefaultContent(feature);
  }

  return `
    <div class="page" id="page-${featureId}">
      <div class="navbar">
        <span class="nav-back" onclick="goBack()">‹</span>
        <span class="nav-title">${feature.name}</span>
        <span class="nav-action"></span>
      </div>
      <div class="page-content">
        ${contentHtml}
      </div>
    </div>`;
}

function generateFormContent(feature) {
  const fields = feature.interactions.filter(i => /输入|填写|选择|上传/.test(i));
  const fieldItems = fields.map((f, i) => {
    if (/选择|下拉|类型|分类/.test(f)) {
      return `
          <div class="form-group">
            <label>${extractFieldName(f)}</label>
            <div class="form-select">
              <span class="select-placeholder">请选择</span>
              <span class="select-arrow">▾</span>
            </div>
          </div>`;
    }
    if (/上传|图片|照片|拍照/.test(f)) {
      return `
          <div class="form-group">
            <label>${extractFieldName(f)}</label>
            <div class="upload-area">
              <div class="upload-icon">+</div>
              <span>点击上传</span>
            </div>
          </div>`;
    }
    return `
          <div class="form-group">
            <label>${extractFieldName(f)}</label>
            <input type="text" class="form-input" placeholder="请输入${extractFieldName(f)}" />
          </div>`;
  }).join('');

  return `
        <div class="form-container">
          ${fieldItems}
          <button class="btn-primary btn-block">提交</button>
        </div>`;
}

function generateListContent(feature) {
  const items = [1, 2, 3];
  const listItems = items.map(i => `
        <div class="list-item">
          <div class="item-header">
            <span class="item-title">项目 ${i}</span>
            <span class="item-status status-processing">处理中</span>
          </div>
          <div class="item-desc">这是第 ${i} 条记录的描述信息</div>
          <div class="item-footer">
            <span class="item-time">2026-04-${10 + i}</span>
          </div>
        </div>`).join('');

  return `
        <div class="search-bar">
          <input type="text" class="search-input" placeholder="搜索..." />
        </div>
        <div class="list-container">
          ${listItems}
        </div>`;
}

function generateDetailContent(feature) {
  const infoItems = feature.interactions.slice(0, 5).map(i => `
          <div class="info-row">
            <span class="info-label">${extractFieldName(i)}</span>
            <span class="info-value">${i}</span>
          </div>`).join('');

  return `
        <div class="detail-card">
          <div class="detail-header">
            <span class="detail-status status-success">已完成</span>
          </div>
          ${infoItems}
        </div>
        <button class="btn-primary btn-block" style="margin-top:16px;">操作</button>`;
}

function generateDefaultContent(feature) {
  const desc = feature.description || feature.name;
  const items = feature.interactions.length > 0
    ? feature.interactions.map(i => `<div class="info-row"><span class="info-value">${i}</span></div>`).join('')
    : `<div class="info-row"><span class="info-value">${desc}</span></div>`;

  return `
        <div class="detail-card">
          ${items}
        </div>`;
}

function extractFieldName(interaction) {
  const match = interaction.match(/(?:输入|填写|选择|上传|查看|展示|显示|编辑|修改)(.+?)(?:信息|内容|数据|字段|项)?$/);
  return match ? match[1].trim() : interaction.substring(0, 10);
}

function generateAdminPage(module) {
  const features = module.features || [];
  const sidebarItems = features.map((f, i) => `
          <div class="sidebar-item${i === 0 ? ' active' : ''}" data-page="admin-${i}" onclick="switchAdminPage(${i})">
            ${f.name}
          </div>`).join('');

  const contentPages = features.map((f, i) => {
    const tableRows = [1, 2, 3].map(j => `
              <tr>
                <td>${j}</td>
                <td>数据项 ${j}</td>
                <td>2026-04-${10 + j}</td>
                <td><span class="badge badge-success">正常</span></td>
                <td>
                  <button class="btn-sm">查看</button>
                  <button class="btn-sm btn-sm-danger">删除</button>
                </td>
              </tr>`).join('');

    return `
          <div class="admin-content${i === 0 ? ' active' : ''}" id="admin-${i}">
            <div class="content-header">
              <h3>${f.name}</h3>
              <button class="btn-primary">+ 新增</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </div>`;
  }).join('');

  return `
    <div class="admin-page" id="page-admin-${module.name.replace(/\s+/g, '-').toLowerCase()}" style="display:none;">
      <div class="admin-sidebar">
        <div class="sidebar-header">
          <h3>${module.name}</h3>
        </div>
        ${sidebarItems}
      </div>
      <div class="admin-main">
        ${contentPages}
      </div>
    </div>`;
}

function generateMobilePrototype(structure) {
  const modules = structure.modules.filter(m => m.type === 'mobile' || m.type === 'general');
  if (modules.length === 0 && structure.modules.length > 0) {
    return generateMobilePrototype({ ...structure, modules: structure.modules.slice(0, 1) });
  }

  const allPages = [];
  const navItems = [];

  for (const mod of modules) {
    for (const feature of mod.features) {
      allPages.push(generateMobilePage(feature, mod.name));
      navItems.push(feature.name);
    }
  }

  if (allPages.length === 0) {
    allPages.push(generateMobilePage(
      { name: '首页', description: '应用首页', interactions: ['浏览内容', '查看信息'] },
      '默认'
    ));
    navItems.push('首页');
  }

  const tabBar = modules.length > 0 ? `
      <div class="tab-bar">
        <div class="tab-item active" onclick="switchTab(this, 0)">
          <span class="tab-icon">🏠</span>
          <span class="tab-label">首页</span>
        </div>
        <div class="tab-item" onclick="switchTab(this, 1)">
          <span class="tab-icon">📋</span>
          <span class="tab-label">列表</span>
        </div>
        <div class="tab-item" onclick="switchTab(this, 2)">
          <span class="tab-icon">👤</span>
          <span class="tab-label">我的</span>
        </div>
      </div>` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${structure.projectName || '原型'} - 移动端</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
      background: ${COLORS.bg};
      color: ${COLORS.text};
      font-size: 14px;
      line-height: 1.6;
    }
    .phone-container {
      width: 375px; height: 812px;
      margin: 20px auto;
      background: ${COLORS.white};
      border-radius: 20px;
      overflow: hidden;
      box-shadow: ${COLORS.shadow};
      position: relative;
      display: flex; flex-direction: column;
    }
    .page { display: none; height: 100%; flex-direction: column; }
    .page.active { display: flex; }
    .navbar {
      background: ${COLORS.primary}; color: white;
      padding: 15px 20px;
      display: flex; justify-content: space-between; align-items: center;
      height: 60px; flex-shrink: 0;
    }
    .nav-back { font-size: 24px; cursor: pointer; }
    .nav-title { font-size: 17px; font-weight: 600; }
    .nav-action { width: 24px; }
    .page-content {
      flex: 1; overflow-y: auto; padding: 16px;
      -webkit-overflow-scrolling: touch;
    }
    .tab-bar {
      display: flex; background: white;
      border-top: 1px solid ${COLORS.border};
      padding: 8px 0; flex-shrink: 0;
    }
    .tab-item {
      flex: 1; text-align: center; cursor: pointer;
      color: ${COLORS.textSecondary}; font-size: 12px;
    }
    .tab-item.active { color: ${COLORS.primary}; }
    .tab-icon { display: block; font-size: 20px; }
    .tab-label { display: block; margin-top: 2px; }
    .form-container { padding: 0; }
    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block; font-size: 14px; color: ${COLORS.text};
      margin-bottom: 6px; font-weight: 500;
    }
    .form-input {
      width: 100%; padding: 10px 12px;
      border: 1px solid ${COLORS.border}; border-radius: 8px;
      font-size: 14px; outline: none;
    }
    .form-input:focus { border-color: ${COLORS.primary}; }
    .form-select {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border: 1px solid ${COLORS.border};
      border-radius: 8px; cursor: pointer;
    }
    .select-placeholder { color: ${COLORS.textSecondary}; }
    .select-arrow { color: ${COLORS.textSecondary}; }
    .upload-area {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 24px;
      border: 2px dashed ${COLORS.border}; border-radius: 8px;
      cursor: pointer; color: ${COLORS.textSecondary};
    }
    .upload-icon { font-size: 32px; margin-bottom: 4px; }
    .btn-primary {
      background: ${COLORS.primary}; color: white;
      border: none; padding: 12px 24px; border-radius: 8px;
      font-size: 16px; cursor: pointer; width: 100%;
    }
    .btn-block { display: block; width: 100%; }
    .search-bar { margin-bottom: 12px; }
    .search-input {
      width: 100%; padding: 10px 12px;
      border: 1px solid ${COLORS.border}; border-radius: 20px;
      font-size: 14px; outline: none;
    }
    .list-container { }
    .list-item {
      background: white; border-radius: 8px;
      padding: 12px; margin-bottom: 8px;
      border: 1px solid ${COLORS.border};
    }
    .item-header { display: flex; justify-content: space-between; align-items: center; }
    .item-title { font-weight: 600; }
    .item-status {
      font-size: 12px; padding: 2px 8px; border-radius: 10px;
    }
    .status-processing { background: #FFF3E0; color: #E65100; }
    .status-success { background: #E8F5E9; color: #2E7D32; }
    .item-desc {
      color: ${COLORS.textSecondary}; font-size: 13px;
      margin-top: 6px;
    }
    .item-footer { margin-top: 6px; }
    .item-time { font-size: 12px; color: ${COLORS.textSecondary}; }
    .detail-card {
      background: white; border-radius: 8px;
      padding: 16px; border: 1px solid ${COLORS.border};
    }
    .detail-header { margin-bottom: 12px; }
    .detail-status {
      font-size: 12px; padding: 4px 12px; border-radius: 10px;
      display: inline-block;
    }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid ${COLORS.border};
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: ${COLORS.textSecondary}; font-size: 13px; }
    .info-value { font-size: 14px; }
    .page-nav {
      display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;
    }
    .page-nav-btn {
      padding: 6px 12px; border-radius: 16px;
      border: 1px solid ${COLORS.border}; background: white;
      cursor: pointer; font-size: 12px;
    }
    .page-nav-btn.active {
      background: ${COLORS.primary}; color: white;
      border-color: ${COLORS.primary};
    }
  </style>
</head>
<body>
  <div class="page-nav">
    ${navItems.map((name, i) => `<button class="page-nav-btn${i === 0 ? ' active' : ''}" onclick="showPage(${i})">${name}</button>`).join('')}
  </div>
  <div class="phone-container">
    ${allPages.map((p, i) => p.replace('class="page"', `class="page${i === 0 ? ' active' : ''}"`)).join('\n')}
    ${tabBar}
  </div>
  <script>
    function showPage(idx) {
      document.querySelectorAll('.page').forEach((p, i) => {
        p.classList.toggle('active', i === idx);
      });
      document.querySelectorAll('.page-nav-btn').forEach((b, i) => {
        b.classList.toggle('active', i === idx);
      });
    }
    function goBack() { showPage(0); }
    function switchTab(el, idx) {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    }
  </script>
</body>
</html>`;
}

function generateAdminPrototype(structure) {
  const modules = structure.modules.filter(m => m.type === 'admin');
  if (modules.length === 0) return null;

  const loginPage = `
    <div class="login-page" id="loginPage">
      <div class="login-container">
        <div class="login-logo">
          <h1>${structure.projectName || '管理系统'}</h1>
          <p>管理后台</p>
        </div>
        <div class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" class="form-input" placeholder="请输入用户名" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" class="form-input" placeholder="请输入密码" />
          </div>
          <button class="btn-primary" onclick="doLogin()">登 录</button>
        </div>
      </div>
    </div>`;

  const adminPages = modules.map(m => generateAdminPage(m)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${structure.projectName || '原型'} - 管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
      background: ${COLORS.bg}; color: ${COLORS.text};
      font-size: 14px; line-height: 1.6;
    }
    .login-page {
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; background: linear-gradient(135deg, ${COLORS.primary}, #1a237e);
    }
    .login-container {
      background: white; border-radius: 12px; padding: 40px;
      width: 400px; box-shadow: ${COLORS.shadow};
    }
    .login-logo { text-align: center; margin-bottom: 32px; }
    .login-logo h1 { color: ${COLORS.primary}; font-size: 24px; }
    .login-logo p { color: ${COLORS.textSecondary}; margin-top: 4px; }
    .login-form .form-group { margin-bottom: 20px; }
    .login-form label {
      display: block; font-size: 14px; margin-bottom: 6px; font-weight: 500;
    }
    .form-input {
      width: 100%; padding: 10px 12px;
      border: 1px solid ${COLORS.border}; border-radius: 8px;
      font-size: 14px; outline: none;
    }
    .form-input:focus { border-color: ${COLORS.primary}; }
    .btn-primary {
      background: ${COLORS.primary}; color: white;
      border: none; padding: 12px 24px; border-radius: 8px;
      font-size: 16px; cursor: pointer; width: 100%;
    }
    .admin-page {
      display: flex; min-height: 100vh;
    }
    .admin-sidebar {
      width: 220px; background: #1a1a2e; color: white;
      padding: 20px 0; flex-shrink: 0;
    }
    .sidebar-header {
      padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-header h3 { font-size: 16px; }
    .sidebar-item {
      padding: 12px 20px; cursor: pointer;
      color: rgba(255,255,255,0.7); font-size: 14px;
    }
    .sidebar-item:hover { background: rgba(255,255,255,0.05); }
    .sidebar-item.active { background: ${COLORS.primary}; color: white; }
    .admin-main { flex: 1; padding: 24px; }
    .admin-content { display: none; }
    .admin-content.active { display: block; }
    .content-header {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 20px;
    }
    .content-header h3 { font-size: 20px; }
    .table-container {
      background: white; border-radius: 8px;
      overflow: hidden; box-shadow: ${COLORS.shadow};
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      background: ${COLORS.primaryLight}; padding: 12px 16px;
      text-align: left; font-weight: 600; font-size: 13px;
    }
    .data-table td {
      padding: 12px 16px; border-bottom: 1px solid ${COLORS.border};
    }
    .badge {
      padding: 2px 8px; border-radius: 10px; font-size: 12px;
    }
    .badge-success { background: #E8F5E9; color: #2E7D32; }
    .btn-sm {
      padding: 4px 8px; border: 1px solid ${COLORS.border};
      border-radius: 4px; cursor: pointer; font-size: 12px;
      background: white; margin-right: 4px;
    }
    .btn-sm-danger { color: ${COLORS.danger}; border-color: ${COLORS.danger}; }
    .stats-row {
      display: flex; gap: 16px; margin-bottom: 20px;
    }
    .stat-card {
      flex: 1; background: white; border-radius: 8px;
      padding: 20px; box-shadow: ${COLORS.shadow};
    }
    .stat-value { font-size: 28px; font-weight: 700; color: ${COLORS.primary}; }
    .stat-label { color: ${COLORS.textSecondary}; font-size: 13px; margin-top: 4px; }
  </style>
</head>
<body>
  ${loginPage}
  ${adminPages}
  <script>
    function doLogin() {
      document.getElementById('loginPage').style.display = 'none';
      document.querySelectorAll('.admin-page').forEach(p => p.style.display = 'flex');
    }
    function switchAdminPage(idx) {
      document.querySelectorAll('.sidebar-item').forEach((item, i) => {
        item.classList.toggle('active', i === idx);
      });
      document.querySelectorAll('.admin-content').forEach((content, i) => {
        content.classList.toggle('active', i === idx);
      });
    }
  </script>
</body>
</html>`;
}

function generatePrototypes(structure, outputDir) {
  const prototypeDir = path.join(outputDir, 'prototype');
  fs.mkdirSync(prototypeDir, { recursive: true });

  const results = {
    mobile: null,
    admin: null,
  };

  const mobileHtml = generateMobilePrototype(structure);
  const mobilePath = path.join(prototypeDir, 'index.html');
  fs.writeFileSync(mobilePath, mobileHtml, 'utf8');
  results.mobile = mobilePath;
  console.log(`[prototype-generator] Mobile prototype: ${mobilePath}`);

  const adminHtml = generateAdminPrototype(structure);
  if (adminHtml) {
    const adminPath = path.join(prototypeDir, 'admin.html');
    fs.writeFileSync(adminPath, adminHtml, 'utf8');
    results.admin = adminPath;
    console.log(`[prototype-generator] Admin prototype: ${adminPath}`);
  }

  return results;
}

module.exports = {
  generatePrototypes,
  generateMobilePrototype,
  generateAdminPrototype,
};
