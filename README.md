# 周报AI助手

基于Git记录自动生成工作周报，支持AI对话式精修。

## 功能特性

- 🤖 **AI智能生成**: 使用免费大模型（Gemma 3 27B、Llama 3.3等）自动生成周报
- 💬 **流式对话**: 基于AntdX ProChat的实时流式对话界面
- 📊 **Git分析**: 自动分析Git提交记录，按类型分类（feature/fix/docs等）
- 🎯 **多轮精修**: 通过自然语言对话精修周报内容
- 📥 **一键导出**: 导出Markdown格式的周报文件

## 技术栈

- **前端**: React 18 + TypeScript + Rspack + Ant Design X (AntdX)
- **状态管理**: Valtio
- **后端**: Express.js + TypeScript
- **AI框架**: Vercel AI SDK + OpenRouter
- **Git操作**: simple-git

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖（前端+后端+根目录）
npm run install:all
```

### 2. 配置AI模型

支持两种方式配置AI模型：

#### 方式一：OpenRouter（推荐，支持多模型）

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

获取免费API Key: https://openrouter.ai/keys

支持的免费模型：
- `google/gemma-3-27b-it:free` (默认)
- `meta-llama/llama-3.3-70b-instruct:free`
- `qwen/qwen-2.5-72b-instruct:free` (Qwen)

#### 方式二：阿里云百炼Qwen（国内访问更快）

```bash
# 编辑 .env 文件
DASHSCOPE_API_KEY=sk-your-dashscope-key-here
```

获取API Key: https://bailian.console.aliyun.com/

然后修改 `backend/src/services/aiClient.ts` 使用Qwen：
```typescript
// 导入Qwen客户端
import { qwenClient } from './qwenClient.js';

// 在streamChat中使用
const result = streamText({
  model: qwenClient('qwen-turbo'), // 或 qwen-max, qwen-plus
  // ...
});
```

### 3. 启动开发服务器

```bash
# 在根目录同时启动前后端
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3001

## 使用指南

1. **输入Git路径**: 在左侧面板输入本地Git项目路径
2. **选择时间范围**: 默认本周，可切换为上周或自定义
3. **分析Git记录**: 点击按钮，系统自动分析提交记录
4. **生成周报**: 点击"生成周报"，AI开始流式生成内容
5. **对话精修**: 在对话框输入指令精修周报，如：
   - "补充技术细节"
   - "简化描述内容"
   - "突出重点项目A"
6. **导出周报**: 点击右上角"导出"按钮保存Markdown文件

## 项目结构

```
Project_3/
├── frontend/              # 前端React应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── stores/        # Valtio状态管理
│   │   ├── services/      # API服务
│   │   └── types/         # TypeScript类型
│   └── package.json
├── backend/               # 后端Express应用
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务服务
│   │   └── types/         # 类型定义
│   └── package.json
└── package.json           # 根目录脚本
```

## API说明

### Git分析
```bash
POST /api/git/analyze
{
  "repoPath": "/path/to/repo",
  "since": "2025-04-01",
  "until": "2025-04-07",
  "author": "optional-author"
}
```

### AI对话流
```bash
POST /api/chat/stream
{
  "messages": [...],
  "gitData": {...},
  "isInitial": true
}
# SSE流式响应
```

### 导出周报
```bash
POST /api/report/export
{
  "content": "# 周报内容...",
  "filename": "周报_2025-04-11.md"
}
```

## 免费模型推荐

| 模型 | 提供商 | 说明 |
|------|--------|------|
| google/gemma-3-27b-it:free | Google | 推荐，性能优秀 |
| meta-llama/llama-3.3-70b-instruct:free | Meta | 备选，多语言支持好 |
| qwen/qwen-2.5-72b-instruct:free | 阿里 | 中文能力强 |

## License

MIT
