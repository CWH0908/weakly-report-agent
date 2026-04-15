/**
 * Mock 数据与模拟服务
 * 设置 ENABLE_MOCK = true 可脱离后端独立验证前端流式交互
 */
import { GitConfig, GitAnalysisResult } from '../types';
import { SSEOptions } from './sse';

// ========== Mock 开关 ==========
export const ENABLE_MOCK = false;
// ===============================

/** Mock Git 分析数据 */
export function getMockGitData(config: GitConfig): GitAnalysisResult {
  return {
    repoName: 'weekly-report-agent',
    repoPath: config.repoPath || 'D:\\projects\\weekly-report-agent',
    dateRange: { since: config.since, until: config.until },
    summary: {
      totalCommits: 12,
      totalAdditions: 847,
      totalDeletions: 213,
      filesChanged: [
        'src/services/aiClient.ts',
        'src/routes/chat.ts',
        'src/components/WeeklyReportChat/index.tsx',
        'src/services/sse.ts',
        'src/stores/chatStore.ts',
        'README.md',
        'package.json',
      ],
    },
    commits: [
      {
        hash: 'a1b2c3d', message: 'feat: 添加AI流式对话功能', date: '2026-04-10', author: 'developer',
        files: [{ path: 'src/services/aiClient.ts', additions: 101, deletions: 0 }],
        stats: { additions: 101, deletions: 0 },
      },
      {
        hash: 'b2c3d4e', message: 'feat: 实现SSE流式传输协议', date: '2026-04-10', author: 'developer',
        files: [{ path: 'src/routes/chat.ts', additions: 82, deletions: 0 }],
        stats: { additions: 82, deletions: 0 },
      },
      {
        hash: 'c3d4e5f', message: 'fix: 修复模型降级时的超时问题', date: '2026-04-11', author: 'developer',
        files: [{ path: 'src/services/aiClient.ts', additions: 25, deletions: 12 }],
        stats: { additions: 25, deletions: 12 },
      },
      {
        hash: 'd4e5f6g', message: 'fix: 解决心跳定时器未清理导致内存泄漏', date: '2026-04-11', author: 'developer',
        files: [{ path: 'src/routes/chat.ts', additions: 15, deletions: 3 }],
        stats: { additions: 15, deletions: 3 },
      },
      {
        hash: 'e5f6g7h', message: 'refactor: 重构状态管理为Valtio proxy模式', date: '2026-04-12', author: 'developer',
        files: [{ path: 'src/stores/chatStore.ts', additions: 125, deletions: 89 }],
        stats: { additions: 125, deletions: 89 },
      },
      {
        hash: 'f6g7h8i', message: 'feat: 添加Markdown渲染和代码高亮', date: '2026-04-12', author: 'developer',
        files: [{ path: 'src/components/ReportPreview/index.tsx', additions: 50, deletions: 0 }],
        stats: { additions: 50, deletions: 0 },
      },
      {
        hash: 'g7h8i9j', message: 'docs: 更新README技术文档', date: '2026-04-13', author: 'developer',
        files: [{ path: 'README.md', additions: 180, deletions: 45 }],
        stats: { additions: 180, deletions: 45 },
      },
      {
        hash: 'h8i9j0k', message: 'feat: 新增周报导出功能', date: '2026-04-09', author: 'developer',
        files: [{ path: 'src/routes/report.ts', additions: 93, deletions: 0 }],
        stats: { additions: 93, deletions: 0 },
      },
      {
        hash: 'i9j0k1l', message: 'fix: 修复前端SSE连接断开后未重连的问题', date: '2026-04-09', author: 'developer',
        files: [{ path: 'src/services/sse.ts', additions: 18, deletions: 7 }],
        stats: { additions: 18, deletions: 7 },
      },
      {
        hash: 'j0k1l2m', message: 'refactor: 优化Git提交分类算法', date: '2026-04-10', author: 'developer',
        files: [{ path: 'src/services/gitAnalyzer.ts', additions: 55, deletions: 30 }],
        stats: { additions: 55, deletions: 30 },
      },
      {
        hash: 'k1l2m3n', message: 'test: 添加AI客户端单元测试', date: '2026-04-11', author: 'developer',
        files: [{ path: 'src/services/__tests__/aiClient.test.ts', additions: 78, deletions: 0 }],
        stats: { additions: 78, deletions: 0 },
      },
      {
        hash: 'l2m3n4o', message: 'chore: 更新依赖版本', date: '2026-04-13', author: 'developer',
        files: [{ path: 'package.json', additions: 24, deletions: 27 }],
        stats: { additions: 24, deletions: 27 },
      },
    ],
    categories: {
      feature: [
        { hash: 'a1b2c3d', message: 'feat: 添加AI流式对话功能', date: '2026-04-10', author: 'developer' },
        { hash: 'b2c3d4e', message: 'feat: 实现SSE流式传输协议', date: '2026-04-10', author: 'developer' },
        { hash: 'f6g7h8i', message: 'feat: 添加Markdown渲染和代码高亮', date: '2026-04-12', author: 'developer' },
        { hash: 'h8i9j0k', message: 'feat: 新增周报导出功能', date: '2026-04-09', author: 'developer' },
      ],
      fix: [
        { hash: 'c3d4e5f', message: 'fix: 修复模型降级时的超时问题', date: '2026-04-11', author: 'developer' },
        { hash: 'd4e5f6g', message: 'fix: 解决心跳定时器未清理导致内存泄漏', date: '2026-04-11', author: 'developer' },
        { hash: 'i9j0k1l', message: 'fix: 修复前端SSE连接断开后未重连的问题', date: '2026-04-09', author: 'developer' },
      ],
      refactor: [
        { hash: 'e5f6g7h', message: 'refactor: 重构状态管理为Valtio proxy模式', date: '2026-04-12', author: 'developer' },
        { hash: 'j0k1l2m', message: 'refactor: 优化Git提交分类算法', date: '2026-04-10', author: 'developer' },
      ],
      docs: [
        { hash: 'g7h8i9j', message: 'docs: 更新README技术文档', date: '2026-04-13', author: 'developer' },
      ],
      test: [
        { hash: 'k1l2m3n', message: 'test: 添加AI客户端单元测试', date: '2026-04-11', author: 'developer' },
      ],
      other: [
        { hash: 'l2m3n4o', message: 'chore: 更新依赖版本', date: '2026-04-13', author: 'developer' },
      ],
    },
  };
}

/** Mock 周报内容 */
const MOCK_REPORT = `# 周报 (2026.04.07 - 2026.04.13)

## 本周工作总结

### 新功能开发 (4项)

1. **AI 流式对话功能**
   - 集成 OpenRouter API，通过 Vercel AI SDK 实现多模型调用
   - 支持 5 个免费模型自动降级切换，保证服务可用性
   - 实现 SSE (Server-Sent Events) 流式传输协议，支持实时逐字输出

2. **SSE 流式传输协议**
   - 前端使用 \`fetch + ReadableStream\` 手动解析 SSE 格式（支持 POST 请求）
   - 后端实现心跳保活机制（15s 间隔）和 60s 超时保护
   - 添加 \`X-Accel-Buffering: no\` 头禁用代理缓冲

3. **Markdown 渲染与代码高亮**
   - 集成 \`react-markdown\` + \`remark-gfm\` 渲染 Markdown 内容
   - 使用 Prism + oneDark 主题实现代码语法高亮

4. **周报导出功能**
   - 支持将 AI 生成的周报导出为 Markdown 文件
   - 后端通过临时目录管理导出文件，防止目录遍历攻击

### 问题修复 (3项)

1. **模型降级超时问题** — 禁用 SDK 内置重试 (\`maxRetries: 0\`)，由应用层控制快速切换
2. **心跳定时器内存泄漏** — 在 \`finally\` 和 \`req.on('close')\` 中统一清理定时器资源
3. **SSE 连接断开未重连** — 前端添加 \`AbortController\` 管理和错误回调机制

### 代码重构 (2项)

1. **状态管理重构** — 从 useState 迁移到 Valtio proxy 模式，简化流式场景下的高频更新
2. **Git 分类算法优化** — 支持中英文双语 commit message 识别，覆盖 Conventional Commits 规范

### 文档 & 其他 (3项)

- 更新 README 技术实现文档
- 添加 AI 客户端单元测试
- 更新项目依赖版本

## 主要成果

- 完成了从 Git 数据采集到 AI 周报生成的完整链路
- 模型降级策略将失败恢复时间从 **22.5 秒降至 2-3 秒**
- 流式输出体验流畅，支持打字机效果逐字呈现

## 遇到的问题

- 免费模型存在 429 限流问题，高频使用时需要依赖降级队列切换
- SSE 在某些企业代理环境下可能被缓冲，需要多个 header 配合才能保证实时性

## 下周计划

1. 添加对话历史截断策略，避免长对话导致 token 超限
2. 实现 Git 分析结果缓存，提升重复查询性能
3. 探索接入付费模型以支持多用户生产环境部署
`;

/** Mock 多轮对话回复 */
const MOCK_FOLLOWUP = `好的，已根据你的要求进行了调整。以下是修改后的内容：

### 补充技术细节

**SSE 流式传输实现细节：**

- 前端使用 \`fetch() + ReadableStream\` 而非浏览器原生 \`EventSource\`，原因是 EventSource 只支持 GET 请求，无法携带 JSON body
- 每个 SSE 消息格式为 \`data: {"chunk": "文本片段"}\\n\\n\`
- 后端使用 \`res.flushHeaders()\` 立即发送响应头，确保流式连接建立

**模型降级策略细节：**

| 优先级 | 模型 | 说明 |
|--------|------|------|
| 1 | gemma-4-31b-it | 默认首选，性能均衡 |
| 2 | nemotron-3-super-120b | 大参数备选 |
| 3 | llama-3.3-70b | 多语言能力强 |
| 4 | mistral-small-3.1-24b | 轻量快速 |
| 5 | qwen3-next-80b | 中文优化 |

如果还需要其他调整，请继续告诉我。
`;

/**
 * Mock SSE 连接：将文本按随机长度切分为 chunk，模拟真实的流式输出节奏
 */
export function createMockSSEConnection(options: SSEOptions): () => void {
  const { isInitial, onChunk, onComplete } = options;
  let cancelled = false;

  const text = isInitial ? MOCK_REPORT : MOCK_FOLLOWUP;

  (async () => {
    let pos = 0;
    while (pos < text.length && !cancelled) {
      // 每次输出 3-15 个字符，模拟真实 chunk 的不均匀性
      const size = Math.floor(Math.random() * 13) + 3;
      const chunk = text.slice(pos, pos + size);
      pos += size;
      onChunk?.(chunk);
      // 每个 chunk 间隔 30-80ms，模拟网络延迟
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 50) + 30));
    }
    if (!cancelled) {
      onComplete?.();
    }
  })();

  return () => { cancelled = true; };
}
