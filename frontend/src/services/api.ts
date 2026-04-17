import { GitConfig, GitAnalysisResult } from '../types';
import { ENABLE_MOCK, getMockGitData } from './mock';

const API_BASE = '/api';

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
