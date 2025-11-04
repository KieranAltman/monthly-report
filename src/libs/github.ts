import { Octokit } from "@octokit/rest";
import type { GetCommitsOptions, CommitInfo } from "../types/github.js";
import { format } from "date-fns";

export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    if (!token) {
      console.warn("⚠️  未提供 GITHUB_TOKEN,只能访问公开仓库");
    }

    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * 验证认证状态
   */
  async verifyAuth(): Promise<void> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      console.log(`✅ 认证成功: ${data.login}`);
      console.log(`📊 账户类型: ${data.type}`);
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error("❌ 认证失败: Token 无效或已过期");
      }
      throw new Error(`❌ 认证验证失败: ${error.message}`);
    }
  }

  /**
   * 获取仓库的 commit 信息
   */
  async getCommits(options: GetCommitsOptions): Promise<CommitInfo[]> {
    const {
      owner,
      repo,
      author,
      since,
      until,
      branch,
      perPage = 100,
    } = options;

    const commits: CommitInfo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.octokit.rest.repos.listCommits({
          owner,
          repo,
          sha: branch,
          author,
          since: since?.toISOString(),
          until: until?.toISOString(),
          per_page: perPage,
          page,
        });

        if (response.data.length === 0) {
          hasMore = false;
          break;
        }

        for (const commit of response.data) {
          commits.push({
            hash: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || "",
              email: commit.commit.author?.email || "",
            },
            date: commit.commit.author?.date
              ? format(commit.commit.author.date, "yyyy-MM-dd")
              : "",
          });
        }

        // 如果返回的数量少于每页数量,说明没有更多数据了
        if (response.data.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error: any) {
        if (error.status === 404) {
          throw new Error(
            `仓库 ${owner}/${repo} 不存在或无权访问。\n` +
              `如果这是私有仓库,请确保:\n` +
              `1. GITHUB_TOKEN 已正确设置\n` +
              `2. Token 具有 'repo' 权限(访问私有仓库)\n` +
              `3. 你对该仓库有访问权限\n\n` +
              `创建或更新 token: https://github.com/settings/tokens`
          );
        }
        throw error;
      }
    }

    // 过滤掉 Merge 类型的 commit
    const filteredCommits = commits.filter((commit) => {
      const message = commit.message.toLowerCase();
      return (
        !message.startsWith("merge pull request") &&
        !message.startsWith("merge branch") &&
        !message.startsWith("merge remote-tracking branch")
      );
    });
    filteredCommits.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return filteredCommits;
  }

  /**
   * 获取单个仓库的详细信息
   */
  async getRepository(owner: string, repo: string) {
    const response = await this.octokit.rest.repos.get({
      owner: owner ?? "",
      repo,
    });
    return response.data;
  }
}
