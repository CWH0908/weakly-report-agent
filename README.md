# 周报AI助手 (Weekly Report Agent)

基于 Git 记录自动生成工作周报的 AI Agent，支持流式对话精修。

## 功能特性

- **AI 智能生成** — 基于 Git 提交记录，使用大模型自动生成结构化周报
- **流式对话** — SSE 实时流式输出，逐字呈现生成内容
- **Git 分析** — 自动分析提交记录，按类型分类（feature / fix / docs / refactor / test）
- **多轮精修** — 通过自然语言对话持续优化周报内容
- **模型降级** — 5 个免费模型自动切换，保证可用性
- **一键导出** — 导出 Markdown 格式的周报文件

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Rspack |
| UI 组件 | Ant Design + Ant Design X |
| 状态管理 | Valtio |
| 后端框架 | Express.js + TypeScript |
| AI 框架 | Vercel AI SDK + OpenRouter |
| Git 操作 | simple-git |
| 流式协议 | SSE (Server-Sent Events) |

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`，填入 OpenRouter API Key：

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

获取免费 API Key: https://openrouter.ai/keys

### 3. 启动开发服务器

```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3001

## 使用流程

1. **输入 Git 路径** — 在左侧面板输入本地 Git 项目的绝对路径
2. **选择时间范围** — 默认本周，可切换为上周或自定义日期
3. **分析 Git 记录** — 点击按钮，系统自动分析提交记录并展示统计
4. **AI 生成周报** — 分析完成后自动触发 AI 流式生成周报内容
5. **对话精修** — 在对话框输入指令精修周报，如："补充技术细节"、"简化描述"、"突出项目A"
6. **导出周报** — 点击导出按钮保存 Markdown 文件

## 项目结构

```
weakly-report-agent/
├── package.json                  # 根 monorepo 脚本 (concurrently)
├── frontend/                     # 前端 React 应用
│   ├── rspack.config.js          # Rspack 构建配置 + /api 代理
│   ├── src/
│   │   ├── main.tsx              # React 入口
│   │   ├── App.tsx               # 根组件 (Ant Design Layout)
│   │   ├── components/
│   │   │   ├── GitConfigForm/    # Git 配置表单
│   │   │   ├── WeeklyReportChat/ # AI 对话主界面
│   │   │   └── ReportPreview/    # Markdown 渲染组件
│   │   ├── stores/
│   │   │   └── chatStore.ts      # Valtio 全局状态
│   │   ├── services/
│   │   │   ├── api.ts            # REST API 调用
│   │   │   └── sse.ts            # SSE 流式连接管理
│   │   └── types/
│   └── package.json
├── backend/                      # 后端 Express 应用
│   ├── src/
│   │   ├── index.ts              # Express 入口
│   │   ├── routes/
│   │   │   ├── chat.ts           # SSE 流式聊天路由
│   │   │   ├── git.ts            # Git 分析路由
│   │   │   └── report.ts         # 周报导出路由
│   │   ├── services/
│   │   │   ├── aiClient.ts       # OpenRouter AI 客户端 (模型降级)
│   │   │   ├── gitAnalyzer.ts    # Git 提交分析器
│   │   │   ├── promptBuilder.ts  # 提示词构建器
│   │   │   └── qwenClient.ts     # 阿里云 Qwen 备选客户端
│   │   └── types/
│   ├── .env.example              # 环境变量模板
│   └── package.json
└── .gitignore
```

## 架构设计

### 数据流

```
用户配置 Git 路径/日期
    │
    ▼
POST /api/git/analyze
    │  simple-git: git log + git show --stat
    │  按 commit message 关键词自动分类
    ▼
返回 GitAnalysisResult → 存入 Valtio Store
    │
    ▼ 自动触发
POST /api/chat/stream (SSE)
    │  promptBuilder 构建系统提示词 + 格式化 Git 数据
    │  aiClient.streamWithFallback() 逐模型尝试
    ▼
SSE 流: data: {"chunk": "文本片段"}\n\n
    │  前端逐 chunk 追加到 Store → UI 实时更新
    ▼
data: {"done": true}\n\n → 生成完成
    │
    ▼ 用户输入修改指令
POST /api/chat/stream (携带完整消息历史, isInitial=false)
    │  多轮对话精修
    ▼
导出 → POST /api/report/export → 下载 Markdown 文件
```

### SSE 流式协议

选择 SSE 而非 WebSocket 的原因：AI 生成是单向服务器推送场景，SSE 更简单。

由于需要 POST 请求体传递消息历史，前端使用 `fetch()` + `ReadableStream` 手动解析 SSE 协议（浏览器原生 `EventSource` 只支持 GET）。

后端 SSE 加固措施：
- 15 秒心跳保活，防止代理/浏览器断开空闲连接
- 60 秒超时保护，防止无限等待
- `X-Accel-Buffering: no` 禁用 Nginx 缓冲

### 模型降级策略

5 个免费模型组成降级队列，逐个尝试：

| 优先级 | 模型 | 提供商 |
|--------|------|--------|
| 1 (默认) | google/gemma-4-31b-it:free | Google |
| 2 | nvidia/nemotron-3-super-120b-a12b:free | NVIDIA |
| 3 | meta-llama/llama-3.3-70b-instruct:free | Meta |
| 4 | mistralai/mistral-small-3.1-24b-instruct:free | Mistral |
| 5 | qwen/qwen3-next-80b-a3b-instruct:free | Alibaba |

关键设计：`maxRetries: 0` 禁用 Vercel AI SDK 内置重试（默认会指数退避重试 3 次），由应用层控制快速切换，避免单模型失败导致分钟级卡顿。

### Git 提交分类规则

基于 commit message 前缀/关键词自动分类，同时支持中英文：

| 分类 | 英文关键词 | 中文关键词 |
|------|-----------|-----------|
| feature | feat, feature | 新增, 添加 |
| fix | fix, bugfix | 修复, 解决 |
| docs | docs, readme | 文档 |
| refactor | refactor | 重构, 优化 |
| test | test, tests | 测试 |
| other | 其余 | 其余 |

## API 接口

### Git 分析

```http
POST /api/git/analyze
Content-Type: application/json

{
  "repoPath": "D:\\projects\\my-repo",
  "since": "2026-04-07",
  "until": "2026-04-13",
  "author": "optional-author-name"
}
```

### AI 对话流

```http
POST /api/chat/stream
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "gitData": { ... },
  "isInitial": true
}

# SSE 响应
data: {"chunk": "# 本周工作总结\n\n"}
data: {"chunk": "## 新功能开发\n"}
...
data: {"done": true}
```

### 导出周报

```http
POST /api/report/export
Content-Type: application/json

{
  "content": "# 周报内容...",
  "filename": "周报_2026-04-13.md"
}
```

## 备选方案：阿里云百炼 Qwen

项目内置了阿里云百炼 Qwen 客户端 (`qwenClient.ts`)，适合国内网络环境。启用方式：

1. 在 `.env` 中配置 `DASHSCOPE_API_KEY`
2. 修改 `aiClient.ts` 中的模型调用为 Qwen 客户端

## License

MIT
