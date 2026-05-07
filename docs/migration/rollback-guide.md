# 回滚指南

## 概述

本文档描述如何在迁移过程中的任何阶段回滚到之前的稳定状态。

## 完全回滚到迁移前

如果需要完全放弃迁移，恢复到迁移前的状态：

```bash
# 1. 切换到存档标签
git checkout archive/pre-v4-migration

# 2. 创建恢复分支
git checkout -b recovery/rollback-$(date +%Y%m%d)

# 3. 删除迁移分支（可选）
git branch -D refactor/v2-prototype-migration
```

## 阶段性回滚

### 阶段 0 回滚

如果阶段 0 出现问题，需要恢复原始目录结构：

```bash
# 删除新前端
rm -rf frontend

# 恢复旧前端
mv frontend-v1 frontend

# 恢复 package.json
git checkout HEAD~1 -- package.json

# 切换到存档标签
git checkout archive/pre-v4-migration
```

### 阶段 1 回滚（欢迎屏）

```bash
# 恢复 App.tsx
git checkout HEAD~1 -- frontend/src/App.tsx

# 删除新建文件
rm -rf frontend/src/components/Welcome
rm frontend/src/constants/welcomeProjects.ts
```

### 阶段 2 回滚（输入框）

```bash
# 恢复 ChatInput.tsx
git checkout HEAD~1 -- frontend/src/components/Chat/ChatInput.tsx

# 删除新建文件
rm frontend/src/components/Chat/InputModeSelector.tsx
rm frontend/src/constants/inputModes.ts
```

### 阶段 3 回滚（顶部导航栏）

```bash
# 恢复 TopNav.tsx
git checkout HEAD~1 -- frontend/src/components/Layout/TopNav.tsx

# 删除新建文件
rm frontend/src/components/Layout/UserAvatar.tsx
```

### 阶段 4 回滚（左侧边栏）

```bash
# 恢复 LeftSidebar.tsx
git checkout HEAD~1 -- frontend/src/components/Layout/LeftSidebar.tsx

# 删除新建文件
rm frontend/src/components/Layout/ProjectCard.tsx
rm frontend/src/components/Layout/KnowledgeTree.tsx
```

### 阶段 5 回滚（右侧边栏）

```bash
# 恢复 RightSidebar.tsx
git checkout HEAD~1 -- frontend/src/components/Layout/RightSidebar.tsx
```

### 阶段 6 回滚（全局样式）

```bash
# 恢复样式文件
git checkout HEAD~1 -- frontend/src/index.css
git checkout HEAD~1 -- frontend/src/App.tsx
```

## 切换回旧版本

如果新版本出现问题，可以临时切换回旧版本：

```bash
# 停止新版本（如果正在运行）
# Ctrl+C

# 启动旧版本
npm run dev:v1
```

旧版本将在 http://localhost:5173 运行，功能完全正常。

## 验证回滚成功

回滚后，验证以下功能：

- [ ] 前端可以正常启动
- [ ] 对话功能正常
- [ ] A2UI 组件渲染正常
- [ ] 插件系统正常
- [ ] Gallery 模式正常

## 注意事项

1. **数据库**：后端数据库不受前端迁移影响，无需回滚
2. **插件**：插件系统在两个版本中共享，无需特殊处理
3. **Git 历史**：回滚不会删除 Git 历史，可以随时恢复
4. **并行运行**：两个版本可以同时运行（不同端口），方便对比测试

## 紧急联系

如果遇到无法解决的问题：

1. 保存当前工作状态：`git stash`
2. 切换到存档标签：`git checkout archive/pre-v4-migration`
3. 记录问题详情，寻求帮助
