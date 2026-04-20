import { Router, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const router = Router();

interface DirItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo?: boolean;
}

/**
 * 获取磁盘驱动器列表（Windows）或根目录（Unix）
 */
async function getDrives(): Promise<DirItem[]> {
  if (os.platform() === 'win32') {
    // Windows: 遍历可能的盘符
    const drives: DirItem[] = [];
    for (const letter of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
      const drivePath = `${letter}:\\`;
      try {
        await fs.access(drivePath);
        drives.push({
          name: `${letter}:`,
          path: drivePath,
          isDirectory: true,
        });
      } catch {
        // 驱动器不存在，跳过
      }
    }
    return drives;
  } else {
    // Unix: 返回常用目录
    const homedir = os.homedir();
    return [
      { name: '/', path: '/', isDirectory: true },
      { name: 'Home', path: homedir, isDirectory: true },
    ];
  }
}

/**
 * 检查目录是否是 Git 仓库
 */
async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(dirPath, '.git'));
    return true;
  } catch {
    return false;
  }
}

/**
 * 列出目录内容
 */
router.get('/list', async (req: Request, res: Response) => {
  const dirPath = req.query.path as string;

  try {
    // 如果没有指定路径，返回驱动器/根目录列表
    if (!dirPath) {
      const drives = await getDrives();
      return res.json({
        success: true,
        path: '',
        parent: null,
        items: drives,
      });
    }

    // 规范化路径
    const normalizedPath = path.resolve(dirPath);

    // 验证路径存在
    try {
      await fs.access(normalizedPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `路径不存在: ${normalizedPath}`,
      });
    }

    // 读取目录内容
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

    // 只返回目录，过滤隐藏文件夹（以.开头，但保留有用的）
    const items: DirItem[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // 跳过系统隐藏目录，但保留普通隐藏目录
      if (entry.name.startsWith('$') || entry.name === 'System Volume Information') continue;

      const itemPath = path.join(normalizedPath, entry.name);
      items.push({
        name: entry.name,
        path: itemPath,
        isDirectory: true,
        isGitRepo: await isGitRepo(itemPath),
      });
    }

    // 按名称排序，Git 仓库优先
    items.sort((a, b) => {
      if (a.isGitRepo && !b.isGitRepo) return -1;
      if (!a.isGitRepo && b.isGitRepo) return 1;
      return a.name.localeCompare(b.name);
    });

    // 计算父目录
    const parent = path.dirname(normalizedPath);
    const hasParent = parent !== normalizedPath;

    res.json({
      success: true,
      path: normalizedPath,
      parent: hasParent ? parent : null,
      items,
    });
  } catch (error: any) {
    console.error('[FS] 列出目录失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '读取目录失败',
    });
  }
});

export default router;
