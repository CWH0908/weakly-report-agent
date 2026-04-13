import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();

interface ExportRequest {
  content: string;
  filename?: string;
}

interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  filePath?: string;
  error?: string;
}

// 导出周报为Markdown文件
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { content, filename }: ExportRequest = req.body;

    if (!content) {
      const response: ExportResponse = {
        success: false,
        error: '缺少content参数',
      };
      return res.status(400).json(response);
    }

    // 生成文件名
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const defaultFilename = `周报_${dateStr}.md`;
    const finalFilename = filename || defaultFilename;

    // 保存到临时目录
    const tempDir = path.join(os.tmpdir(), 'weekly-reports');
    await fs.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, finalFilename);

    await fs.writeFile(filePath, content, 'utf-8');

    const response: ExportResponse = {
      success: true,
      filePath,
      downloadUrl: `/api/report/download?file=${encodeURIComponent(finalFilename)}`,
    };

    return res.json(response);
  } catch (error) {
    console.error('导出失败:', error);
    const response: ExportResponse = {
      success: false,
      error: '导出失败',
    };
    return res.status(500).json(response);
  }
});

// 下载文件
router.get('/download', async (req: Request, res: Response) => {
  try {
    const filename = req.query.file as string;

    if (!filename) {
      return res.status(400).json({ error: '缺少文件名' });
    }

    // 防止目录遍历攻击
    const safeFilename = path.basename(filename);
    const tempDir = path.join(os.tmpdir(), 'weekly-reports');
    const filePath = path.join(tempDir, safeFilename);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

    const content = await fs.readFile(filePath, 'utf-8');
    return res.send(content);
  } catch (error) {
    console.error('下载失败:', error);
    return res.status(500).json({ error: '下载失败' });
  }
});

export default router;
