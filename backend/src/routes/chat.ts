import { Router, Request, Response } from 'express';
import { getAIClient } from '../services/aiClient.js';
import { promptBuilder } from '../services/promptBuilder.js';
import { gitAnalyzer } from '../services/gitAnalyzer.js';
import { GitAnalysisResult } from '../types/index.js';

const router = Router();

const STREAM_TIMEOUT = 60_000; // 60秒超时

// 解析用户自然语言中的意图和参数
interface ParsedIntent {
  action: 'select_folder' | 'analyze' | 'generate_report' | 'chat' | 'help';
  repoPath?: string;
  since?: string;
  until?: string;
  author?: string;
  message?: string;
}

function parseUserIntent(message: string): ParsedIntent {
  const lowerMsg = message.toLowerCase();
  
  // 帮助意图
  if (lowerMsg.includes('帮助') || lowerMsg.includes('怎么用') || lowerMsg.includes('help')) {
    return { action: 'help' };
  }

  // 选择文件夹意图
  if (lowerMsg.includes('选择') && (lowerMsg.includes('文件夹') || lowerMsg.includes('目录') || lowerMsg.includes('项目'))) {
    return { action: 'select_folder' };
  }
  if (lowerMsg.includes('打开') && (lowerMsg.includes('文件夹') || lowerMsg.includes('目录') || lowerMsg.includes('项目'))) {
    return { action: 'select_folder' };
  }
  if (lowerMsg.includes('浏览') && (lowerMsg.includes('文件夹') || lowerMsg.includes('目录'))) {
    return { action: 'select_folder' };
  }

  // 分析/生成周报意图 - 包含路径
  const pathPatterns = [
    /(?:分析|查看|打开|读取|加载)\s*[：:\"\'"]?\s*([A-Za-z]:[\\\/][^\s\"\'\n]+)/i,
    /(?:路径|目录|项目)[是为：:\s]*[\"\'"]?([A-Za-z]:[\\\/][^\s\"\'\n]+)/i,
    /([A-Za-z]:[\\\/][^\s\"\'\n]+)\s*(?:的?周报|的?提交|的?git)/i,
  ];
  
  for (const pattern of pathPatterns) {
    const match = message.match(pattern);
    if (match) {
      const repoPath = match[1].replace(/[\"\'\s]+$/, '');
      const dateRange = parseDateRange(message);
      return { 
        action: 'analyze', 
        repoPath,
        ...dateRange,
      };
    }
  }

  // 生成周报意图（无具体路径，需要已有上下文）
  if (lowerMsg.includes('生成周报') || lowerMsg.includes('写周报') || 
      lowerMsg.includes('做周报') || lowerMsg.includes('周报')) {
    if (lowerMsg.includes('本周') || lowerMsg.includes('上周') || lowerMsg.includes('这周')) {
      return { action: 'generate_report', ...parseDateRange(message) };
    }
    return { action: 'generate_report' };
  }

  // 分析意图
  if (lowerMsg.includes('分析') && (lowerMsg.includes('git') || lowerMsg.includes('提交'))) {
    return { action: 'analyze', ...parseDateRange(message) };
  }

  // 默认为普通对话
  return { action: 'chat', message };
}

function parseDateRange(message: string): { since?: string; until?: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // 本周
  if (message.includes('本周') || message.includes('这周')) {
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      since: monday.toISOString().split('T')[0],
      until: sunday.toISOString().split('T')[0],
    };
  }
  
  // 上周
  if (message.includes('上周')) {
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return {
      since: lastMonday.toISOString().split('T')[0],
      until: lastSunday.toISOString().split('T')[0],
    };
  }

  // 默认本周
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    since: monday.toISOString().split('T')[0],
    until: sunday.toISOString().split('T')[0],
  };
}

// 自然语言对话式接口
router.post('/conversation', async (req: Request, res: Response) => {
  // 禁用 compression 对此响应的压缩
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'identity'); // 明确禁用压缩
  res.flushHeaders();

  // 封装写入函数，确保每次写入后立即发送
  const sendSSE = (data: object) => {
    const line = `data: ${JSON.stringify(data)}\n\n`;
    res.write(line);
    // 强制刷新缓冲区
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    // 备用方案：直接调用底层 socket
    if ((res as any).socket && typeof (res as any).socket.setNoDelay === 'function') {
      (res as any).socket.setNoDelay(true);
    }
  };

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15_000);

  const timeout = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ error: '处理超时，请重试' })}\n\n`);
    res.end();
  }, STREAM_TIMEOUT);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(timeout);
  });

  try {
    const { message, context } = req.body as {
      message: string;
      context?: {
        repoPath?: string;
        gitData?: GitAnalysisResult;
        messages?: Array<{ role: string; content: string }>;
      };
    };

    const intent = parseUserIntent(message);
    console.log('[Conversation] 意图解析:', intent);

    switch (intent.action) {
      case 'help': {
        const helpText = `我是周报AI助手，可以帮你：

1. **选择项目** - 说"选择项目文件夹"或"打开目录"
2. **分析Git** - 说"分析 D:\\project\\my-repo 的本周提交"
3. **生成周报** - 项目分析后说"生成周报"
4. **精修周报** - 说"补充技术细节"、"简化内容"等

示例：
- "打开文件夹选择项目"
- "分析 D:\\work\\frontend 的上周提交"  
- "帮我生成本周周报"`;
        sendSSE({ chunk: helpText });
        sendSSE({ done: true });
        break;
      }

      case 'select_folder': {
        // 发送特殊指令让前端打开文件夹选择器
        sendSSE({ action: 'select_folder' });
        sendSSE({ done: true });
        break;
      }

      case 'analyze': {
        const repoPath = intent.repoPath || context?.repoPath;
        if (!repoPath) {
          sendSSE({ chunk: '请先选择项目目录，说"选择项目文件夹"或直接告诉我路径，如"分析 D:\\\\project 的提交"' });
          sendSSE({ done: true });
          break;
        }

        sendSSE({ chunk: `正在分析 ${repoPath} ...\n\n` });

        try {
          const since = intent.since || parseDateRange('本周').since!;
          const until = intent.until || parseDateRange('本周').until!;
          
          const gitData = await gitAnalyzer.analyze(repoPath, since, until, intent.author);
          
          // 发送分析结果
          sendSSE({ 
            gitData,
            chunk: `✅ 分析完成！\n\n**项目**: ${gitData.repoName}\n**时间**: ${since} ~ ${until}\n**提交数**: ${gitData.summary.totalCommits}\n**代码变更**: +${gitData.summary.totalAdditions} / -${gitData.summary.totalDeletions}\n\n现在你可以说"生成周报"来创建周报。`
          });
          sendSSE({ done: true });
        } catch (error: any) {
          sendSSE({ chunk: `❌ 分析失败: ${error.message}` });
          sendSSE({ done: true });
        }
        break;
      }

      case 'generate_report': {
        const gitData = context?.gitData;
        if (!gitData) {
          sendSSE({ chunk: '请先分析Git项目，说"选择项目文件夹"或直接告诉我路径开始分析。' });
          sendSSE({ done: true });
          break;
        }

        const promptMessages = promptBuilder.buildInitialPrompt(gitData);
        const client = getAIClient();

        await client.streamWithFallback(
          { messages: promptMessages },
          (chunk: string) => {
            sendSSE({ chunk });
          },
        );
        sendSSE({ done: true });
        break;
      }

      case 'chat':
      default: {
        // 普通对话：精修周报或其他聊天
        const messages = context?.messages || [];
        
        // 构建系统提示
        const systemPrompt = {
          role: 'system',
          content: `你是一个智能周报助手，可以帮助用户：
1. 分析 Git 提交记录
2. 生成工作周报
3. 回答关于周报和工作相关的问题

如果用户询问与周报无关的问题，你也可以友好地回答，但要简洁。
如果用户想要分析项目，提醒他们可以说"选择项目文件夹"或直接提供项目路径。`
        };
        
        // 始终将用户消息发给 AI 处理
        const chatMessages = [
          systemPrompt,
          ...messages,
          { role: 'user', content: message }
        ];
        
        const client = getAIClient();

        await client.streamWithFallback(
          { messages: chatMessages },
          (chunk: string) => {
            sendSSE({ chunk });
          },
        );
        sendSSE({ done: true });
        break;
      }
    }
  } catch (error: any) {
    console.error('[Conversation] 错误:', error.message || error);
    sendSSE({ error: error.message || '处理失败' });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    res.end();
  }
});

// SSE流式聊天接口 (保留原有接口兼容)
router.post('/stream', async (req: Request, res: Response) => {
  // 设置SSE头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'identity'); // 明确禁用压缩
  res.flushHeaders();

  // 封装写入函数，确保每次写入后立即发送
  const sendSSE = (data: object) => {
    const line = `data: ${JSON.stringify(data)}\n\n`;
    res.write(line);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    if ((res as any).socket && typeof (res as any).socket.setNoDelay === 'function') {
      (res as any).socket.setNoDelay(true);
    }
  };

  // 心跳定时器，防止代理/浏览器断开空闲连接
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15_000);

  // 超时保护
  const timeout = setTimeout(() => {
    console.error('[Chat Stream] 超时');
    sendSSE({ error: '生成超时，请重试' });
    res.end();
  }, STREAM_TIMEOUT);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(timeout);
  });

  try {
    const { messages, gitData, isInitial }: {
      messages?: Array<{ role: string; content: string }>;
      gitData?: GitAnalysisResult;
      isInitial?: boolean;
    } = req.body;

    let promptMessages: Array<{ role: string; content: string }>;

    if (isInitial && gitData) {
      promptMessages = promptBuilder.buildInitialPrompt(gitData);
    } else if (messages && messages.length > 0) {
      promptMessages = messages;
    } else {
      sendSSE({ error: '缺少必要参数' });
      clearInterval(heartbeat);
      clearTimeout(timeout);
      res.end();
      return;
    }

    console.log('[Chat Stream] 开始生成, 消息数:', promptMessages.length);

    const client = getAIClient();

    await client.streamWithFallback(
      { messages: promptMessages },
      (chunk: string) => {
        sendSSE({ chunk });
      },
    );

    sendSSE({ done: true });
  } catch (error: any) {
    console.error('[Chat Stream] 错误:', error.message || error);
    const errorMessage = error instanceof Error ? error.message : '生成失败';
    sendSSE({ error: errorMessage });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    res.end();
  }
});

export default router;
