# 前端迁移日志

## 阶段 0：准备和存档（2026-05-07）

### 完成的工作

1. **Git 分支和标签**
   - 创建迁移分支：`refactor/v2-prototype-migration`
   - 创建存档标签：`archive/pre-v4-migration`

2. **目录重组**
   - 将 `frontend` 移动到 `frontend-v1`（旧版本）
   - 创建新的 `frontend` 目录（新版本）

3. **核心模块复制**
   - 复制以下核心模块到新前端：
     - `store/` - 状态管理
     - `services/` - API 层
     - `a2ui-engine/` - A2UI 引擎
     - `hooks/` - 核心 Hooks
     - `types/` - 类型定义
     - `utils/` - 工具函数
     - `plugin-runtime/` - 插件运行时
     - `constants/` - 常量
     - `assets/` - 资源文件

4. **配置文件更新**
   - 复制配置文件：`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
   - 修改新前端端口：5173 → 5174
   - 更新根目录 `package.json`，添加 `dev:v1` 和 `dev:v2` 脚本

### 目录结构

```
/AhaTutor-v2.0/
├── frontend-v1/          # 旧版本（完整保留，端口 5173）
│   └── src/
├── frontend/             # 新版本（基于原型页重构，端口 5174）
│   └── src/
│       ├── store/        # 从 v1 复制
│       ├── services/     # 从 v1 复制
│       ├── a2ui-engine/  # 从 v1 复制
│       ├── hooks/        # 从 v1 复制
│       ├── types/        # 从 v1 复制
│       ├── utils/        # 从 v1 复制
│       ├── plugin-runtime/ # 从 v1 复制
│       ├── constants/    # 从 v1 复制
│       └── assets/       # 从 v1 复制
└── backend/              # 后端不变
```

### 运行方式

- **旧版本**：`npm run dev:v1` → http://localhost:5173
- **新版本**：`npm run dev:v2` → http://localhost:5174

### 下一步

阶段 1：实现欢迎屏（WelcomeScreen 组件）

---

## 阶段 1：欢迎屏重构（待开始）

待完成...

---

## 阶段 2：输入框增强（待开始）

待完成...

---

## 阶段 3：顶部导航栏重构（待开始）

待完成...

---

## 阶段 4：左侧边栏增强（待开始）

待完成...

---

## 阶段 5：右侧边栏增强（待开始）

待完成...

---

## 阶段 6：全局样式优化（待开始）

待完成...
