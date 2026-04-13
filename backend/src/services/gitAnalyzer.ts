import simpleGit, { SimpleGit, DefaultLogFields, ListLogLine } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import {
  Commit,
  CommitDetail,
  CategoryMap,
  GitAnalysisResult,
  FileChange,
} from '../types/index.js';

export class GitAnalyzer {
  async analyze(
    repoPath: string,
    since: string,
    until: string,
    author?: string
  ): Promise<GitAnalysisResult> {
    // 验证路径是否存在
    try {
      await fs.access(repoPath);
    } catch {
      throw new Error(`路径不存在: ${repoPath}`);
    }

    // 验证是否是Git仓库
    const git: SimpleGit = simpleGit(repoPath);
    try {
      await git.status();
    } catch {
      throw new Error(`无效的Git仓库: ${repoPath}`);
    }

    // 构建日志查询选项
    const logOptions: any = {
      '--since': since,
      '--until': until,
      '--no-merges': null,
    };

    if (author) {
      logOptions['--author'] = author;
    }

    // 获取提交记录
    const log = await git.log(logOptions);

    // 解析每个提交的详细信息
    const commitDetails: CommitDetail[] = [];
    for (const commit of log.all) {
      const detail = await this.parseCommitDetail(git, commit);
      commitDetails.push(detail);
    }

    // 计算统计数据
    const summary = this.calcStats(commitDetails);

    // 分类提交
    const categories = this.categorize(commitDetails);

    return {
      repoName: path.basename(repoPath),
      repoPath,
      commits: commitDetails,
      summary,
      categories,
      dateRange: {
        since,
        until,
      },
    };
  }

  private async parseCommitDetail(
    git: SimpleGit,
    commit: DefaultLogFields
  ): Promise<CommitDetail> {
    // 获取提交统计信息
    const showResult = await git.show([
      commit.hash,
      '--stat',
      '--format=',
    ]);

    // 解析文件变更
    const files = this.parseFileChanges(showResult);
    const stats = this.calcFileStats(files);

    return {
      hash: commit.hash,
      message: commit.message.split('\n')[0],
      body: commit.message.split('\n').slice(1).join('\n').trim(),
      date: commit.date,
      author: commit.author_name,
      files,
      stats,
    };
  }

  private parseFileChanges(statOutput: string): FileChange[] {
    const files: FileChange[] = [];
    const lines = statOutput.split('\n');

    for (const line of lines) {
      // 匹配类似: " src/main.ts | 10 +++---"
      const match = line.match(/^\s*([^|]+)\|\s*([\d]+)\s+([+\-]+)$/);
      if (match) {
        const filePath = match[1].trim();
        const changes = match[3];
        const additions = (changes.match(/\+/g) || []).length;
        const deletions = (changes.match(/-/g) || []).length;

        files.push({
          path: filePath,
          additions,
          deletions,
        });
      }
    }

    return files;
  }

  private calcFileStats(files: FileChange[]): { additions: number; deletions: number } {
    return files.reduce(
      (acc, file) => ({
        additions: acc.additions + file.additions,
        deletions: acc.deletions + file.deletions,
      }),
      { additions: 0, deletions: 0 }
    );
  }

  private calcStats(commits: CommitDetail[]): GitAnalysisResult['summary'] {
    const filesChanged = new Set<string>();
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const commit of commits) {
      for (const file of commit.files) {
        filesChanged.add(file.path);
      }
      totalAdditions += commit.stats.additions;
      totalDeletions += commit.stats.deletions;
    }

    return {
      totalCommits: commits.length,
      totalAdditions,
      totalDeletions,
      filesChanged: Array.from(filesChanged),
    };
  }

  private categorize(commits: Commit[]): CategoryMap {
    const categories: CategoryMap = {
      feature: [],
      fix: [],
      docs: [],
      refactor: [],
      test: [],
      other: [],
    };

    for (const commit of commits) {
      const msg = commit.message.toLowerCase();

      if (
        msg.startsWith('feat') ||
        msg.startsWith('feature') ||
        msg.includes('新增') ||
        msg.includes('添加')
      ) {
        categories.feature.push(commit);
      } else if (
        msg.startsWith('fix') ||
        msg.startsWith('bugfix') ||
        msg.includes('修复') ||
        msg.includes('解决')
      ) {
        categories.fix.push(commit);
      } else if (
        msg.startsWith('docs') ||
        msg.includes('文档') ||
        msg.includes('readme')
      ) {
        categories.docs.push(commit);
      } else if (
        msg.startsWith('refactor') ||
        msg.includes('重构') ||
        msg.includes('优化')
      ) {
        categories.refactor.push(commit);
      } else if (
        msg.startsWith('test') ||
        msg.startsWith('tests') ||
        msg.includes('测试')
      ) {
        categories.test.push(commit);
      } else {
        categories.other.push(commit);
      }
    }

    return categories;
  }
}

export const gitAnalyzer = new GitAnalyzer();
