export interface RepoCommits {
  repoName: string;
  commits: Array<{
    sha: string;
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    url: string;
  }>;
}

export interface GenerateReportOptions {
  repoCommits: RepoCommits[];
  author: string;
  startDate: string;
  endDate: string;
  department?: string;
}
