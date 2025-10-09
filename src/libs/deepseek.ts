import type { CommitInfo } from "../types/github.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  addDays,
  isWithinInterval,
} from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface RepoCommits {
  repoName: string;
  commits: CommitInfo[];
}

export interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  dateRange: string;
}

export interface WeeklyRepoCommits {
  week: WeekInfo;
  repos: Array<{
    repoName: string;
    commits: CommitInfo[];
  }>;
}

export interface GenerateReportOptions {
  repoCommits: RepoCommits[];
  author: string;
  startDate: string;
  endDate: string;
  department?: string;
}

export class DeepSeekClient {
  private apiKey: string;
  private baseURL: string;
  private template: string;

  constructor(apiKey: string, baseURL = "https://api.deepseek.com") {
    this.apiKey = apiKey;
    this.baseURL = baseURL;

    // 读取模板文件
    const templatePath = join(__dirname, "../template/report.md");
    this.template = readFileSync(templatePath, "utf-8");
  }

  /**
   * 计算时间范围内的周信息
   */
  private calculateWeeks(startDate: string, endDate: string): WeekInfo[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 获取时间范围内的所有周的起始日期(周一)
    const weeks = eachWeekOfInterval(
      { start, end },
      { weekStartsOn: 1 } // 周一作为一周的开始
    );

    // 格式化每周的范围
    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      // 确保周的结束日期不超过指定的结束日期
      const actualEnd = weekEnd > end ? end : weekEnd;

      // 确保周的开始日期不早于指定的开始日期
      const actualStart = weekStart < start ? start : weekStart;

      return {
        weekNumber: index + 1,
        startDate: actualStart,
        endDate: actualEnd,
        dateRange: `${format(actualStart, "yyyy-MM-dd")} 到 ${format(actualEnd, "yyyy-MM-dd")}`,
      };
    });
  }

  /**
   * 按周分组 commits
   */
  private groupCommitsByWeek(
    repoCommits: RepoCommits[],
    weeks: WeekInfo[]
  ): WeeklyRepoCommits[] {
    return weeks.map((week) => {
      const repos = repoCommits.map((repo) => {
        // 过滤出属于当前周的 commits
        const weekCommits = repo.commits.filter((commit) => {
          const commitDate = new Date(commit.date);
          return isWithinInterval(commitDate, {
            start: week.startDate,
            end: week.endDate,
          });
        });

        return {
          repoName: repo.repoName,
          commits: weekCommits,
        };
      }).filter((repo) => repo.commits.length > 0); // 只保留有 commits 的仓库

      return {
        week,
        repos,
      };
    });
  }

  /**
   * 生成月报
   */
  async generateReport(options: GenerateReportOptions): Promise<string> {
    const {
      repoCommits,
      author,
      startDate,
      endDate,
      department = "Front-end - R&D",
    } = options;

    // 计算周信息
    const weeks = this.calculateWeeks(startDate, endDate);

    // 按周分组 commits
    const weeklyCommits = this.groupCommitsByWeek(repoCommits, weeks);

    // 格式化按周分组的 commits
    const weeklyText = weeklyCommits
      .map((weekData) => {
        if (weekData.repos.length === 0) {
          return `### 第${weekData.week.weekNumber}周 (${weekData.week.dateRange})\n本周无提交记录`;
        }

        const reposText = weekData.repos
          .map((repo) => {
            const commitsText = repo.commits
              .map((commit, index) => {
                const message = commit.message.split("\n")[0]; // 只取第一行
                return `  ${index + 1}. ${message}`;
              })
              .join("\n");

            return `- 项目: ${repo.repoName}\n${commitsText}`;
          })
          .join("\n\n");

        return `### 第${weekData.week.weekNumber}周 (${weekData.week.dateRange})\n${reposText}`;
      })
      .join("\n\n");

    const prompt = this.buildPrompt({
      weeklyText,
      author,
      startDate,
      endDate,
      department,
      template: this.template,
    });

    const response = await this.callDeepSeekAPI(prompt);
    return response;
  }

  /**
   * 构建提示词
   */
  private buildPrompt(params: {
    weeklyText: string;
    author: string;
    startDate: string;
    endDate: string;
    department: string;
    template: string;
  }): string {
    return `你是一个专业的技术月报生成助手。请根据以下信息生成一份专业的月报。

## 基本信息
- 作者: ${params.author}
- 部门: ${params.department}
- 时间范围: ${params.startDate} 至 ${params.endDate}

## 按周分组的 Commits
以下 commits 已经按周和项目分组好了,你只需要对每个 commit 进行专业的总结和润色:

${params.weeklyText}

## 模板格式
${params.template}

## 要求
1. 严格按照模板格式生成月报
2. **Commits 已经按周分组好了,你只需要:**
   - 保持原有的周划分和项目分组
   - 对每个 commit 用简洁专业的语言总结,突出技术要点和业务价值
   - 不要改变 commits 所属的周
3. **每周的工作总结格式**:
   #### 第一周
   - 项目: xxx
     1. commit content (经过你润色后的内容)
     2. commit content
   - 项目: yyy
     1. commit content
4. 如果某周显示"本周无提交记录",保持原样
5. "遇到的问题及解决方案"部分,从 commits 中提取 fix/bug 相关内容并总结
6. "下月工作计划"部分,根据当前工作内容合理推测下月计划
7. 直接输出月报内容,不要有任何额外的解释或前缀
8. 保持专业、简洁的技术写作风格
9. 使用中文输出

请生成月报:`;
  }

  /**
   * 调用 DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API 错误 (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message: {
          content: string;
        };
      }>;
    };

    if (!data.choices || data.choices.length === 0) {
      throw new Error("DeepSeek API 返回数据格式错误");
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * 获取模板内容
   */
  getTemplate(): string {
    return this.template;
  }
}
