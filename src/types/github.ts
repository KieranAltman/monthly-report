export interface GetCommitsOptions {
  /** 仓库所有者 */
  owner: string;
  /** 仓库名称 */
  repo: string;
  /** 提交作者(可选) */
  author?: string;
  /** 开始日期(可选) */
  since?: Date;
  /** 结束日期(可选) */
  until?: Date;
  /** 分支名称(默认为默认分支) */
  branch?: string;
  /** 每页数量(默认100) */
  perPage?: number;
}

export interface CommitInfo {
  message: string;
  date: string;
  author: {
    name: string;
    email: string;
  };
}
