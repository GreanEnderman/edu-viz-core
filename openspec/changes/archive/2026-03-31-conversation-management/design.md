## Context

当前系统是一个无状态的 LLM 代理：前端维护内存中的单一消息数组，后端仅转发请求到 LLM 并以 SSE 流式返回。没有数据库、没有会话概念、刷新即丢失。

现有前端骨架已包含 `LeftSidebar`（含「开启新思」按钮和「谈话室」/「回响」导航项），但均为静态占位。后端使用 FastAPI + Pydantic Settings，无 ORM。

## Goals / Non-Goals

**Goals:**
- 用户可以创建新对话、在对话间切换、删除对话
- 对话和消息持久化到 SQLite，刷新不丢失
- LeftSidebar 的静态 UI 连接到真实数据
- 后端 `POST /api/v1/chat` 支持可选的 `conversation_id`，自动持久化消息

**Non-Goals:**
- 用户认证/多用户隔离（后续迭代）
- 对话搜索/重命名/归档（后续迭代）
- 分页加载历史消息（首批加载全部即可）
- 对话导出

## Decisions

### D1: 数据库选型 — SQLite + aiosqlite

**选择**: 使用 SQLite，通过 `aiosqlite` 异步驱动，直接写 SQL（不引入 ORM）。

**理由**: 项目处于早期，数据模型简单（2 张表），ORM 引入的学习成本和维护负担不划算。SQLite 零配置、单文件部署，符合当前单机开发场景。

**备选**: SQLAlchemy — 功能强大但过重，对 2 张表来说没有必要。

### D2: 数据模型

```sql
CREATE TABLE conversations (
    id          TEXT PRIMARY KEY,       -- UUID
    title       TEXT NOT NULL DEFAULT '新对话',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE messages (
    id              TEXT PRIMARY KEY,   -- UUID
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,       -- 'user' | 'assistant'
    type            TEXT NOT NULL DEFAULT 'text',  -- 'text' | 'a2ui'
    content         TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**设计要点**:
- `conversations` 的 `title` 默认为「新对话」，后续可基于首条消息自动生成标题（本次不实现自动生成）
- `messages.type` 保留 'a2ui' 类型，以兼容 A2UI 消息存储（content 存 JSONL 字符串）
- `ON DELETE CASCADE` 确保删除对话时自动清理消息

### D3: 后端 API 设计

```
POST   /api/v1/conversations              → 创建新对话，返回 { id, title, created_at }
GET    /api/v1/conversations              → 返回对话列表（按 updated_at DESC）
GET    /api/v1/conversations/:id/messages → 返回该对话的全部消息
DELETE /api/v1/conversations/:id          → 删除对话及消息
```

现有 `POST /api/v1/chat` 改为接受可选字段：
```json
{
  "conversation_id": "uuid-xxx",  // 可选，提供时自动持久化消息
  "messages": [...]
}
```

**理由**: `conversation_id` 设为可选以保持向后兼容。不传时行为与现在一致（纯流式不存储）。

### D4: 前端状态管理 — 重构 chatStore

将 `chatStore` 从单一消息数组扩展为多对话模型：

```typescript
interface Conversation {
  id: string
  title: string
  messages: Message[]
}

interface ChatState {
  conversations: Conversation[]
  currentId: string | null      // 当前激活的对话 ID
  isLoading: boolean
  error: string | null

  // 对话管理
  createConversation: () => Promise<string>
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  loadConversations: () => Promise<void>

  // 消息操作（与现有保持一致的签名）
  sendMessage: (userContent: string) => string
  appendChunk: (id: string, chunk: string) => void
  finishMessage: (id: string) => void
  addA2UIMessage: () => void
  setError: (msg: string) => void
  clearError: () => void
}
```

**关键变化**: `messages` 不再是顶层字段，而是 `conversations[currentId].messages`。通过 getter 保持 `messages` 的便捷访问。

### D5: LeftSidebar 改造策略

不新建组件文件，直接修改现有 `LeftSidebar.tsx`：
- 「开启新思」按钮 → 调用 `chatStore.createConversation()`
- nav 区域的静态项替换为动态渲染的对话列表（从 `chatStore.conversations` 读取）
- 当前对话高亮（复用现有的 `bg-white rounded-lg` 样式）
- 长按/右键显示删除选项（或使用 hover 时出现删除图标）
- 保持现有展开/收起动画和样式

### D6: useChat 适配

`useChat.handleSend` 在发送时：
1. 若 `currentId` 为 null，先调用 `createConversation()` 获取新对话
2. 将 `conversation_id` 传入 `streamChat()` 的请求体
3. `streamChat()` 函数签名扩展为接受可选的 `conversationId`

## Risks / Trade-offs

- **[SQLite 并发]** → SQLite 写锁为库级，单用户场景无问题。若后续需多用户，可迁移到 PostgreSQL。当前阶段完全够用。
- **[对话标题为默认值]** → 用户无法区分对话，需手动实现自动标题生成。本次不做，但数据模型已预留 `title` 字段。
- **[chatStore 重构范围]** → 需要同时修改 store、hook、api 三层。保持方法签名兼容可降低组件层改动量。
- **[A2UI 消息持久化]** → A2UI 消息的 content 存 JSONL 字符串，加载时需解析还原。首次加载历史消息时，A2UI 组件需要重新初始化渲染。
