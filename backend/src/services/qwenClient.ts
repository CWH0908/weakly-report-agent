import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export interface QwenStreamOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class QwenClient {
  private client;
  private defaultModel = 'qwen-turbo';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.DASHSCOPE_API_KEY;
    if (!key) {
      console.warn('警告: 未设置 DASHSCOPE_API_KEY，Qwen功能将无法使用');
    }

    // 创建阿里云百炼兼容客户端
    this.client = createOpenAICompatible({
      name: 'qwen',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  }

  async *streamChat(options: QwenStreamOptions): AsyncGenerator<string, void, unknown> {
    const {
      messages,
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
    } = options;

    try {
      const result = streamText({
        model: this.client(model),
        messages,
        temperature,
        maxTokens,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      console.error('Qwen流式生成错误:', error);
      throw error;
    }
  }
}

export const qwenClient = new QwenClient();
