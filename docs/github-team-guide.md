# GitHub 团队协作指南

> 本指南面向零基础成员，从注册账号到日常协作，一步步带你上手。

---

## 目录

1. [前置准备](#1-前置准备)
2. [Git 基础概念](#2-git-基础概念)
3. [安装与配置](#3-安装与配置)
4. [首次克隆项目](#4-首次克隆项目)
5. [日常工作流程](#5-日常工作流程)
6. [分支管理](#6-分支管理)
7. [Pull Request 工作流](#7-pull-request-工作流)
8. [代码冲突解决](#8-代码冲突解决)
9. [常见问题与排错](#9-常见问题与排错)
10. [团队约定](#10-团队约定)

---

## 1. 前置准备

### 1.1 注册 GitHub 账号

1. 打开 [github.com](https://github.com)，点击 **Sign up**
2. 用邮箱注册（建议用学校/公司邮箱）
3. 完成邮箱验证

### 1.2 加入团队仓库

管理员会通过邮箱邀请你加入仓库，查收邮件并点击 **Accept invitation**。

如果没有收到邀请，可以手动操作：
1. 打开仓库地址（管理员提供）
2. 点击右上角 **Fork**，将仓库复制到自己的账号下

---

## 2. Git 基础概念

### 2.1 什么是 Git？

Git 是一个**版本控制系统**，就像游戏里的「存档」功能：
- 每次改动后可以「存档」（commit）
- 可以随时「读档」回到之前的状态
- 多人可以各自存档，不会互相覆盖

### 2.2 什么是 GitHub？

GitHub 是一个**在线平台**，把你的本地存档同步到云端，这样团队成员就能看到彼此的改动。

### 2.3 四个核心概念

```
工作区（你的电脑）  →  暂存区（选好要存的文件）  →  本地仓库（本地存档）  →  远程仓库（云端存档）
   Working Dir         Staging Area              Local Repo             Remote (GitHub)
```

| 概念 | 类比 | 命令 |
|------|------|------|
| **工作区** | 你正在写的草稿纸 | 你直接编辑的文件 |
| **暂存区** | 你挑出来准备上交的作业 | `git add` |
| **本地仓库** | 你的笔记本 | `git commit` |
| **远程仓库** | 老师的收件箱 | `git push` / `git pull` |

---

## 3. 安装与配置

### 3.1 安装 Git

**Windows：**
1. 下载：[git-scm.com/download/win](https://git-scm.com/download/win)
2. 双击安装，一路 **Next** 即可（默认选项就行）

**macOS：**
```bash
brew install git
```

**验证安装成功：**
```bash
git --version
# 应该输出类似：git version 2.43.0
```

### 3.2 配置身份（只需做一次）

打开终端（Windows 用 Git Bash，macOS 用 Terminal），执行：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

> 这个信息会出现在每次提交记录中，让别人知道是谁改的。

### 3.3 连接 GitHub（免密码推送）

推荐使用 **GitHub CLI**，最简单：

```bash
# 安装 GitHub CLI
# Windows: winget install GitHub.cli
# macOS: brew install gh

# 登录
gh auth login
```

按提示选择：
1. **GitHub.com**
2. **HTTPS**
3. **Login with a web browser**（浏览器登录，最方便）

登录成功后，`git push` 就不会再要求输入密码了。

---

## 4. 首次克隆项目

**克隆 = 把云端仓库完整下载到本地**

```bash
# 进入你想存放项目的目录
cd ~/projects

# 克隆仓库（把 <仓库地址> 换成实际的地址）
git clone https://github.com/组织名/仓库名.git

# 进入项目目录
cd 仓库名
```

克隆完成后，你的本地就有一份完整的代码，并且自动关联了远程仓库。

---

## 5. 日常工作流程

这是你**每天最常用的操作**，记住这个循环：

```
拉取最新代码 → 改代码 → 暂存 → 提交 → 推送
```

### 5.1 拉取最新代码（每天开始工作时第一件事）

```bash
git pull
```

> 这会把队友昨天推上去的代码同步到你的电脑。**每次开始工作前都必须先 pull！**

### 5.2 改代码

用你的编辑器（VS Code 等）正常编辑文件。

### 5.3 查看改动

```bash
# 查看哪些文件改了、改了什么
git status
git diff
```

### 5.4 暂存改动

```bash
# 暂存所有改动
git add .

# 或者只暂存指定文件
git add src/某个文件.ts
```

> `git add .` 中的 `.` 表示「当前目录下所有改动」。

### 5.5 提交

```bash
git commit -m "描述你改了什么"
```

提交信息要写清楚，方便队友理解。参考 [提交信息规范](#101-提交信息规范)。

### 5.6 推送到远程

```bash
git push
```

### 5.7 完整示例

```bash
# 早上开始工作
git pull

# 改了一个文件...
git status                    # 确认改了哪些文件
git add src/components/Login.tsx
git commit -m "feat: 添加登录页面基础布局"
git push                     # 推送到远程
```

---

## 6. 分支管理

### 6.1 什么是分支？

分支就是一条**独立的开发线**。每个人在自己的分支上改代码，互不干扰，改好了再合并到主分支。

```
main ────────●──────────────────●──── （主线，稳定版本）
              \                /
feature-xxx ───●──●──●──●──●── （你在自己的分支上开发）
```

### 6.2 什么时候需要建分支？

| 情况 | 操作 |
|------|------|
| 修一个小 typo | 可以直接在 main 上改 |
| 开发新功能 | 建新分支 |
| 修复 bug | 建新分支 |
| 实验性尝试 | 建新分支 |

**原则：** 只要改动超过 3 个文件或需要超过 30 分钟，就建一个新分支。

### 6.3 分支操作

```bash
# 查看所有分支（* 标记当前所在分支）
git branch

# 创建并切换到新分支
git checkout -b feature/login-page

# 切换回 main
git checkout main

# 切换到已有分支
git checkout feature/login-page

# 删除已合并的分支
git branch -d feature/login-page
```

> 新版 Git 也可以用 `git switch` 代替 `git checkout` 切换分支，效果一样。

### 6.4 给分支起名

用 `-` 连接单词，格式为 `类型/简短描述`：

```
feature/login-page       新功能：登录页面
fix/header-alignment     修复：头部对齐问题
refactor/chat-logic      重构：聊天逻辑
docs/api-guide           文档：API 指南
```

---

## 7. Pull Request 工作流

> 以下流程适用于团队协作，确保代码经过审查后再合并。

### 7.1 完整流程图

```
① git checkout -b feature/xxx    从 main 创建新分支
② 写代码 + commit + push         在分支上开发并推送
③ GitHub 上创建 PR                发起合并请求
④ 队友审查代码                    Code Review
⑤ 讨论修改（如需要）              根据反馈修改
⑥ Merge PR                       合并到 main
⑦ 删除分支                       清理
```

### 7.2 详细步骤

**第一步：创建分支并开发**

```bash
git checkout main
git pull                              # 确保基于最新代码
git checkout -b feature/login-page    # 创建新分支

# ... 改代码 ...

git add .
git commit -m "feat: 添加登录页面"
git push -u origin feature/login-page # 推送分支到远程
```

**第二步：在 GitHub 上创建 PR**

1. 打开仓库页面
2. 点击 **"Pull requests"** 标签
3. 点击 **"New pull request"**
4. 点击 **"compare: main"** 切换为你的分支 `feature/login-page`
5. 确认 base 是 `main`，compare 是你的分支
6. 点击 **"Create pull request"**
7. 填写标题和描述

**第三步：等待审查**

PR 创建后，队友会在 GitHub 上查看你的改动并留言。根据反馈修改代码：

```bash
# 在你的分支上继续修改
git add .
git commit -m "fix: 根据审查意见修改按钮样式"
git push                              # 推送后 PR 会自动更新
```

**第四步：合并 PR**

审查通过后（由审查者或你自己）点击 **"Merge pull request"** → **"Confirm merge"**。

**第五步：清理**

```bash
git checkout main
git pull                              # 拉取包含合并结果的最新代码
git branch -d feature/login-page      # 删除本地分支
```

### 7.3 PR 描述模板

创建 PR 时，按以下格式填写：

```markdown
## 做了什么
简要描述改动内容

## 为什么改
说明动机或关联的需求/Issue

## 改动范围
- 文件 A：修改了 xxx
- 文件 B：新增了 xxx

## 测试方式
- [ ] 在本地运行 xxx 验证
- [ ] 检查了 xxx 场景
```

---

## 8. 代码冲突解决

### 8.1 什么是冲突？

当两个人**改了同一个文件的同一位置**，Git 不知道该保留谁的，就会产生冲突。

```
<<<<<<< HEAD
你写的代码
=======
队友写的代码
>>>>>>> feature/xxx
```

### 8.2 如何解决冲突？

```bash
git pull
# 如果有冲突，Git 会提示哪些文件冲突了
```

**第一步：打开冲突文件**

用编辑器打开标记了冲突的文件，找到冲突标记：

```
<<<<<<< HEAD
const title = "登录"
=======
const title = "用户登录"
>>>>>>> feature/login-page
```

**第二步：手动选择保留哪个（或合并）**

删除冲突标记，只保留你想要的内容：

```typescript
// 比如保留队友的版本
const title = "用户登录"
```

**第三步：标记冲突已解决并提交**

```bash
git add <冲突文件>
git commit -m "resolve: 解决登录页面标题冲突"
git push
```

### 8.3 VS Code 中解决冲突

推荐使用 VS Code，它会高亮显示冲突并提供快捷按钮：

1. 冲突文件上方会出现 **"Accept Current Change"** / **"Accept Incoming Change"** / **"Accept Both Changes"** 按钮
2. 点击选择即可
3. 保存后 `git add` + `git commit`

### 8.4 如何避免冲突？

- **每天开始工作前先 `git pull`**
- 尽早、频繁地推送（不要攒一大堆改动最后一起推）
- 改动同一模块时提前和队友沟通
- 及时 review 和合并 PR，不要让分支存在太久

---

## 9. 常见问题与排错

### 9.1 push 被拒绝：`rejected`

```
! [rejected] main -> main (fetch first)
error: failed to push some refs
```

**原因：** 远程有新的提交，你本地落后了。

**解决：**
```bash
git pull        # 先拉取远程更新
git push        # 再推送
```

### 9.2 `src refspec main does not match any`

**原因：** 还没有做过 commit，或者分支名不对。

**解决：**
```bash
git add .
git commit -m "init: 初始化项目"
git branch -M main      # 确保分支名是 main
git push -u origin main
```

### 9.3 误删了文件想恢复

```bash
# 恢复单个文件（回到上次 commit 的状态）
git checkout -- 文件路径

# 撤销上次 commit（保留改动）
git reset --soft HEAD~1

# 撤销上次 commit（丢弃改动，危险！）
git reset --hard HEAD~1
```

### 9.4 想查看历史提交记录

```bash
# 简洁版
git log --oneline

# 图形化查看分支历史
git log --oneline --graph --all
```

### 9.5 commit 写错了想修改

```bash
# 修改最近一次 commit 的提交信息
git commit --amend -m "新的提交信息"

# 漏了文件，补充到上一次 commit
git add 忘记的文件
git commit --amend --no-edit
```

> **注意：** 如果已经 push 了，不要 amend，否则会造成历史混乱。

### 9.6 LF will be replaced by CRLF

这是一个**提示**，不是错误。Windows 和 Linux/Mac 的换行符不同，Git 会自动处理。可以忽略。

如果想消除这个提示，在项目根目录创建 `.gitattributes` 文件，写入：
```
* text=auto eol=lf
```

### 9.7 忘记切换分支，在 main 上改了代码

```bash
# 暂存当前改动
git stash

# 切换到正确的分支
git checkout feature/xxx

# 恢复刚才的改动
git stash pop
```

---

## 10. 团队约定

### 10.1 提交信息规范

格式：`类型: 简短描述`

| 类型 | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加登录页面` |
| `fix` | 修复 bug | `fix: 修复按钮点击无响应` |
| `docs` | 文档改动 | `docs: 更新 README` |
| `refactor` | 重构（不改变功能） | `refactor: 拆分聊天组件` |
| `style` | 样式调整 | `style: 调整卡片圆角` |
| `chore` | 杂项（配置、依赖等） | `chore: 升级 React 到 v19` |

**规则：**
- 用中文写描述
- 描述要具体，不要写 "update" 或 "fix bug" 这种模糊信息
- 一次 commit 只做一件事

### 10.2 分支规则

- `main` 分支始终保持**可运行**状态
- 不要直接在 `main` 上开发新功能
- 功能开发完、测试通过后再合并到 `main`
- PR 合并后及时删除分支

### 10.3 协作守则

1. **每天开始前先 `git pull`**
2. **改代码前先确认队友是否在改同一文件**
3. **改动超过 30 分钟就建分支**
4. **频繁提交，小步快跑**（不要攒一大堆改动最后一次性提交）
5. **推送前先 `git pull`**（避免 push 被拒绝）
6. **写清楚 commit 信息**（队友需要看懂你改了什么）
7. **遇到问题先问，不要硬搞**（搞坏了更难修）

### 10.4 每日工作检查清单

```
□ git pull（拉取最新代码）
□ git checkout -b feature/xxx（创建分支）
□ ... 写代码 ...
□ git status（确认改了哪些文件）
□ git add .（暂存）
□ git commit -m "..."（提交，写清楚描述）
□ git pull（推送前再拉一次）
□ git push（推送）
□ GitHub 上创建 PR（如需要）
```

---

## 快速参考卡

```
git clone <地址>              克隆仓库
git pull                      拉取最新代码
git status                    查看当前状态
git add .                     暂存所有改动
git add <文件>                暂存指定文件
git commit -m "信息"          提交
git push                      推送到远程
git branch                    查看分支
git checkout -b <名称>        创建并切换分支
git checkout <名称>           切换分支
git checkout main             回到主分支
git branch -d <名称>          删除分支
git log --oneline             查看提交历史
git stash                     暂存当前改动
git stash pop                 恢复暂存的改动
git diff                      查看具体改动内容
```

有问题随时问队友，不要一个人卡住！
