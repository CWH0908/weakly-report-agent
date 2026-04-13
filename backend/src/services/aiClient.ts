import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export interface AIStreamOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIClient {
  private openrouter;
  private defaultModel = 'google/gemma-4-31b-it:free';
  private backupModels = [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
  ];

  constructor(apiKey?: string) {
    const key = apiKey || process.env['OPENROUTER_API_KEY'];
    if (!key) {
      console.warn('警告: 未设置 OPENROUTER_API_KEY，AI功能将无法使用');
    }

    this.openrouter = createOpenRouter({
      apiKey: key || 'dummy-key',
    });
  }

  /**
   * 用单个模型进行流式生成
   * maxRetries: 0 禁用 SDK 内置重试，由我们自己的 fallback 逻辑处理
   */
  private createStream(options: AIStreamOptions & { model: string }) {
    const { messages, model, temperature = 0.7, maxTokens = 2000 } = options;

    return streamText({
      model: this.openrouter(model),
      messages: messages as any,
      temperature,
      maxTokens,
      maxRetries: 0, // 禁用内置重试，由 fallback 机制接管
    });
  }

  /**
   * 带降级的流式聊天
   * 逐个尝试模型，失败立即切换下一个（不做内置重试），速度快
   */
  async streamWithFallback(
    options: AIStreamOptions,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const models = [options.model || this.defaultModel, ...this.backupModels];
    const errors: string[] = [];

    for (const model of models) {
      try {
        console.log(`[AI] 尝试模型: ${model}`);
        const result = this.createStream({ ...options, model });

        let hasOutput = false;
        for await (const chunk of result.textStream) {
          hasOutput = true;
          onChunk(chunk);
        }

        // 如果模型返回了空内容，视为失败，尝试下一个
        if (!hasOutput) {
          console.warn(`[AI] 模型 ${model} 返回空内容，尝试下一个`);
          errors.push(`${model}: 返回空内容`);
          continue;
        }

        console.log(`[AI] 模型 ${model} 生成完成`);
        return;
      } catch (error: any) {
        const msg = error?.message?.slice(0, 200) || String(error);
        console.error(`[AI] 模型 ${model} 失败: ${msg}`);
        errors.push(`${model}: ${msg}`);
        continue;
      }
    }

    throw new Error(`所有模型都不可用:\n${errors.join('\n')}`);
  }
}

let _aiClient: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!_aiClient) {
    _aiClient = new AIClient();
  }
  return _aiClient;
}

export const aiClient = getAIClient;
