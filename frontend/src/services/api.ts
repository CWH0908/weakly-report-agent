import { GitConfig, GitAnalysisResult } from '../types';
import { ENABLE_MOCK, getMockGitData } from './mock';

const API_BASE = '/api';

// 目录项类型
export interface DirItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo?: boolean;
}

// 目录列表响应
export interface DirListResponse {
  success: boolean;
  path: string;
  parent: string | null;
  items: DirItem[];
  error?: string;
}

// 获取目录列表
export async function listDirectory(dirPath?: string): Promise<DirListResponse> {
  try {
    const url = dirPath 
      ? `${API_BASE}/fs/list?path=${encodeURIComponent(dirPath)}`
      : `${API_BASE}/fs/list`;
    
    const response = await fetch(url);
    return response.json();
  } catch (err) {
    return { 
      success: false, 
      path: dirPath || '',
      parent: null,
      items: [],
      error: err instanceof Error ? err.message : '请求失败' 
    };
  }
}

export async function analyzeGit(config: GitConfig): Promise<{
  success: boolean;
  data?: GitAnalysisResult;
  error?: string;
}> {
  if (ENABLE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, data: getMockGitData(config) };
  }

  try {
    const response = await fetch(`${API_BASE}/git/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return { success: false, error: json.error || `HTTP ${response.status}` };
      } catch {
        return { success: false, error: text || `HTTP ${response.status}` };
      }
    }

    return response.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '请求失败' };
  }
}

export async function exportReport(
  content: string,
  filename?: string
): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/report/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, filename }),
  });

  return response.json();
}

export function downloadReport(downloadUrl: string): void {
  window.open(downloadUrl, '_blank');
}
