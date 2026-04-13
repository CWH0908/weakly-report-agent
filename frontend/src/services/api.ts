import { GitConfig, GitAnalysisResult } from '../types';

const API_BASE = '/api';

export async function analyzeGit(config: GitConfig): Promise<{
  success: boolean;
  data?: GitAnalysisResult;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/git/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  return response.json();
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
