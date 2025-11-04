import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { DeepSeekClient } from "../libs/deepseek";
import { CommitInfo } from "../types";
import { format } from "date-fns";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateReport(
  deepseekApiKey: string | undefined,
  repoCommits: { repoName: string; commits: CommitInfo[] }[],
  author: string,
  times: [string, string],
  department: string
) {
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
    const outputDir = join(__dirname, "../../.output");
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

export function logCommits(
  list: { repoName: string; commits: CommitInfo[] }[]
) {
  console.log("📝 Commits 列表:\n");
  list.forEach((repo) => {
    console.log(`\n【${repo.repoName}】 (${repo.commits.length} 个提交)`);
    repo.commits.forEach((commit, index) => {
      console.log(
        `  ${index + 1}.\t${format(commit.date, "yyyy-MM-dd")}\t${
          commit.message.split("\n")[0]
        }`
      );
    });
  });
}
