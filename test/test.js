const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(SKILL_DIR, 'test-output');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, detail) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.log(`  ❌ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
    failCount++;
    failures.push(testName);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

async function runTests() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🧪 lark-req-prototype 本地测试套件');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📂 Skill 目录: ${SKILL_DIR}`);
  console.log(`📂 输出目录: ${OUTPUT_DIR}`);

  await testSkillStructure();
  await testDocReader();
  await testPrototypeGenerator();
  await testSRSGenerator();
  await testCLI();
  await testEndToEnd();

  section('测试结果汇总');
  console.log(`\n  总计: ${passCount + failCount} 项`);
  console.log(`  ✅ 通过: ${passCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  if (failures.length > 0) {
    console.log('\n  失败项:');
    failures.forEach((f) => console.log(`    - ${f}`));
  }
  console.log(`\n  结果: ${failCount === 0 ? '🎉 全部通过！' : '⚠️ 存在失败项，请检查'}`);

  process.exit(failCount > 0 ? 1 : 0);
}

async function testSkillStructure() {
  section('测试1: SKILL 结构完整性');

  const skillMdPath = path.join(SKILL_DIR, 'SKILL.md');
  assert(fs.existsSync(skillMdPath), 'SKILL.md 文件存在');

  if (fs.existsSync(skillMdPath)) {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    assert(content.includes('name:'), 'SKILL.md 包含 name 字段');
    assert(content.includes('description:'), 'SKILL.md 包含 description 字段');
    assert(content.includes('lark-cli'), 'SKILL.md 引用 lark-cli');
    assert(content.includes('docs +fetch'), 'SKILL.md 包含 docs +fetch 命令');
    assert(content.includes('docs +create') || content.includes('docs +update'), 'SKILL.md 包含文档创建/更新命令');
  }

  const srcDir = path.join(SKILL_DIR, 'src');
  assert(fs.existsSync(srcDir), 'src 目录存在');

  const requiredFiles = [
    'src/doc-reader.js',
    'src/prototype-generator.js',
    'src/screenshot-capture.js',
    'src/srs-generator.js',
    'src/uploader.js',
    'src/index.js',
    'bin/cli.js',
    'package.json',
    'README.md',
    'LICENSE',
  ];

  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(SKILL_DIR, file)), `${file} 文件存在`);
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'package.json'), 'utf8'));
  assert(packageJson.name === 'lark-req-prototype', 'package.json name 正确');
  assert(packageJson.bin !== undefined, 'package.json 包含 bin 配置');
  assert(packageJson.dependencies.puppeteer, 'package.json 包含 puppeteer 依赖');
  assert(packageJson.dependencies.commander, 'package.json 包含 commander 依赖');
}

async function testDocReader() {
  section('测试2: 需求文档解析模块 (doc-reader)');

  const { parseRequirementStructure, extractTokenFromUrl } = require(path.join(SKILL_DIR, 'src/doc-reader'));

  assert(typeof parseRequirementStructure === 'function', 'parseRequirementStructure 是函数');
  assert(typeof extractTokenFromUrl === 'function', 'extractTokenFromUrl 是函数');

  const testUrl1 = 'https://xxx.feishu.cn/docx/ABC123xyz';
  const result1 = extractTokenFromUrl(testUrl1);
  assert(result1 !== null, 'docx URL 解析成功');
  assert(result1?.token === 'ABC123xyz', 'docx URL token 提取正确');
  assert(result1?.type === 'docx', 'docx URL 类型识别正确');

  const testUrl2 = 'https://xxx.feishu.cn/wiki/WikiToken456';
  const result2 = extractTokenFromUrl(testUrl2);
  assert(result2 !== null, 'wiki URL 解析成功');
  assert(result2?.token === 'WikiToken456', 'wiki URL token 提取正确');
  assert(result2?.type === 'wiki', 'wiki URL 类型识别正确');

  const testUrl3 = 'PlainToken789';
  const result3 = extractTokenFromUrl(testUrl3);
  assert(result3 !== null, '纯 token 解析成功');
  assert(result3?.token === 'PlainToken789', '纯 token 提取正确');

  const testUrl4 = '';
  const result4 = extractTokenFromUrl(testUrl4);
  assert(result4 === null, '空输入返回 null');

  const sampleMarkdown = `# 家电维修助手

## 概述
这是一个家电维修服务平台。

## 小程序端
小程序端提供用户提交维修需求的功能。

### 首页
- 浏览服务项目
- 查看推荐维修师傅
- 搜索维修服务

### 提交维修需求
- 输入家电类型
- 选择故障类型
- 填写故障描述
- 上传故障照片
- 提交维修需求

### 工单列表
- 查看我的工单
- 按状态筛选工单

### 工单详情
- 查看工单详细信息
- 查看维修进度
- 联系维修师傅

### 评价服务
- 对维修服务评分
- 填写评价内容
- 上传评价图片

## 管理后台
管理后台供运营人员使用。

### 管理员登录
- 输入用户名密码
- 登录系统

### 数据看板
- 查看工单统计
- 查看收入统计
- 导出报表

## 非功能需求
- 页面加载不超过3秒
- 支持1000并发用户
- 数据传输加密

## 用户角色
- 普通用户：提交维修需求
- 维修师傅：接单和维修
- 管理员：系统管理
`;

  const structure = parseRequirementStructure(sampleMarkdown);

  assert(structure.projectName === '家电维修助手', `项目名称解析正确: "${structure.projectName}"`);
  assert(structure.modules.length >= 2, `模块数量正确: ${structure.modules.length} >= 2`);

  const mobileModule = structure.modules.find((m) => m.name === '小程序端');
  assert(mobileModule !== undefined, '找到小程序端模块');
  assert(mobileModule?.type === 'mobile', `小程序端类型识别为 mobile: ${mobileModule?.type}`);
  assert(mobileModule?.features.length === 5, `小程序端功能点数量: ${mobileModule?.features.length}`);

  const adminModule = structure.modules.find((m) => m.name === '管理后台');
  assert(adminModule !== undefined, '找到管理后台模块');
  assert(adminModule?.type === 'admin', `管理后台类型识别为 admin: ${adminModule?.type}`);

  const homeFeature = mobileModule?.features.find((f) => f.name === '首页');
  assert(homeFeature !== undefined, '找到首页功能点');
  assert(homeFeature?.interactions.length === 3, `首页交互逻辑数量: ${homeFeature?.interactions.length}`);

  assert(structure.nonFunctionalReqs.length >= 3, `非功能需求数量: ${structure.nonFunctionalReqs.length}`);
  assert(structure.userRoles.length >= 3, `用户角色数量: ${structure.userRoles.length}`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'parsed-structure.json'), JSON.stringify(structure, null, 2), 'utf8');
  console.log('  📄 解析结果已保存到 test-output/parsed-structure.json');
}

async function testPrototypeGenerator() {
  section('测试3: 原型生成模块 (prototype-generator)');

  const { generatePrototypes } = require(path.join(SKILL_DIR, 'src/prototype-generator'));

  const structure = {
    projectName: '测试项目',
    overview: '测试项目概述',
    modules: [
      {
        name: '小程序端',
        type: 'mobile',
        description: '移动端功能',
        features: [
          {
            name: '首页',
            description: '应用首页',
            interactions: ['浏览内容', '搜索服务', '查看推荐'],
          },
          {
            name: '提交需求',
            description: '提交维修需求',
            interactions: ['输入家电类型', '选择故障类型', '填写描述', '上传照片', '提交'],
          },
          {
            name: '工单列表',
            description: '查看工单列表',
            interactions: ['查看列表', '按状态筛选'],
          },
          {
            name: '工单详情',
            description: '查看工单详情',
            interactions: ['查看详情', '查看进度', '联系师傅'],
          },
        ],
      },
      {
        name: '管理后台',
        type: 'admin',
        description: '管理后台功能',
        features: [
          {
            name: '数据看板',
            description: '数据统计看板',
            interactions: ['查看统计', '导出报表'],
          },
          {
            name: '工单管理',
            description: '管理工单',
            interactions: ['查看列表', '分配工单', '处理工单'],
          },
        ],
      },
    ],
    nonFunctionalReqs: [],
    userRoles: [],
    assumptions: [],
  };

  const results = generatePrototypes(structure, OUTPUT_DIR);

  assert(results.mobile !== null, '移动端原型生成成功');
  assert(fs.existsSync(results.mobile), `移动端原型文件存在: ${results.mobile}`);

  const mobileHtml = fs.readFileSync(results.mobile, 'utf8');
  assert(mobileHtml.includes('phone-container'), '移动端原型包含手机容器');
  assert(mobileHtml.includes('navbar'), '移动端原型包含导航栏');
  assert(mobileHtml.includes('page-nav-btn'), '移动端原型包含页面导航按钮');
  assert(mobileHtml.includes('首页'), '移动端原型包含首页内容');
  assert(mobileHtml.includes('提交需求'), '移动端原型包含提交需求内容');
  assert(mobileHtml.includes('form-input'), '移动端原型包含表单输入');
  assert(mobileHtml.includes('list-item'), '移动端原型包含列表项');

  assert(results.admin !== null, '管理后台原型生成成功');
  assert(fs.existsSync(results.admin), `管理后台原型文件存在: ${results.admin}`);

  const adminHtml = fs.readFileSync(results.admin, 'utf8');
  assert(adminHtml.includes('login-container'), '管理后台包含登录页');
  assert(adminHtml.includes('admin-sidebar'), '管理后台包含侧边栏');
  assert(adminHtml.includes('data-table'), '管理后台包含数据表格');
  assert(adminHtml.includes('doLogin'), '管理后台包含登录函数');

  console.log('  📄 移动端原型已保存');
  console.log('  📄 管理后台原型已保存');
}

async function testSRSGenerator() {
  section('测试4: SRS 生成模块 (srs-generator)');

  const { generateSRS, saveSRS } = require(path.join(SKILL_DIR, 'src/srs-generator'));

  const structure = {
    projectName: '家电维修助手',
    overview: '家电维修服务平台',
    modules: [
      {
        name: '小程序端',
        type: 'mobile',
        description: '移动端功能模块',
        features: [
          {
            name: '首页',
            description: '应用首页，展示服务入口',
            interactions: ['浏览服务项目', '搜索维修服务'],
          },
          {
            name: '提交需求',
            description: '用户提交维修需求',
            interactions: ['输入家电类型', '填写故障描述', '提交'],
          },
        ],
      },
      {
        name: '管理后台',
        type: 'admin',
        description: '管理后台模块',
        features: [
          {
            name: '数据看板',
            description: '查看统计数据',
            interactions: ['查看统计', '导出报表'],
          },
        ],
      },
    ],
    nonFunctionalReqs: ['页面加载不超过3秒', '支持1000并发'],
    userRoles: ['普通用户', '管理员'],
    assumptions: ['用户有智能手机'],
  };

  const screenshots = [
    { name: '首页', file: 'mobile-首页.png', path: '/tmp/1.png', type: 'mobile' },
    { name: '提交需求', file: 'mobile-提交需求.png', path: '/tmp/2.png', type: 'mobile' },
    { name: '管理后台-数据看板', file: 'admin-数据看板.png', path: '/tmp/3.png', type: 'admin' },
  ];

  const srsContent = generateSRS(structure, screenshots, { version: '1.0' });

  assert(srsContent.length > 500, `SRS 内容长度: ${srsContent.length} chars`);
  assert(srsContent.includes('软件需求规格说明书'), 'SRS 包含标题');
  assert(srsContent.includes('1. 引言'), 'SRS 包含引言章节');
  assert(srsContent.includes('2. 总体描述'), 'SRS 包含总体描述章节');
  assert(srsContent.includes('3. 功能需求'), 'SRS 包含功能需求章节');
  assert(srsContent.includes('4. 非功能需求'), 'SRS 包含非功能需求章节');
  assert(srsContent.includes('5. 接口需求'), 'SRS 包含接口需求章节');
  assert(srsContent.includes('6. 数据需求'), 'SRS 包含数据需求章节');
  assert(srsContent.includes('7. 质量属性'), 'SRS 包含质量属性章节');

  assert(srsContent.includes('3.1 小程序端'), 'SRS 包含小程序端模块');
  assert(srsContent.includes('3.1.1 首页'), 'SRS 包含首页功能点');
  assert(srsContent.includes('3.1.2 提交需求'), 'SRS 包含提交需求功能点');
  assert(srsContent.includes('3.2 管理后台'), 'SRS 包含管理后台模块');

  assert(srsContent.includes('原型截图') || srsContent.includes('<image'), 'SRS 包含原型截图引用');
  assert(srsContent.includes('交互逻辑'), 'SRS 包含交互逻辑');
  assert(srsContent.includes('业务规则'), 'SRS 包含业务规则');

  assert(srsContent.includes('家电维修助手'), 'SRS 包含项目名称');
  assert(srsContent.includes('IEEE 830') || srsContent.includes('GB/T 8567'), 'SRS 引用标准模板');

  const srsPath = saveSRS(srsContent, OUTPUT_DIR);
  assert(fs.existsSync(srsPath), `SRS 文件已保存: ${srsPath}`);

  console.log('  📄 SRS 文档已保存到 test-output/srs.md');
}

async function testCLI() {
  section('测试5: CLI 命令行工具');

  const cliPath = path.join(SKILL_DIR, 'bin/cli.js');
  assert(fs.existsSync(cliPath), 'CLI 入口文件存在');

  const cliContent = fs.readFileSync(cliPath, 'utf8');
  assert(cliContent.includes('commander'), 'CLI 使用 commander 框架');
  assert(cliContent.includes('generate'), 'CLI 包含 generate 命令');
  assert(cliContent.includes('screenshot'), 'CLI 包含 screenshot 命令');
  assert(cliContent.includes('--doc'), 'CLI 包含 --doc 参数');
  assert(cliContent.includes('--output'), 'CLI 包含 --output 参数');
  assert(cliContent.includes('--step'), 'CLI 包含 --step 参数');
  assert(cliContent.includes('--upload'), 'CLI 包含 --upload 参数');

  const helpResult = await runCommand(`node "${cliPath}" --help`);
  assert(helpResult.ok, 'CLI --help 可执行');
  assert(helpResult.output.includes('lark-req-prototype'), 'CLI help 输出包含工具名');

  const generateHelpResult = await runCommand(`node "${cliPath}" generate --help`);
  assert(generateHelpResult.ok, 'CLI generate --help 可执行');
  assert(generateHelpResult.output.includes('--doc'), 'generate help 包含 --doc');
}

async function testEndToEnd() {
  section('测试6: 端到端集成测试（模拟数据）');

  const { parseRequirementStructure } = require(path.join(SKILL_DIR, 'src/doc-reader'));
  const { generatePrototypes } = require(path.join(SKILL_DIR, 'src/prototype-generator'));
  const { generateSRS, saveSRS } = require(path.join(SKILL_DIR, 'src/srs-generator'));

  const mockDoc = `# 智慧校园系统

## 概述
智慧校园管理系统，面向师生提供一站式校园服务。

## 移动端（小程序）
### 课程查询
- 按学期筛选课程
- 搜索课程名称
- 查看课程详情

### 成绩查询
- 选择学期
- 查看各科成绩
- 查看GPA

### 教室预约
- 选择日期和时段
- 选择教室
- 提交预约申请

## 管理后台
### 用户管理
- 查看用户列表
- 禁用/启用用户
- 分配角色

### 课程管理
- 新增课程
- 编辑课程信息
- 删除课程

## 非功能需求
- 系统响应时间 < 2秒
- 支持5000并发用户
`;

  const structure = parseRequirementStructure(mockDoc);
  assert(structure.projectName === '智慧校园系统', `端到端: 项目名 "${structure.projectName}"`);
  assert(structure.modules.length >= 2, `端到端: 模块数 ${structure.modules.length}`);

  const protoResults = generatePrototypes(structure, OUTPUT_DIR);
  assert(protoResults.mobile !== null, '端到端: 移动端原型生成');
  assert(protoResults.admin !== null, '端到端: 管理后台原型生成');

  const mobileHtml = fs.readFileSync(protoResults.mobile, 'utf8');
  assert(mobileHtml.includes('课程查询'), '端到端: 原型包含课程查询');
  assert(mobileHtml.includes('成绩查询'), '端到端: 原型包含成绩查询');
  assert(mobileHtml.includes('教室预约'), '端到端: 原型包含教室预约');

  const adminHtml = fs.readFileSync(protoResults.admin, 'utf8');
  assert(adminHtml.includes('用户管理'), '端到端: 管理后台包含用户管理');
  assert(adminHtml.includes('课程管理'), '端到端: 管理后台包含课程管理');

  const screenshots = [
    { name: '课程查询', file: 'mobile-课程查询.png', path: '/tmp/a.png', type: 'mobile' },
    { name: '成绩查询', file: 'mobile-成绩查询.png', path: '/tmp/b.png', type: 'mobile' },
    { name: '教室预约', file: 'mobile-教室预约.png', path: '/tmp/c.png', type: 'mobile' },
    { name: '管理后台-用户管理', file: 'admin-用户管理.png', path: '/tmp/d.png', type: 'admin' },
    { name: '管理后台-课程管理', file: 'admin-课程管理.png', path: '/tmp/e.png', type: 'admin' },
  ];

  const srsContent = generateSRS(structure, screenshots, { version: '1.0' });
  const srsPath = saveSRS(srsContent, OUTPUT_DIR);

  assert(srsContent.includes('智慧校园系统'), '端到端: SRS 包含项目名');
  assert(srsContent.includes('课程查询'), '端到端: SRS 包含课程查询');
  assert(srsContent.includes('成绩查询'), '端到端: SRS 包含成绩查询');
  assert(srsContent.includes('用户管理'), '端到端: SRS 包含用户管理');
  assert(srsContent.includes('原型截图'), '端到端: SRS 包含截图引用');

  const e2eDir = path.join(OUTPUT_DIR, 'e2e');
  fs.mkdirSync(e2eDir, { recursive: true });
  fs.writeFileSync(path.join(e2eDir, 'structure.json'), JSON.stringify(structure, null, 2), 'utf8');
  fs.writeFileSync(path.join(e2eDir, 'srs.md'), srsContent, 'utf8');

  console.log('  📄 端到端测试产物已保存到 test-output/e2e/');
}

function runCommand(cmd) {
  const { execSync } = require('child_process');
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 15000,
      cwd: SKILL_DIR,
    });
    return { ok: true, output };
  } catch (e) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || '') };
  }
}

runTests().catch((e) => {
  console.error('测试执行出错:', e.message);
  process.exit(1);
});
