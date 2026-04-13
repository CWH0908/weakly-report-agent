export interface Commit {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export interface CommitDetail extends Commit {
  body?: string;
  files: FileChange[];
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
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

export interface GitConfig {
  repoPath: string;
  since: string;
  until: string;
  author?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  gitConfig: GitConfig | null;
  gitData: GitAnalysisResult | null;
  error: string | null;
}
