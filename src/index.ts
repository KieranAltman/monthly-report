import "dotenv/config";
import { GitHubClient } from "./libs/github.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CommitInfo } from "./types/github.js";
import { generateReport, logCommits } from "./utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // 从环境变量获取配置
  const token = process.env.GITHUB_TOKEN;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const author = process.env.GITHUB_AUTHOR;

  const times = process.env.REPORT_TIME?.split(",") as [string, string];
  const department = process.env.DEPARTMENT || "Front-end - R&D";

  // 验证必需的环境变量
  if (!author || !times) {
    console.error("❌ 请设置以下环境变量:");
    if (!author) console.error("  - GITHUB_AUTHOR");
    if (!times) console.error("  - REPORT_TIME");
    process.exit(1);
  }

  // 初始化 GitHub 客户端
  const githubClient = new GitHubClient(token);

  // 验证认证状态
  if (token) {
    await githubClient.verifyAuth();
  }

  console.log("\n📊 获取 Commits...\n");

  // 从配置文件读取仓库与分支信息
  const configPath = join(__dirname, "./config/repos.json");
  const configRaw = readFileSync(configPath, "utf-8");
  const repoConfigs: { repo: string; branchs: string[] }[] =
    JSON.parse(configRaw);

  // 获取所有仓库的 commits,按仓库分组
  const repoCommits: { repoName: string; commits: CommitInfo[] }[] = [];
  let totalCommits = 0;

  for (const { repo, branchs } of repoConfigs) {
    const [owner, repoName] = repo.split("/");

    let aggregatedCommits: CommitInfo[] = [];
    const seen = new Set<string>();

    for (const branch of branchs) {
      console.log(`  - 正在获取 ${repo} (${branch}) 的提交记录...`);

      const commits = await githubClient.getCommits({
        owner,
        repo: repoName,
        author,
        branch,
        since: new Date(times[0]),
        until: new Date(times[1]),
      });

      let added = 0;
      for (const c of commits) {
        if (!seen.has(c.hash)) {
          seen.add(c.hash);
          aggregatedCommits.push(c);
          added++;
        }
      }
      totalCommits += added;
      console.log(
        `    ✅ [${branch}] 找到 ${commits.length} 个提交，新增 ${added} 个`
      );
    }

    repoCommits.push({
      repoName,
      commits: aggregatedCommits,
    });
  }

  console.log(`\n✅ 总共找到 ${totalCommits} 个提交\n`);

  // 按项目显示 commits 列表
  logCommits(repoCommits);

  // 如果提供了 DeepSeek API Key,生成月报
  await generateReport(deepseekApiKey, repoCommits, author, times, department);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
