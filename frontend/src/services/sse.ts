import { chatActions } from '../stores/chatStore';
import { GitAnalysisResult } from '../types';
import { ENABLE_MOCK, createMockSSEConnection } from './mock';

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

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

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

// 生成周报
export async function generateWeeklyReport(gitData: GitAnalysisResult): Promise<void> {
  const messageId = chatActions.startAssistantMessage();

  return new Promise((resolve, reject) => {
    const disconnect = createSSEConnection({
      messages: [],
      gitData,
      isInitial: true,
      onChunk: (chunk) => {
        chatActions.appendAssistantContent(messageId, chunk);
      },
      onError: (error) => {
        chatActions.finishAssistantMessage(messageId);
        chatActions.setError(error);
        disconnect();
        reject(new Error(error));
      },
      onComplete: () => {
        chatActions.finishAssistantMessage(messageId);
        disconnect();
        resolve();
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

  return new Promise((resolve, reject) => {
    const disconnect = createSSEConnection({
      messages,
      isInitial: false,
      onChunk: (chunk) => {
        chatActions.appendAssistantContent(messageId, chunk);
      },
      onError: (error) => {
        chatActions.finishAssistantMessage(messageId);
        chatActions.setError(error);
        disconnect();
        reject(new Error(error));
      },
      onComplete: () => {
        chatActions.finishAssistantMessage(messageId);
        disconnect();
        resolve();
      },
    });
  });
}
