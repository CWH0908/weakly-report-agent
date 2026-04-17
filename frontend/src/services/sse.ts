import { chatActions } from '../stores/chatStore';
import { GitAnalysisResult } from '../types';
import { ENABLE_MOCK, createMockSSEConnection } from './mock';

// 打字机效果：将大块文本逐字输出
class TypewriterQueue {
  private queue: string[] = [];
  private isProcessing = false;
  private callback: (char: string) => void;
  private charDelay: number;

  constructor(callback: (char: string) => void, charDelay = 150) {
    this.callback = callback;
    this.charDelay = charDelay;
  }

  // 添加文本到队列
  enqueue(text: string) {
    // 将文本拆分为字符，但保持连续的标点/空格为一组
    for (const char of text) {
      this.queue.push(char);
    }
    this.process();
  }

  // 处理队列
  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const char = this.queue.shift()!;
      this.callback(char);
      // 根据字符类型调整延迟
      let delay = this.charDelay;
      if (char === '\n') {
        delay = this.charDelay * 2; // 换行稍慢
      } else if (/[，。！？、；：]/.test(char)) {
        delay = this.charDelay * 1.5; // 标点稍慢
      }
      await new Promise(r => setTimeout(r, delay));
    }

    this.isProcessing = false;
  }

  // 立即输出剩余内容（用于流结束时）
  flush() {
    if (this.queue.length > 0) {
      this.callback(this.queue.join(''));
      this.queue = [];
    }
    this.isProcessing = false;
  }
}

export interface SSEOptions {
  messages: Array<{ role: string; content: string }>;
  gitData?: GitAnalysisResult;
  isInitial?: boolean;
  onChunk?: (chunk: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export function createSSEConnection(options: SSEOptions): () => void {
  if (ENABLE_MOCK) {
    return createMockSSEConnection(options);
  }

  const { messages, gitData, isInitial, onChunk, onError, onComplete } = options;

  const abortController = new AbortController();
  let buffer = ''; // 用于处理不完整的数据行

  fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, gitData, isInitial }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete?.();
          break;
        }

        // 将新数据追加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割处理
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下次处理
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                onChunk?.(data.chunk);
              } else if (data.done) {
                onComplete?.();
              } else if (data.error) {
                onError?.(data.error);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError?.(error.message);
      }
    });

  return () => {
    abortController.abort();
  };
}

// 对话式接口
export interface ConversationOptions {
  message: string;
  context?: {
    repoPath?: string;
    gitData?: GitAnalysisResult;
    messages?: Array<{ role: string; content: string }>;
  };
  onChunk?: (chunk: string) => void;
  onAction?: (action: string, data?: any) => void;
  onGitData?: (gitData: GitAnalysisResult) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export function createConversationConnection(options: ConversationOptions): () => void {
  const { message, context, onChunk, onAction, onGitData, onError, onComplete } = options;

  const abortController = new AbortController();
  let buffer = ''; // 用于处理不完整的数据行
  let chunkCount = 0; // 调试计数

  fetch('/api/chat/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, context }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      console.log('[SSE] 开始读取流...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[SSE] 流结束，共收到', chunkCount, '个 chunk');
          onComplete?.();
          break;
        }

        // 将新数据追加到缓冲区
        const rawText = decoder.decode(value, { stream: true });
        console.log('[SSE] 收到原始数据包, 长度:', rawText.length);
        buffer += rawText;
        
        // 按行分割处理
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下次处理
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.action) {
                onAction?.(data.action, data);
              }
              if (data.gitData) {
                onGitData?.(data.gitData);
              }
              if (data.chunk) {
                chunkCount++;
                console.log(`[SSE] chunk #${chunkCount}: len=${data.chunk.length}`);
                onChunk?.(data.chunk);
              }
              if (data.done) {
                onComplete?.();
              }
              if (data.error) {
                onError?.(data.error);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError?.(error.message);
      }
    });

  return () => {
    abortController.abort();
  };
}

// 生成周报
export async function generateWeeklyReport(gitData: GitAnalysisResult): Promise<void> {
  const messageId = chatActions.startAssistantMessage();

  // 使用打字机效果队列
  const typewriter = new TypewriterQueue((char) => {
    chatActions.appendAssistantContent(messageId, char);
  }, 12);

  return new Promise((resolve, reject) => {
    const disconnect = createSSEConnection({
      messages: [],
      gitData,
      isInitial: true,
      onChunk: (chunk) => {
        typewriter.enqueue(chunk);
      },
      onError: (error) => {
        typewriter.flush();
        chatActions.finishAssistantMessage(messageId);
        chatActions.setError(error);
        disconnect();
        reject(new Error(error));
      },
      onComplete: () => {
        setTimeout(() => {
          typewriter.flush();
          chatActions.finishAssistantMessage(messageId);
          disconnect();
          resolve();
        }, 100);
      },
    });
  });
}

// 继续对话
export async function continueChat(userMessage: string): Promise<void> {
  chatActions.addUserMessage(userMessage);

  const { chatStore } = await import('../stores/chatStore');
  const messages = chatStore.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messageId = chatActions.startAssistantMessage();

  // 使用打字机效果队列
  const typewriter = new TypewriterQueue((char) => {
    chatActions.appendAssistantContent(messageId, char);
  }, 12);

  return new Promise((resolve, reject) => {
    const disconnect = createSSEConnection({
      messages,
      isInitial: false,
      onChunk: (chunk) => {
        typewriter.enqueue(chunk);
      },
      onError: (error) => {
        typewriter.flush();
        chatActions.finishAssistantMessage(messageId);
        chatActions.setError(error);
        disconnect();
        reject(new Error(error));
      },
      onComplete: () => {
        setTimeout(() => {
          typewriter.flush();
          chatActions.finishAssistantMessage(messageId);
          disconnect();
          resolve();
        }, 100);
      },
    });
  });
}

// 自然语言对话
export async function sendConversation(
  message: string,
  context?: ConversationOptions['context'],
  callbacks?: {
    onAction?: (action: string, data?: any) => void;
    onGitData?: (gitData: GitAnalysisResult) => void;
  }
): Promise<void> {
  chatActions.addUserMessage(message);
  const messageId = chatActions.startAssistantMessage();

  // 使用打字机效果队列
  const typewriter = new TypewriterQueue((char) => {
    chatActions.appendAssistantContent(messageId, char);
  }, 12); // 12ms 每字符，约 80 字/秒

  return new Promise((resolve, reject) => {
    const disconnect = createConversationConnection({
      message,
      context,
      onChunk: (chunk) => {
        // 将 chunk 加入打字机队列，逐字输出
        typewriter.enqueue(chunk);
      },
      onAction: callbacks?.onAction,
      onGitData: callbacks?.onGitData,
      onError: (error) => {
        typewriter.flush(); // 立即显示剩余内容
        chatActions.finishAssistantMessage(messageId);
        chatActions.setError(error);
        disconnect();
        reject(new Error(error));
      },
      onComplete: () => {
        // 等待打字机队列完成后再结束
        const checkComplete = () => {
          typewriter.flush(); // 确保所有内容都显示
          chatActions.finishAssistantMessage(messageId);
          disconnect();
          resolve();
        };
        // 给一点时间让最后的字符输出
        setTimeout(checkComplete, 100);
      },
    });
  });
}
