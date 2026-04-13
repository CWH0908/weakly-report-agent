import { Router, Request, Response } from 'express';
import { gitAnalyzer } from '../services/gitAnalyzer.js';
import { GitAnalyzeRequest, GitAnalyzeResponse } from '../types/index.js';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { repoPath, since, until, author }: GitAnalyzeRequest = req.body;

    console.log('[Git Analyze] 收到请求:', { repoPath, since, until, author });

    // 参数验证
    if (!repoPath || !since || !until) {
      const response: GitAnalyzeResponse = {
        success: false,
        error: '缺少必要参数: repoPath, since, until',
      };
      return res.status(400).json(response);
    }

    // 执行Git分析
    const result = await gitAnalyzer.analyze(repoPath, since, until, author);

    const response: GitAnalyzeResponse = {
      success: true,
      data: result,
    };

    return res.json(response);
  } catch (error) {
    console.error('[Git Analyze] 错误:', error);
    const errorMessage = error instanceof Error ? error.message : '分析失败';
    const response: GitAnalyzeResponse = {
      success: false,
      error: errorMessage,
    };
    return res.status(500).json(response);
  }
});

export default router;
