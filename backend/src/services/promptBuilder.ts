import { GitAnalysisResult } from '../types/index.js';

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class PromptBuilder {
  private systemPrompt = `你是一位专业的技术周报助手。请根据提供的Git提交记录生成结构化周报。
要求：
1. 用中文撰写周报内容
2. 按工作类型分类（新功能/修复/优化/文档等）
3. 突出主要成果和技术亮点
4. 自动生成合理的下周计划
5. 语言简洁专业，适合向上级汇报

输出格式必须是Markdown，包含以下章节：
- 本周工作总结（分类列出）
- 主要成果/亮点
- 遇到的问题（如有）
- 下周计划`;

  buildInitialPrompt(gitData: GitAnalysisResult): PromptMessage[] {
    const userPrompt = this.formatGitData(gitData);

    return [
      {
        role: 'system',
        content: this.systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];
  }

  private formatGitData(gitData: GitAnalysisResult): string {
    const { repoName, summary, categories, dateRange } = gitData;

    let content = `# Git提交记录分析报告\n\n`;
    content += `**项目**: ${repoName}\n`;
    content += `**时间范围**: ${dateRange.since} 至 ${dateRange.until}\n`;
    content += `**提交总数**: ${summary.totalCommits}\n`;
    content += `**代码变更**: +${summary.totalAdditions} / -${summary.totalDeletions} 行\n\n`;

    // 按分类列出提交
    const categoryNames: Record<string, string> = {
      feature: '新功能',
      fix: '问题修复',
      docs: '文档更新',
      refactor: '代码重构',
      test: '测试相关',
      other: '其他',
    };

    for (const [key, commits] of Object.entries(categories)) {
      if (commits.length > 0) {
        content += `## ${categoryNames[key] || key} (${commits.length}个提交)\n\n`;
        for (const commit of commits) {
          content += `- ${commit.message}\n`;
        }
        content += '\n';
      }
    }

    content += `\n请根据以上Git提交记录生成一份专业的周报。`;

    return content;
  }

  buildFollowUpPrompt(userMessage: string): PromptMessage {
    return {
      role: 'user',
      content: userMessage,
    };
  }
}

export const promptBuilder = new PromptBuilder();
