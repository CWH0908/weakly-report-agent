export interface Commit {
  hash: string;
  message: string;
  date: string;
  author: string;
  body?: string;
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface CommitDetail extends Commit {
  files: FileChange[];
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface CategoryMap {
  feature: Commit[];
  fix: Commit[];
  docs: Commit[];
  refactor: Commit[];
  test: Commit[];
  other: Commit[];
}

export interface GitAnalysisResult {
  repoName: string;
  repoPath: string;
  commits: CommitDetail[];
  summary: {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    filesChanged: string[];
  };
  categories: CategoryMap;
  dateRange: {
    since: string;
    until: string;
  };
}

export interface GitAnalyzeRequest {
  repoPath: string;
  since: string;
  until: string;
  author?: string;
}

export interface GitAnalyzeResponse {
  success: boolean;
  data?: GitAnalysisResult;
  error?: string;
}
