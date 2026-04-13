import { Router, Request, Response } from 'express';
import { getAIClient } from '../services/aiClient.js';
import { promptBuilder } from '../services/promptBuilder.js';
import { GitAnalysisResult } from '../types/index.js';

const router = Router();

const STREAM_TIMEOUT = 60_000; // 60秒超时

// SSE流式聊天接口
router.post('/stream', async (req: Request, res: Response) => {
  // 设置SSE头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx/proxy 缓冲
  res.flushHeaders();

  // 心跳定时器，防止代理/浏览器断开空闲连接
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15_000);

  // 超时保护
  const timeout = setTimeout(() => {
    console.error('[Chat Stream] 超时');
    res.write(`data: ${JSON.stringify({ error: '生成超时，请重试' })}\n\n`);
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
      res.write(`data: ${JSON.stringify({ error: '缺少必要参数' })}\n\n`);
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
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
    );

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error: any) {
    console.error('[Chat Stream] 错误:', error.message || error);
    const errorMessage = error instanceof Error ? error.message : '生成失败';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    res.end();
  }
});

export default router;
