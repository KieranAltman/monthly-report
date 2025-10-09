import "dotenv/config";
import { GitHubClient } from "./libs/github.js";
import { DeepSeekClient } from "./libs/deepseek.js";
import { format } from "date-fns";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // 从环境变量获取配置
  const token = process.env.GITHUB_TOKEN;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const author = process.env.GITHUB_AUTHOR;
  const repos = process.env.GITHUB_REPOS?.split(",");
  const times = process.env.REPORT_TIME?.split(",") as [string, string];
  const department = process.env.DEPARTMENT || "Front-end - R&D";

  // 验证必需的环境变量
  if (!author || !repos || !times) {
    console.error("❌ 请设置以下环境变量:");
    if (!author) console.error("  - GITHUB_AUTHOR");
    if (!repos) console.error("  - GITHUB_REPOS");
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

  // 获取所有仓库的 commits,按仓库分组
  const repoCommits = [];
  let totalCommits = 0;

  for (const repo of repos) {
    // 解析仓库配置: owner/repo 或 owner/repo:branch
    const [repoPath, branch] = repo.split(":");
    const [owner, repoName] = repoPath.split("/");

    console.log(`  - 正在获取 ${repoPath} 的提交记录...`);

    const commits = await githubClient.getCommits({
      owner,
      repo: repoName,
      author,
      branch, // 如果未指定则为 undefined,使用默认分支
      since: new Date(times[0]),
      until: new Date(times[1]),
    });

    repoCommits.push({
      repoName: repoName,
      commits,
    });

    totalCommits += commits.length;
    console.log(`    ✅ 找到 ${commits.length} 个提交`);
  }

  console.log(`\n✅ 总共找到 ${totalCommits} 个提交\n`);

  // 按项目显示 commits 列表
  console.log("📝 Commits 列表:\n");
  repoCommits.forEach((repo) => {
    console.log(`\n【${repo.repoName}】 (${repo.commits.length} 个提交)`);
    repo.commits.forEach((commit, index) => {
      console.log(
        `  ${index + 1}.\t${format(commit.date, "yyyy-MM-dd")}\t${
          commit.message.split("\n")[0]
        }`
      );
    });
  });

  // 如果提供了 DeepSeek API Key,生成月报
  if (deepseekApiKey) {
    console.log("\n\n🤖 正在使用 DeepSeek 生成月报...\n");

    const deepseekClient = new DeepSeekClient(deepseekApiKey);

    const report = await deepseekClient.generateReport({
      repoCommits,
      author,
      startDate: times[0],
      endDate: times[1],
      department,
    });

    // 保存月报到 .output 目录
    const outputDir = join(__dirname, "../.output");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 根据时间范围生成文件名 (格式: YYYY-MM.md)
    const startDate = new Date(times[0]);
    const monthFileName = format(startDate, "yyyy-MM");
    const outputPath = join(outputDir, `${monthFileName}.md`);

    // 写入文件
    writeFileSync(outputPath, report, "utf-8");

    console.log("=".repeat(80));
    console.log(`\n✅ 月报已生成并保存到: ${outputPath}`);
    console.log("💡 可以直接复制到邮件中使用");
  } else {
    console.log("\n💡 提示: 设置 DEEPSEEK_API_KEY 环境变量可自动生成月报");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
