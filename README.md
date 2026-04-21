# lark-req-prototype

<p align="center">
  <strong>📖 从飞书需求文档 → 🎨 可交互HTML原型 → 📋 需求规格说明书（SRS）</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Feishu-Lark%20CLI-orange" alt="Feishu">
</p>

---

## ✨ 功能特性

- **🔗 飞书文档读取** — 直接通过飞书文档 URL/Token 读取需求文档内容，支持 docx/wiki 链接
- **🧠 智能结构解析** — 自动解析需求文档的标题层级，提取功能模块、交互逻辑、用户角色等结构化信息
- **📱 HTML 原型生成** — 根据解析结果自动生成可交互的 HTML 原型页面（移动端 + 管理后台）
- **📸 自动截图** — 使用 Puppeteer 对原型页面自动截图，支持多页面批量截图
- **📋 SRS 文档生成** — 基于 IEEE 830 / GB/T 8567 权威模板生成需求规格说明书
- **🖼️ 截图嵌入** — 原型截图自动嵌入 SRS 文档对应的功能描述模块
- **☁️ 飞书回传** — 支持将 SRS 文档和原型上传回飞书云文档

## 📐 工作流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  飞书需求文档  │────▶│  结构化解析   │────▶│  HTML 原型   │
│  (URL/Token) │     │  (模块/功能)  │     │  (可交互)    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  飞书云文档   │◀────│  SRS 生成    │◀────│  自动截图    │
│  (上传回传)   │     │  (含截图)    │     │  (Puppeteer) │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 🚀 快速开始

### 前置条件

- **Node.js** >= 18.0.0
- **lark-cli** — 飞书命令行工具（用于读取飞书文档和上传）
- **Chrome / Edge** — 浏览器（用于原型截图）

### 安装

```bash
# 克隆仓库
git clone https://github.com/Christin-Yang/lark-req-prototype.git
cd lark-req-prototype

# 安装依赖
npm install
```

### 飞书认证

首次使用前需完成飞书 CLI 认证：

```bash
npx @larksuite/cli auth login --domain <your-domain>
```

### 基本使用

```bash
# 完整流程：读取文档 → 生成原型 → 截图 → 生成SRS
npx lark-req-prototype generate --doc "https://xxx.feishu.cn/docx/xxxxxx"

# 指定输出目录
npx lark-req-prototype generate --doc "https://xxx.feishu.cn/docx/xxxxxx" -o ./my-output

# 仅生成原型
npx lark-req-prototype generate --doc "https://xxx.feishu.cn/docx/xxxxxx" --step prototype

# 仅生成SRS（需要已有原型和截图）
npx lark-req-prototype generate --doc "https://xxx.feishu.cn/docx/xxxxxx" --step srs

# 生成并上传到飞书
npx lark-req-prototype generate --doc "https://xxx.feishu.cn/docx/xxxxxx" --upload

# 对已有原型截图
npx lark-req-prototype screenshot -i ./output/prototype -o ./output/screenshots
```

## 📖 命令详解

### `generate` — 完整生成流程

| 参数 | 必填 | 说明 |
|------|------|------|
| `--doc <url_or_token>` | ✅ | 飞书文档 URL 或 Token（支持 docx/wiki 链接） |
| `-o, --output <dir>` | ❌ | 输出目录，默认 `./output` |
| `--step <step>` | ❌ | 执行步骤：`all`（默认）、`fetch`、`prototype`、`screenshot`、`srs` |
| `--upload` | ❌ | 上传结果到飞书 |
| `--srs-doc <doc_id>` | ❌ | 指定上传 SRS 的飞书文档 ID |
| `--as-bot` | ❌ | 使用机器人身份（默认 true） |
| `--version <version>` | ❌ | SRS 文档版本号，默认 `1.0` |

### `screenshot` — 原型截图

| 参数 | 必填 | 说明 |
|------|------|------|
| `-i, --input <dir>` | ✅ | 原型 HTML 文件所在目录 |
| `-o, --output <dir>` | ❌ | 截图输出目录，默认 `./output/screenshots` |

## 📂 输出目录结构

```
output/
├── prototype/                    # HTML 原型文件
│   ├── index.html               # 移动端原型（可直接浏览器打开）
│   └── admin.html               # 管理后台原型
├── screenshots/                  # 原型截图
│   ├── mobile-首页.png
│   ├── mobile-提交需求.png
│   ├── admin-login.png
│   └── admin-数据看板.png
├── srs.md                        # 需求规格说明书（Markdown）
└── structure.json                # 解析出的需求结构（JSON）
```

## 📋 SRS 文档模板

生成的需求规格说明书基于 **IEEE 830-1998** 和 **GB/T 8567-2006** 标准，包含以下章节：

```
1. 引言
   1.1 目的
   1.2 范围
   1.3 术语定义
   1.4 参考资料
2. 总体描述
   2.1 产品视角
   2.2 用户特征
   2.3 运行环境
   2.4 设计约束
   2.5 假设与依赖
3. 功能需求
   3.x 功能模块名
       3.x.y 功能点
         - 功能描述
         - 原型截图 ← 自动嵌入
         - 交互逻辑
         - 输入/输出
         - 业务规则
         - 异常处理
4. 非功能需求
   4.1 性能需求
   4.2 安全需求
   4.3 可用性需求
   4.4 兼容性需求
5. 接口需求
6. 数据需求
7. 质量属性
附录
```

## 🧩 需求文档格式要求

为获得最佳解析效果，飞书需求文档建议遵循以下格式：

```markdown
# 项目名称

## 概述
项目背景和目标描述...

## 功能模块A（移动端）
模块描述...

### 功能点1
- 用户可以输入xxx
- 用户可以选择xxx
- 提交后显示xxx

### 功能点2
- 查看列表
- 点击查看详情

## 管理后台
### 数据看板
- 查看统计数据
- 导出报表

## 非功能需求
- 页面加载不超过3秒
- 支持1000并发
```

### 解析规则

| 标题层级 | 解析为 |
|----------|--------|
| `#` 一级标题 | 项目名称 |
| `##` 二级标题 | 功能模块（自动识别类型：移动端/管理后台/接口） |
| `###` 三级标题 | 具体功能点 |
| `-` 列表项 | 交互逻辑/功能描述 |
| 表格 | 数据字段/接口定义 |

### 模块类型自动识别

| 关键词 | 识别为 | 原型尺寸 |
|--------|--------|----------|
| 管理/后台/admin/dashboard | 管理后台 | 1440×900 |
| 小程序/移动/h5/mobile/微信 | 移动端 | 375×812 |
| 接口/api/服务/后端 | API模块（不生成原型） | — |
| 其他 | 通用模块 | 375×812 |

## 🔧 作为 lark-cli Skill 使用

本项目也可作为 lark-cli 的 Skill 集成使用：

1. 将 `lark-req-prototype` 目录复制到 lark-cli 的 skills 目录
2. 在 Trae IDE 中，当需要从飞书文档生成原型或 SRS 时，AI 会自动调用此 Skill

### Skill 触发场景

- "帮我从这个飞书文档生成原型"
- "根据需求文档生成需求规格说明书"
- "把这个飞书链接的需求做成原型"
- "生成SRS文档，原型截图嵌入到功能描述里"

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Node.js | 运行时环境 |
| lark-cli | 飞书文档读写 |
| Puppeteer | 原型页面截图 |
| Commander.js | CLI 命令行框架 |

## 📊 项目结构

```
lark-req-prototype/
├── SKILL.md                      # lark-cli Skill 配置
├── README.md                     # 本文档
├── package.json                  # NPM 包配置
├── LICENSE                       # MIT 许可证
├── .gitignore
├── bin/
│   └── cli.js                    # CLI 入口
├── src/
│   ├── index.js                  # 主编排流程
│   ├── doc-reader.js             # 飞书文档读取与解析
│   ├── prototype-generator.js    # HTML 原型生成
│   ├── screenshot-capture.js     # Puppeteer 截图
│   ├── srs-generator.js          # SRS 文档生成
│   └── uploader.js               # 飞书上传
└── templates/                    # 模板目录（可自定义）
```

## ⚙️ 自定义

### 自定义 SRS 模板

编辑 `src/srs-generator.js` 中的 `generateSRS` 函数，修改 SRS 文档的结构和内容。

### 自定义原型样式

编辑 `src/prototype-generator.js` 中的 `COLORS` 常量和页面生成函数，修改原型的视觉风格。

### 自定义截图策略

编辑 `src/screenshot-capture.js`，修改截图的视口大小、等待时间、选择器等参数。

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [lark-cli](https://github.com/larksuite) — 飞书命令行工具
- [Puppeteer](https://pptr.dev/) — 浏览器自动化
- [IEEE 830-1998](https://standards.ieee.org/ieee/830/2040/) — 软件需求规格说明标准
- [GB/T 8567-2006](https://openstd.samr.gov.cn/) — 计算机软件文档编制规范
