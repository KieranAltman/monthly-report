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

## 环境变量说明

- `GITHUB_TOKEN`: GitHub Personal Access Token(访问私有仓库时必需)
- `GITHUB_AUTHOR`: 要筛选的提交作者用户名
- `GITHUB_REPOS`: 要查询的仓库列表,格式为 `owner/repo`,多个仓库用逗号分隔
