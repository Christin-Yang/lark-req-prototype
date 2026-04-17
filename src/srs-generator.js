const fs = require('fs');
const path = require('path');

function generateSRS(structure, screenshots, options = {}) {
  const projectName = structure.projectName || '未命名项目';
  const date = new Date().toISOString().split('T')[0];
  const version = options.version || '1.0';

  const screenshotMap = {};
  for (const ss of screenshots) {
    screenshotMap[ss.name] = ss;
  }

  let figureIndex = 1;

  function getScreenshotTag(moduleName, featureName) {
    const searchKeys = [
      `${moduleName}-${featureName}`,
      featureName,
      `mobile-${featureName}`,
      `admin-${featureName}`,
    ];

    for (const key of searchKeys) {
      const normalizedKey = key.replace(/\s+/g, '-').toLowerCase();
      for (const ss of screenshots) {
        const normalizedName = ss.name.replace(/\s+/g, '-').toLowerCase();
        if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
          const figNum = figureIndex++;
          const width = ss.type === 'mobile' ? 375 : 1440;
          const height = ss.type === 'mobile' ? 812 : 900;
          return {
            caption: `**图${figNum}：${ss.name}原型**`,
            image: `<image src="./screenshots/${ss.file}" width="${width}" height="${height}" align="center"/>`,
            file: ss.file,
          };
        }
      }
    }
    return null;
  }

  const moduleSections = structure.modules.map((mod, modIdx) => {
    const featureSections = mod.features.map((feat, featIdx) => {
      const screenshot = getScreenshotTag(mod.name, feat.name);
      let section = '';

      section += `#### 3.${modIdx + 1}.${featIdx + 1} ${feat.name}\n\n`;
      section += `**功能描述**：${feat.description || feat.name}\n\n`;

      if (screenshot) {
        section += `${screenshot.caption}\n\n`;
        section += `${screenshot.image}\n\n`;
      }

      if (feat.interactions && feat.interactions.length > 0) {
        section += `**交互逻辑**：\n\n`;
        for (const interaction of feat.interactions) {
          section += `- ${interaction}\n`;
        }
        section += '\n';
      }

      section += `**输入**：用户操作输入\n\n`;
      section += `**输出**：功能响应结果\n\n`;
      section += `**业务规则**：\n\n`;
      section += `- 输入数据需进行格式校验\n`;
      section += `- 操作结果需提供明确反馈\n`;
      section += `- 异常情况需有友好的错误提示\n\n`;

      return section;
    }).join('\n');

    let moduleSection = `### 3.${modIdx + 1} ${mod.name}\n\n`;
    moduleSection += `${mod.description || `${mod.name}模块提供以下功能：`}\n\n`;
    moduleSection += featureSections;

    return moduleSection;
  }).join('\n');

  const nonFunctionalSection = structure.nonFunctionalReqs.length > 0
    ? structure.nonFunctionalReqs.map((req, i) => `- ${req}`).join('\n')
    : `- 页面加载时间不超过 3 秒
- 系统支持 1000 并发用户
- 数据传输采用 HTTPS 加密
- 用户密码采用加密存储
- 系统可用性不低于 99.9%
- 支持 Chrome、Firefox、Safari、Edge 主流浏览器
- 支持响应式布局，适配移动端和桌面端`;

  const userRolesSection = structure.userRoles.length > 0
    ? structure.userRoles.map((role, i) => `${i + 1}. ${role}`).join('\n')
    : `1. 普通用户：使用核心业务功能
2. 管理员：管理系统后台和数据`;

  const srs = `# 软件需求规格说明书（SRS）

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | ${projectName} |
| 文档版本 | V${version} |
| 编写日期 | ${date} |
| 文档状态 | 初稿 |

---

## 1. 引言

### 1.1 目的

本文档旨在全面、准确地描述${projectName}的软件需求，为系统的设计、开发、测试和验收提供依据。本文档的预期读者包括：项目经理、系统架构师、开发工程师、测试工程师和产品经理。

### 1.2 范围

${projectName}是一个面向用户的综合服务平台，旨在提供便捷的在线服务体验。系统涵盖移动端（小程序/H5）和管理后台两大终端，覆盖从用户提交需求到管理员处理的全流程。

### 1.3 术语定义

| 术语 | 定义 |
|------|------|
| SRS | 软件需求规格说明书（Software Requirements Specification） |
| UI | 用户界面（User Interface） |
| API | 应用程序编程接口（Application Programming Interface） |
| MVP | 最小可行产品（Minimum Viable Product） |

### 1.4 参考资料

- IEEE Std 830-1998《软件需求规格说明推荐实践》
- GB/T 8567-2006《计算机软件文档编制规范》
- ${projectName}需求文档（飞书链接）

---

## 2. 总体描述

### 2.1 产品视角

${projectName}是一个独立运行的软件系统，包含以下子系统：

- **移动端**：面向终端用户，提供业务操作入口
- **管理后台**：面向运营管理人员，提供数据管理和系统配置能力

### 2.2 用户特征

${userRolesSection}

### 2.3 运行环境

| 环境 | 要求 |
|------|------|
| 客户端（移动端） | 微信小程序 / H5 浏览器 |
| 客户端（管理端） | Chrome 90+ / Edge 90+ / Firefox 90+ |
| 服务端 | Linux / Windows Server |
| 数据库 | MySQL 8.0+ / PostgreSQL 14+ |
| 运行时 | Node.js 18+ |

### 2.4 设计约束

- 前端采用响应式设计，适配多种屏幕尺寸
- 后端采用 RESTful API 设计规范
- 数据存储需满足数据安全合规要求
- 系统需支持水平扩展

### 2.5 假设与依赖

${structure.assumptions.length > 0
    ? structure.assumptions.map(a => `- ${a}`).join('\n')
    : `- 用户具备基本的智能手机操作能力
- 网络环境稳定，带宽满足数据传输需求
- 第三方服务（短信、支付等）可用性有保障`}

---

## 3. 功能需求

${moduleSections || `### 3.1 核心功能

暂无具体功能模块定义，请参考需求文档。`}

---

## 4. 非功能需求

### 4.1 性能需求

${nonFunctionalSection}

### 4.2 安全需求

- 用户认证采用 Token 机制，会话超时自动失效
- 敏感数据传输使用 HTTPS 加密
- 用户密码使用 bcrypt 加密存储
- 关键操作需进行权限校验
- 防止 SQL 注入、XSS、CSRF 等常见安全攻击

### 4.3 可用性需求

- 界面设计遵循一致性原则，操作流程直观
- 关键操作提供确认提示，防止误操作
- 错误信息清晰明确，提供解决建议
- 支持操作撤销/回退

### 4.4 兼容性需求

- 移动端适配 iOS 14+ 和 Android 10+
- 管理端支持 Chrome、Firefox、Safari、Edge 最新两个主版本
- 屏幕适配：移动端 375px-428px，管理端 1280px-1920px

---

## 5. 接口需求

### 5.1 用户接口

- 移动端：微信小程序原生界面 / H5 响应式页面
- 管理端：Web 浏览器界面，左侧导航 + 右侧内容区布局

### 5.2 外部接口

| 接口类型 | 说明 |
|----------|------|
| 短信接口 | 用于验证码发送 |
| 文件存储 | 用于图片、文件上传和访问 |
| 支付接口 | 用于在线支付（如需要） |

### 5.3 内部接口

系统内部采用 RESTful API 风格，接口规范如下：

- 请求格式：JSON
- 响应格式：JSON
- 认证方式：Bearer Token
- 编码：UTF-8

---

## 6. 数据需求

### 6.1 数据实体

系统主要数据实体包括：

${structure.modules.map((mod, i) => `${i + 1}. ${mod.name}相关数据`).join('\n') || '1. 核心业务数据'}

### 6.2 数据存储

- 业务数据存储于关系型数据库
- 文件/图片存储于对象存储服务
- 缓存数据存储于 Redis

### 6.3 数据迁移

- 支持数据导出为标准格式（CSV/JSON）
- 提供数据备份和恢复机制

---

## 7. 质量属性

| 质量属性 | 要求 |
|----------|------|
| 可靠性 | 系统故障率 < 0.1%，关键数据不丢失 |
| 可维护性 | 代码覆盖率 > 80%，模块化设计，低耦合 |
| 可扩展性 | 支持插件式功能扩展，API 版本化管理 |
| 可移植性 | 容器化部署，支持多云环境 |

---

## 附录

### 附录 A：原型截图索引

${screenshots.map((ss, i) => `${i + 1}. ${ss.name} — ${ss.file}`).join('\n') || '暂无原型截图'}

### 附录 B：修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| V${version} | ${date} | 初稿 | - |
`;

  return srs;
}

function saveSRS(srsContent, outputDir) {
  const srsDir = path.join(outputDir);
  fs.mkdirSync(srsDir, { recursive: true });

  const srsPath = path.join(srsDir, 'srs.md');
  fs.writeFileSync(srsPath, srsContent, 'utf8');
  console.log(`[srs-generator] SRS saved: ${srsPath}`);

  return srsPath;
}

module.exports = {
  generateSRS,
  saveSRS,
};
