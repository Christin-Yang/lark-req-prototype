---
name: lark-req-prototype
version: 1.0.0
description: "读取飞书需求文档，自动生成HTML原型和需求规格说明书（SRS），原型截图嵌入SRS对应功能模块。当用户需要从飞书文档生成原型、生成需求规格说明书、或需要将原型截图嵌入需求文档时使用。"
metadata:
  requires:
    bins: ["lark-cli", "node"]
---

# lark-req-prototype

> **前置条件：** 先阅读 [`../lark-shared/SKILL.md`](../lark-shared/SKILL.md) 了解认证、权限处理。

## 概述

本 Skill 实现从飞书需求文档到可交互原型 + 需求规格说明书的自动化生成流程：

1. **读取飞书文档** — 通过 `lark-cli docs +fetch` 获取需求文档内容
2. **解析需求结构** — 提取功能模块、页面、交互逻辑等结构化信息
3. **生成 HTML 原型** — 基于解析结果生成可交互的 HTML 原型页面
4. **截图原型页面** — 使用 Puppeteer 对原型页面自动截图
5. **生成 SRS 文档** — 基于 IEEE 830 / GB/T 8567 模板生成需求规格说明书，原型截图嵌入对应功能描述模块
6. **上传至飞书** — 将 SRS 文档和原型上传回飞书云文档

## 完整工作流

### Step 1: 读取飞书需求文档

```bash
# 读取文档内容（支持 docx/wiki 链接）
lark-cli docs +fetch --doc "<doc_url_or_token>" --format json
```

对于 Wiki 链接，需先解析真实 token：
```bash
lark-cli wiki spaces get_node --params '{"token":"<wiki_token>"}'
```

### Step 2: 解析需求文档结构

从获取的 Markdown 内容中提取：
- 项目名称和概述
- 功能模块列表（按标题层级解析）
- 每个模块的功能点描述
- 用户角色和权限
- 非功能性需求

解析规则：
- `#` 一级标题 → 项目名称
- `##` 二级标题 → 功能模块
- `###` 三级标题 → 具体功能点
- 列表项 → 功能描述/交互逻辑
- 表格 → 数据字段/接口定义

### Step 3: 生成 HTML 原型

根据解析出的功能模块，生成可交互的 HTML 原型：

- **移动端原型**：375×812 尺寸，模拟手机界面
- **管理后台原型**：1440×900 尺寸，模拟桌面端界面
- 每个功能模块对应一个原型页面
- 页面间通过导航切换

原型文件输出到 `./output/prototype/` 目录，可直接用浏览器打开。

### Step 4: 截图原型页面

使用 Puppeteer 对每个原型页面自动截图：

```bash
node src/screenshot-capture.js --input ./output/prototype --output ./output/screenshots
```

截图命名规则：`{模块名}-{页面名}.png`

### Step 5: 生成需求规格说明书（SRS）

基于权威模板（IEEE 830 / GB/T 8567）生成 SRS，结构如下：

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
   3.x.1 功能描述
   3.x.2 原型截图  ← 嵌入截图
   3.x.3 输入/输出
   3.x.4 业务规则
   3.x.5 异常处理
4. 非功能需求
   4.1 性能需求
   4.2 安全需求
   4.3 可用性需求
   4.4 兼容性需求
5. 接口需求
   5.1 用户接口
   5.2 外部接口
   5.3 内部接口
6. 数据需求
7. 质量属性
附录
```

截图以 `<image>` 标签嵌入，上传飞书后自动替换为飞书图片 token。

### Step 6: 上传至飞书

```bash
# 创建 SRS 文档
lark-cli docs +create --markdown "@./output/srs.md" --title "需求规格说明书 - {项目名}"

# 或上传截图后插入已有文档
lark-cli docs +media-insert --doc "<doc_id>" --file ./output/screenshots/xxx.png --caption "图x：xxx原型"
```

## 命令速查

| 操作 | 命令 |
|------|------|
| 完整流程 | `npx lark-req-prototype --doc "<url>"` |
| 仅生成原型 | `npx lark-req-prototype --doc "<url>" --step prototype` |
| 仅生成SRS | `npx lark-req-prototype --doc "<url>" --step srs` |
| 仅截图 | `npx lark-req-prototype --screenshot ./output/prototype` |
| 指定输出目录 | `npx lark-req-prototype --doc "<url>" --output ./my-output` |
| 上传到飞书 | `npx lark-req-prototype --doc "<url>" --upload --srs-doc "<doc_id>"` |

## 权限

| 操作 | 所需 scope |
|------|-----------|
| 读取文档 | `docs:doc:readonly` |
| 创建文档 | `docs:doc` |
| 上传图片 | `drive:drive` |
| Wiki 读取 | `wiki:wiki:readonly` |

## 注意事项

- 首次使用需先执行 `lark-cli auth login` 完成认证
- 截图功能需要安装 Chrome/Edge 浏览器
- 大文档建议分步执行（先原型 → 截图 → SRS）
- SRS 模板支持自定义，替换 `templates/srs-template.md` 即可
