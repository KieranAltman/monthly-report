# 配置指南

## GitHub Token 配置

### 为什么需要 Token?

- **公开仓库**: 不需要 token,但有 API 速率限制(每小时 60 次请求)
- **私有仓库**: **必须**提供具有适当权限的 token

### 如何创建 GitHub Personal Access Token

1. 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. 点击 **"Generate new token"** > **"Generate new token (classic)"**
3. 设置 token 名称,例如: `monthly-report-script`
4. 选择过期时间(建议选择合适的时间,不要选择 "No expiration")
5. **选择权限**:

   **访问私有仓库(必需)**:

   - ✅ `repo` - Full control of private repositories
     - 这会自动包含所有子权限:
       - `repo:status` - Access commit status
       - `repo_deployment` - Access deployment status
       - `public_repo` - Access public repositories
       - `repo:invite` - Access repository invitations
       - `security_events` - Read and write security events

   **仅访问公开仓库(可选)**:

   - ✅ `public_repo` - Access public repositories

6. 点击 **"Generate token"**
7. **立即复制 token**(离开页面后将无法再次查看)

### 配置 Token

1. 复制 `.env.example` 为 `.env`:

   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件,填入你的配置:

   ```env
   GITHUB_TOKEN=ghp_your_actual_token_here
   GITHUB_AUTHOR=your_github_username
   GITHUB_REPOS=owner/repo1,owner/repo2
   ```

3. 确保 `.env` 文件不会被提交到 Git(已在 `.gitignore` 中配置)

### 验证 Token 权限

如果遇到 404 错误,检查:

1. **Token 是否正确设置**

   ```bash
   echo $GITHUB_TOKEN  # 应该显示你的 token
   ```

2. **Token 是否有 repo 权限**

   - 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - 找到你的 token
   - 确认 `repo` 权限已勾选

3. **你是否有仓库访问权限**
   - 确认你可以在 GitHub 网页上访问该仓库
   - 如果是组织仓库,确认你是成员且有访问权限

### 常见错误

#### 404 Not Found

- **原因**: Token 没有权限或仓库不存在
- **解决**: 确保 token 有 `repo` 权限,且你有仓库访问权限

#### 401 Unauthorized

- **原因**: Token 无效或已过期
- **解决**: 重新生成 token

#### 403 Forbidden

- **原因**: Token 权限不足或 API 速率限制
- **解决**: 检查 token 权限或等待速率限制重置

## DeepSeek API 配置

### 为什么需要 DeepSeek API?

DeepSeek API 用于自动生成专业的月报内容:

- ✅ 自动总结和润色 commit 信息
- ✅ 提取问题和解决方案
- ✅ 生成下月工作计划
- ✅ 保持专业的技术写作风格

如果不配置 DeepSeek API Key,工具仍然可以运行,但只会显示 commits 列表,不会生成月报。

### 如何获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 [API Keys 页面](https://platform.deepseek.com/api_keys)
4. 点击 **"创建 API Key"**
5. 设置 Key 名称,例如: `monthly-report`
6. 点击创建并**立即复制 API Key**(离开页面后将无法再次查看)

### 配置 API Key

在 `.env` 文件中添加:

```env
DEEPSEEK_API_KEY=sk-your_actual_api_key_here
```

### API 使用说明

**模型**: `deepseek-chat`
**参数**:

- `temperature`: 0.7 (平衡创造性和准确性)
- `max_tokens`: 4000 (足够生成完整月报)

**费用**:

- DeepSeek API 按 token 计费
- 一份月报大约消耗 2000-4000 tokens
- 具体费用请查看 [DeepSeek 定价页面](https://platform.deepseek.com/pricing)

### 常见错误

#### API Key 无效

- **错误信息**: `DeepSeek API 错误 (401)`
- **原因**: API Key 错误或已失效
- **解决**: 检查 API Key 是否正确复制,或重新生成

#### 余额不足

- **错误信息**: `DeepSeek API 错误 (402)` 或 `insufficient balance`
- **原因**: 账户余额不足
- **解决**: 前往 DeepSeek 平台充值

#### 请求超时

- **错误信息**: `fetch failed` 或 `timeout`
- **原因**: 网络问题或 API 响应慢
- **解决**: 检查网络连接,稍后重试

## 仓库和分支配置

### 基本格式

```env
# 不指定分支(使用默认分支)
GITHUB_REPOS=owner/repo1,owner/repo2

# 指定分支
GITHUB_REPOS=owner/repo1:main,owner/repo2:develop,owner/repo3:feature/new-ui
```

### 使用场景

**1. 不同仓库使用不同主分支**

```env
GITHUB_REPOS=company/backend:master,company/frontend:main
```

**2. 统计特定功能分支**

```env
GITHUB_REPOS=owner/repo:feature/payment-integration
```

**3. 多环境开发**

```env
# 开发环境
GITHUB_REPOS=owner/repo:develop

# 生产环境
GITHUB_REPOS=owner/repo:main
```

### 注意事项

- 如果不指定分支,将使用仓库的默认分支(通常是 `main` 或 `master`)
- 分支名称区分大小写
- 确保你有访问该分支的权限

## 时间范围配置

### 格式

```env
REPORT_TIME=YYYY-MM-DD,YYYY-MM-DD
```

### 示例

**月报**:

```env
# 2025年1月月报
REPORT_TIME=2025-01-01,2025-01-31

# 2025年9月月报
REPORT_TIME=2025-09-01,2025-09-30
```

**周报**:

```env
# 第一周
REPORT_TIME=2025-01-01,2025-01-07

# 第二周
REPORT_TIME=2025-01-08,2025-01-14
```

**季度报告**:

```env
# Q1 季度报告
REPORT_TIME=2025-01-01,2025-03-31
```

### 周划分说明

工具会自动按周(周一到周日)分组 commits:

- 使用 `date-fns` 的 `isWithinInterval` 精确匹配
- 以周一作为一周的开始
- 自动处理跨月的周
- 不完整的周(如月初/月末)也会正确识别

## 部门配置

### 默认值

如果不设置 `DEPARTMENT`,默认为: `Front-end - R&D`

### 自定义

```env
DEPARTMENT=Backend - Infrastructure
DEPARTMENT=Mobile - iOS
DEPARTMENT=DevOps - Platform
```

## 环境变量说明

| 变量               | 必需         | 说明                            | 示例                    |
| ------------------ | ------------ | ------------------------------- | ----------------------- |
| `GITHUB_TOKEN`     | 私有仓库必需 | GitHub Personal Access Token    | `ghp_xxx...`            |
| `GITHUB_AUTHOR`    | 是           | 提交作者的 GitHub 用户名        | `xxx`                   |
| `GITHUB_REPOS`     | 是           | 仓库列表,支持指定分支           | `owner/repo:branch`     |
| `REPORT_TIME`      | 是           | 时间范围                        | `2025-09-01,2025-09-30` |
| `DEEPSEEK_API_KEY` | 否           | DeepSeek API Key,用于生成月报   | `sk-xxx...`             |
| `DEPARTMENT`       | 否           | 部门名称,默认 `Front-end - R&D` | `Backend - API`         |

## 安全建议

1. **永远不要提交 `.env` 文件到 Git**

   - 已在 `.gitignore` 中配置
   - 包含敏感信息(API Keys, Tokens)

2. **定期更新 Token**

   - 建议设置过期时间
   - 定期轮换 API Keys

3. **最小权限原则**

   - GitHub Token 只授予必需的权限
   - 不同项目使用不同的 Token

4. **监控 API 使用**
   - 定期检查 DeepSeek API 使用量
   - 设置费用预警

## 故障排查

### 工具无法运行

1. **检查环境变量**

   ```bash
   cat .env
   ```

2. **验证配置格式**

   - 确保没有多余的空格
   - 确保日期格式正确

3. **测试 GitHub 连接**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

### 月报生成失败

1. **检查 DeepSeek API Key**

   - 确认 Key 是否有效
   - 检查账户余额

2. **查看错误信息**

   - 工具会显示详细的错误信息
   - 根据错误码排查问题

3. **网络问题**
   - 确认可以访问 `api.deepseek.com`
   - 检查代理设置

## 获取帮助

如果遇到问题:

1. 查看 [README.md](./README.md) 了解基本用法
2. 查看 [GitHub Issues](https://github.com/KieranAltman/monthly-report/issues)
3. 提交新的 Issue 描述问题
