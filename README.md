<p align="center">
  <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" width="80" />
</p>

<h1 align="center">周报 AI 助手</h1>

<p align="center">
  <strong>基于 Git 提交记录，AI 自动生成专业工作周报</strong>
</p>

<p align="center">
  <a href="#-功能特性">功能特性</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-使用指南">使用指南</a> •
  <a href="#-技术架构">技术架构</a> •
  <a href="#-api-文档">API 文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/Rspack-1.x-FFA500?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## ✨ 功能特性

| 特性 | 描述 |
|:---:|:---|
| 🤖 **AI 智能生成** | 基于 Git 提交记录，大模型自动生成结构化周报 |
| ⚡ **流式输出** | SSE 实时流式 + 打字机效果，逐字呈现生成内容 |
| 📊 **Git 智能分析** | 自动分析提交，按类型分类（Feature / Fix / Docs / Refactor） |
| 💬 **多轮对话精修** | 自然语言交互，持续优化周报内容 |
| 🔄 **9 模型降级** | 9 个免费模型自动切换，保证高可用性 |
| 📱 **响应式设计** | 完美适配 PC 和移动端 |
| 📥 **一键导出** | 导出 Word 文档，即开即用 |

---

## 🚀 快速开始

### 📋 前置要求

- **Node.js** 18+ 
- **pnpm** (推荐) 或 npm
- **Git** 已安装
- **OpenRouter API Key** ([免费获取](https://openrouter.ai/keys))

### 📦 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/weekly-report-agent.git
cd weekly-report-agent

# 2. 安装所有依赖
pnpm install

# 3. 配置环境变量
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
# OpenRouter API Key (必填)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# 服务端口 (可选)
PORT=3001
```

### ▶️ 启动服务

```bash
# 开发模式 (前后端同时启动)
pnpm dev

# 或分别启动
pnpm dev:frontend  # http://localhost:5173
pnpm dev:backend   # http://localhost:3001
```

---

## 📖 使用指南

### 🎯 基本流程

```
1️⃣ 选择项目  →  2️⃣ 自动分析  →  3️⃣ 生成周报  →  4️⃣ 对话精修  →  5️⃣ 导出文档
```

### 💡 自然语言指令示例

| 指令 | 效果 |
|:---|:---|
| `选择项目` / `打开文件夹` | 打开项目选择对话框 |
| `分析 D:\code\myproject` | 分析指定路径的 Git 仓库 |
| `生成周报` | 基于分析数据生成周报 |
| `补充技术细节` | 让 AI 添加更多技术实现描述 |
| `简化一下` | 精简周报内容 |
| `突出项目 A 的工作` | 重点描述特定项目 |
| `帮助` | 查看帮助信息 |

### ⌨️ 快捷操作

| 操作 | 说明 |
|:---|:---|
| 点击 **Logo** | 返回首页 / 清空对话 |
| **项目** 按钮 | 选择 Git 项目文件夹 |
| **导出** 按钮 | 导出周报为 Word 文档 |

---

## 🏗️ 技术架构

### 📚 技术栈

<table>
<tr>
<td align="center" width="96">
<img src="https://img.icons8.com/color/48/react-native.png" width="36" />
<br><sub><b>React 18</b></sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/color/48/typescript.png" width="36" />
<br><sub><b>TypeScript</b></sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/fluency/48/node-js.png" width="36" />
<br><sub><b>Express</b></sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/color/48/sass.png" width="36" />
<br><sub><b>SCSS</b></sub>
</td>
<td align="center" width="96">
<img src="https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-ant-design-a-enterprise-class-ui-design-language-logo-color-tal-revivo.png" width="36" />
<br><sub><b>Ant Design</b></sub>
</td>
</tr>
</table>

| 层级 | 技术选型 | 说明 |
|:---|:---|:---|
| 🎨 **前端框架** | React 18 + TypeScript | 现代化组件开发 |
| 📦 **构建工具** | Rspack | Rust 驱动，极速构建 |
| 🎯 **UI 组件** | Ant Design + Ant Design X | 企业级 UI + AI 对话组件 |
| 🗃️ **状态管理** | Valtio | 直接修改即响应，简洁高效 |
| 🖥️ **后端框架** | Express.js + TypeScript | 轻量级 Node 服务 |
| 🤖 **AI 框架** | Vercel AI SDK + OpenRouter | 多模型统一接口 |
| 📡 **流式协议** | SSE (Server-Sent Events) | 实时流式输出 |
| 🔧 **Git 操作** | simple-git | Git 命令封装 |

### 📁 项目结构

```
weekly-report-agent/
├── 📂 frontend/                    # React 前端应用
│   ├── 📂 src/
│   │   ├── 📂 components/          # UI 组件
│   │   │   ├── Header/             # 顶部导航
│   │   │   ├── ChatMessages/       # 消息列表
│   │   │   ├── WelcomeScreen/      # 欢迎页
│   │   │   └── PathModal/          # 路径选择弹窗
│   │   ├── 📂 services/
│   │   │   ├── sse.ts              # SSE 连接 + 打字机效果
│   │   │   └── api.ts              # REST API
│   │   ├── 📂 stores/
│   │   │   └── chatStore.ts        # Valtio 状态管理
│   │   └── 📂 styles/              # SCSS 样式
│   └── rspack.config.js            # 构建配置
│
├── 📂 backend/                     # Express 后端服务
│   ├── 📂 src/
│   │   ├── 📂 routes/
│   │   │   ├── chat.ts             # SSE 聊天接口
│   │   │   └── git.ts              # Git 分析接口
│   │   ├── 📂 services/
│   │   │   ├── aiClient.ts         # AI 模型调用 + 降级
│   │   │   ├── gitAnalyzer.ts      # Git 数据采集
│   │   │   └── promptBuilder.ts    # 提示词构建
│   │   └── index.ts                # Express 入口
│   └── .env                        # 环境变量
│
├── 技术实现方案.md                   # 详细技术文档
└── README.md
```

### 🔄 数据流

```
┌──────────────────────────────────────────────────────────────┐
│                         用户交互                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ 自然语言指令
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  📱 Frontend (React)                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ sendConversation() → TypewriterQueue → chatStore        │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ SSE POST
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  🖥️ Backend (Express)                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ parseIntent() → gitAnalyzer → promptBuilder → aiClient  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ 模型降级
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI Models (OpenRouter)                                   │
│  Gemini → Qwen → Gemma → LLaMA → Mistral → DeepSeek → Phi   │
└──────────────────────────────────────────────────────────────┘
```

### 🔄 模型降级队列

9 个免费模型自动切换，确保高可用性：

| 优先级 | 模型 | 提供商 | 参数量 |
|:---:|:---|:---:|:---:|
| 1️⃣ | `gemini-2.0-flash-exp` | Google | - |
| 2️⃣ | `qwen3-235b-a22b` | 阿里云 | 235B |
| 3️⃣ | `qwen3-30b-a3b` | 阿里云 | 30B |
| 4️⃣ | `qwen-2.5-coder-32b-instruct` | 阿里云 | 32B |
| 5️⃣ | `gemma-3-27b-it` | Google | 27B |
| 6️⃣ | `llama-3.3-70b-instruct` | Meta | 70B |
| 7️⃣ | `mistral-small-3.1-24b-instruct` | Mistral | 24B |
| 8️⃣ | `deepseek-r1-0528` | DeepSeek | - |
| 9️⃣ | `phi-4-reasoning-plus` | Microsoft | - |

> 💡 **设计理念**：禁用 SDK 内置重试 (`maxRetries: 0`)，由应用层控制快速切换，避免单模型失败导致长时间等待。

### 🏷️ Git 提交分类

基于 commit message 关键词自动分类：

| 分类 | 英文关键词 | 中文关键词 | 图标 |
|:---|:---|:---|:---:|
| **Feature** | `feat`, `feature`, `add` | `新增`, `添加`, `实现` | ✨ |
| **Fix** | `fix`, `bugfix`, `hotfix` | `修复`, `解决`, `修正` | 🐛 |
| **Docs** | `docs`, `readme`, `doc` | `文档`, `注释` | 📝 |
| **Refactor** | `refactor`, `optimize` | `重构`, `优化`, `调整` | ♻️ |
| **Test** | `test`, `tests`, `spec` | `测试`, `单测` | ✅ |
| **Style** | `style`, `css`, `ui` | `样式`, `界面` | 💄 |
| **Other** | *其他* | *其他* | 📦 |

---

## 📡 API 文档

### 🔍 Git 分析

```http
POST /api/git/analyze
Content-Type: application/json

{
  "repoPath": "D:\\projects\\my-repo",
  "since": "2026-04-07",
  "until": "2026-04-13",
  "author": "optional-filter"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "repoName": "my-repo",
    "repoPath": "D:\\projects\\my-repo",
    "dateRange": { "since": "2026-04-07", "until": "2026-04-13" },
    "commits": [...],
    "summary": {
      "totalCommits": 23,
      "totalAdditions": 1234,
      "totalDeletions": 567
    },
    "categories": {
      "feature": [...],
      "fix": [...],
      "docs": [...]
    }
  }
}
```

### 💬 对话流 (SSE)

```http
POST /api/chat/conversation
Content-Type: application/json

{
  "message": "生成周报",
  "context": {
    "repoPath": "D:\\projects\\my-repo",
    "gitData": { ... },
    "messages": [...]
  }
}
```

**SSE 响应流**：
```
data: {"chunk": "# 本周工作总结\n\n"}

data: {"chunk": "## 新功能开发\n"}

data: {"chunk": "- 实现用户认证模块，支持 OAuth 登录\n"}

data: {"done": true}

```

### 📥 导出周报

```http
POST /api/report/export
Content-Type: application/json

{
  "content": "# 周报内容...",
  "filename": "周报_2026-04-13"
}
```

---

## 🔧 高级配置

### 🌐 使用阿里云百炼 (国内网络)

项目内置阿里云 Qwen 客户端，适合国内环境：

```env
# backend/.env
DASHSCOPE_API_KEY=sk-your-dashscope-key
```

### ⚙️ 自定义模型队列

编辑 `backend/src/services/aiClient.ts`：

```typescript
private defaultModel = 'your-preferred-model';
private backupModels = [
  'model-1',
  'model-2',
  // ...
];
```

### 🎨 自定义打字机速度

编辑 `frontend/src/services/sse.ts`：

```typescript
const typewriter = new TypewriterQueue((char) => {
  chatActions.appendAssistantContent(messageId, char);
}, 12); // 毫秒/字符，越小越快
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 PR

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

<p align="center">
  Made with ❤️ by AI Weekly Report Team
</p>

<p align="center">
  <a href="#周报-ai-助手">⬆️ 返回顶部</a>
</p>
