## Gemini CLI 自定义命令权威指南：将您的终端升级为个性化 AI 助手

### 引言
Gemini CLI 让开发者可以在终端中直接与 Gemini 模型交互。其“自定义命令”功能不仅能提升问答效率，更能将零散的自然语言指令固化为结构化、可复用、可共享的自动化工具，进而把 Gemini CLI 演进为“可编程 AI 代理”。本指南聚焦高阶用法与实战范例，帮助你构建个性化的 AI 工作流。

---

## 第一章：自定义命令核心概念

### 1.1 什么是自定义命令？
自定义命令是封装了角色、任务和上下文注入逻辑的“可复用提示模板”。命令以 `.toml` 文件形式存在，包含两部分：
- **description**: 命令的简短说明，用于 CLI 自动补全提示。
- **prompt**: 关键的多行字符串，包含角色设定、输出要求以及占位符，如 `{{args}}`（用户输入）与 `!{...}`（动态注入 shell 输出）。

### 1.2 为什么要使用自定义命令？
- **效率**: 将高频重复的长提示缩短为秒级命令调用。
- **一致性**: 固化“最佳提示”，确保全员输出质量与风格统一。
- **协作**: 项目级命令可随仓库版本化，与团队共享最佳实践。

### 1.3 TOML 是沟通契约
TOML 人类可读性强、结构清晰，易于在团队中共享与维护。命令本身声明“做什么”；模型生成参数（如 temperature）由 CLI 的“执行环境”决定。

---

## 第二章：基础入门：创建你的第一个自定义命令

### 2.1 准备工作
- Node.js v18+
- 最新 Gemini CLI

```bash
npm install -g @google/gemini-cli@latest
```

### 2.2 命令作用域（Scopes）：全局 vs. 项目
- **全局命令（User/Global）**: `~/.gemini/commands/`，在所有项目可用，适合通用任务。
- **项目命令（Project/Local）**: `<project>/.gemini/commands/`，仅当前项目可用，适合项目上下文相关任务。
- **优先级**: 同名时项目命令覆盖全局命令。

### 2.3 实战：创建 `/explain`
1) 新建文件
```bash
mkdir -p ~/.gemini/commands
cat > ~/.gemini/commands/explain.toml <<'TOML'
description = "Explains a piece of code, a concept, or a command."

prompt = """
You are an expert educator and software engineer. Your goal is to explain the following topic clearly and concisely to a developer.
Use analogies where appropriate, and if it's code, break it down line-by-line or block-by-block.
The topic to explain is: {{args}}
"""
TOML
```
2) 使用 `{{args}}` 作为命令后的整段输入。
3) 重启 Gemini CLI，执行：
```bash
/explain const { data } = useSWR('/api/user')
```

---

## 第三章：进阶技巧

### 3.1 动态上下文注入：`!{...}` 语法
在 prompt 中执行 shell 命令，将其标准输出注入 prompt 内容。例如自动生成 Conventional Commit 信息：

```toml
# ~/.gemini/commands/git/commit.toml
description = "Generates a Conventional Commit message based on staged changes."

prompt = """
Analyze the following staged code changes and generate a concise Conventional Commit message.
Staged changes:
```diff
!{git diff --staged}
"""
```

CLI 会在注入前提示授权，保障安全。

### 3.2 命令组织与命名空间
目录层级即命名空间（`/` 转 `:`）：
- `~/.gemini/commands/git/commit.toml` → `/git:commit`
- `<project>/.gemini/commands/api/review/schema.toml` → `/api:review:schema`

### 3.3 高级参数处理
- **约定分隔符**：
  - 调用：`/create-user name:John | email:john@example.com`
  - Prompt 片段：
    ```
    Parse the following user data, separated by '|', and generate JSON: {{args}}
    ```
- **结合 Shell 脚本**：
  - 调用：`/deploy-service my-app --env production`
  - Prompt 片段：
    ```
    Deployment Plan:
    !{/path/to/prepare_deployment.sh {{args}}}
    ```

### 3.4 命令链式调用（Workflow 组装）
命令内部调用其他命令输出，用作自身 prompt 的一部分：

```toml
# <project>/.gemini/commands/api/integrate-full.toml
description = "Performs a full integration of a new API endpoint."

prompt = """
I will now integrate the API for: {{args}}

Step 1: Creating the data model.
!{/api:create-model {{args}}}

Step 2: Creating the service call.
!{/api:create-service {{args}}}

Step 3: Creating the unit tests.
!{/api:create-tests {{args}}}

The full API integration is complete.
"""
```

---

## 第四章：实战应用示例

### 4.1 Git 工作流：自动生成提交信息 `/git:commit`
```toml
# ~/.gemini/commands/git/commit.toml
description = "Generates a Conventional Commit message based on staged changes and user intent."

prompt = """
You are an expert at writing Conventional Commit messages. Analyze the output of `git diff --staged` provided below.
The user's high-level intent for this commit is: "{{args}}"
Based on the user's intent and the actual code changes, generate a concise and accurate Conventional Commit message.
The message should follow the format: `<type>[optional scope]: <description>`.
Common types include: feat, fix, docs, style, refactor, test, chore.

Staged changes:
```diff
!{git diff --staged}
"""
```
用法：
```bash
/git:commit fix login button alignment on mobile
```

### 4.2 智能代码审查与重构：自动生成测试 `/code:add-tests`
```toml
# <project>/.gemini/commands/code/add-tests.toml
description = "Generates unit tests for a given file. Usage: /code:add-tests path/to/file.ts"

prompt = """
You are a test automation engineer specializing in writing robust and comprehensive unit tests.
Your task is to write unit tests for the code in the file provided below.
Use the Jest testing framework and TypeScript. For each exported function or method, create a `describe` block.
Inside each `describe` block, write `it` blocks covering:
1. The primary success case (the "happy path").
2. Common edge cases (e.g., empty inputs, null/undefined values, zero).
3. Expected error handling (e.g., invalid input).

File content for `{{args}}`:
```typescript
!{cat {{args}}}
```
Your output should be ONLY the test code itself, enclosed in a markdown code block.
"""
```
用法：
```bash
/code:add-tests src/utils/math.ts
```

### 4.3 文档与报告生成：发布说明 `/docs:release-notes`
```toml
# <project>/.gemini/commands/docs/release-notes.toml
description = "Drafts release notes based on git log between two tags. Usage: /docs:release-notes v1.0.0 v1.1.0"

prompt = """
You are a technical writer preparing release notes for a software project.
Based on the following git log, which uses Conventional Commits, create a summary of changes for the new release.
The output should be in markdown format.
Group the changes into sections like "🚀 Features", "🐛 Bug Fixes", and "🧹 Maintenance".
Ignore commits of type 'chore' or 'style'. The user wants release notes for the commit range: {{args}}

Git Log:
!{git log --pretty=format:"- %s" {{args}}}
"""
```
用法：
```bash
/docs:release-notes v1.0.0..v1.1.0
```

### 4.4 云原生与运维：日志分析 `/k8s:explain-log`
```toml
# ~/.gemini/commands/k8s/explain-log.toml
description = "Analyzes a Kubernetes log snippet and suggests a cause and solution."

prompt = """
You are an expert Kubernetes administrator and Site Reliability Engineer (SRE) with deep knowledge of containerized applications.
Analyze the following log snippet from a Kubernetes pod.

Your response must be structured into three sections:
1. **Potential Root Cause**
2. **Investigation Steps**
3. **Proposed Solution**

Log snippet to analyze:
{{args}}
"""
```
用法：
```bash
/k8s:explain-log "Error: connect ECONNREFUSED 127.0.0.1:6379 ..."
```

---

## 第五章：配置、管理与最佳实践

### 5.1 `.toml` 参数权威指南
- `.toml` 负责定义“任务本身（做什么）”；生成参数如 `model`、`temperature` 由 CLI 执行环境控制。
- 控制方式：
  - 启动标志：`gemini --model gemini-1.5-flash`
  - 会话内：`/model` 切换模型
  - 设置文件：`~/.gemini/settings.json` 或 `<project>/.gemini/settings.json`

### 5.2 共享与版本控制
- 项目级命令应纳入版本控制：保证一致性、可发现性与历史可追溯。
- Git 忽略建议：`.gitignore` 中忽略 `.gemini/`，但排除 `!.gemini/commands/`、`!.gemini/GEMINI.md`。
- 全局命令建议纳入个人 dotfiles 仓库以跨设备同步。

### 5.3 调试技巧与常见问题
- 新命令未加载：检查扩展名、目录位置，重启 CLI。
- `{{args}}` 异常：注意 shell 对空格/特殊字符的解释，必要时使用引号。
- `!{...}` 无输出：先在终端独立测试命令；检查 PATH/权限/工作目录。

---

## 结论：开启你的 CLI 自动化新篇章
通过对封装（`.toml`）、动态上下文注入（`!{...}`）与工作流组合（命令链式调用）的系统掌握，你可以将 Gemini CLI 从被动的对话工具升级为主动的、可编程的、深度集成于开发环境的智能代理。建议从文中范例出发，结合个人与团队工作流逐步扩展你的命令库，并将其纳入版本控制进行共享与沉淀。

