export interface AIStreamOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIClient {
  private apiKey: string;
  // 2026年4月可用的免费模型
  private defaultModel = 'nvidia/nemotron-3-super-120b-a12b:free';
  private backupModels = [
    'google/gemma-4-26b-a4b-it:free',       // Gemma 4 26B
    'google/gemma-4-31b-it:free',           // Gemma 4 31B
    'nvidia/nemotron-3-nano-30b-a3b:free',  // Nemotron 3 Nano 30B
    'nvidia/nemotron-nano-9b-v2:free',      // Nemotron Nano 9B
    'nvidia/nemotron-nano-12b-v2-vl:free',  // Nemotron Nano 12B VL
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'qwen/qwen3-4b:free',                   // Qwen3 4B
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['OPENROUTER_API_KEY'] || '';
    if (!this.apiKey) {
      console.warn('警告: 未设置 OPENROUTER_API_KEY，AI功能将无法使用');
    }
  }

  /**
   * 用原生 HTTP 进行流式生成
   */
  private async *createStream(
    options: AIStreamOptions & { model: string },
  ): AsyncGenerator<string> {
    const { messages, model, temperature = 0.7, maxTokens = 2000 } = options;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://weekly-report-agent.local',
        'X-Title': 'Weekly Report Agent',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // 忽略解析错误的行
        }
      }
    }
  }

  /**
   * 带降级的流式聊天
   * 逐个尝试模型，失败立即切换下一个，速度快
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

        let hasOutput = false;
        let chunkCount = 0;

        for await (const chunk of this.createStream({ ...options, model })) {
          hasOutput = true;
          chunkCount++;
          console.log(`[AI] chunk #${chunkCount}: len=${chunk.length}, text="${chunk.slice(0, 50).replace(/\n/g, '\\n')}${chunk.length > 50 ? '...' : ''}"`);
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
