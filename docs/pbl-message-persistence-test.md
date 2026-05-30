# PBL 消息持久化功能测试指南

## 功能概述

已完成 PBL 消息持久化和消息-节点绑定功能的实现，包括：

1. ✅ 数据库迁移：messages 表添加 node_id 字段
2. ✅ 持久化函数支持 node_id 参数
3. ✅ PBL 聊天路由启用消息持久化
4. ✅ 新增按节点查询消息的 API 接口
5. ✅ 前端类型定义更新

---

## 数据库变更

### messages 表结构

```sql
CREATE TABLE messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'text',
    content         TEXT NOT NULL DEFAULT '',
    node_id         TEXT REFERENCES pbl_nodes(id) ON DELETE SET NULL,  -- 新增
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 新增索引

```sql
CREATE INDEX idx_messages_node_id ON messages(node_id);
CREATE INDEX idx_messages_conversation_node ON messages(conversation_id, node_id);
```

---

## API 接口变更

### 新增接口

#### 1. 按节点查询消息

```
GET /v1/conversations/{conversation_id}/messages/by-node/{node_id}
```

**查询参数：**
- `limit`: 返回数量限制（默认 50，最大 100）
- `offset`: 偏移量（默认 0）

**响应示例：**
```json
[
  {
    "id": "msg-uuid-1",
    "role": "user",
    "type": "text",
    "content": "什么是简谐运动？",
    "created_at": "2026-05-09T10:30:00"
  },
  {
    "id": "msg-uuid-2",
    "role": "assistant",
    "type": "text",
    "content": "简谐运动是一种周期性运动...",
    "created_at": "2026-05-09T10:30:05"
  }
]
```

#### 2. 获取节点消息统计

```
GET /v1/conversations/{conversation_id}/messages/stats
```

**响应示例：**
```json
{
  "node-uuid-1": 10,
  "node-uuid-2": 5,
  "node-uuid-3": 8
}
```

---

## 测试步骤

### 前置条件

1. 确保数据库已迁移（运行 `python backend/migrate_add_node_id.py`）
2. 启动后端服务：`cd backend && python -m uvicorn app.main:app --reload --port 8000`
3. 启动前端服务：`cd frontend && npm run dev`

### 测试场景 1：创建项目并开始学习

1. **创建新项目**
   ```bash
   curl -X POST http://localhost:8000/v1/pbl/goals \
     -H "Content-Type: application/json" \
     -d '{"raw_input": "我想学习简谐运动"}'
   ```
   记录返回的 `conversation_id` 和 `goal.id`

2. **生成学习树**
   ```bash
   curl -X POST http://localhost:8000/v1/pbl/goals/{goal_id}/tree
   ```
   记录返回的节点 ID

3. **进入学习模式，发送消息**
   - 前端：进入学习界面，发送消息"什么是简谐运动？"
   - 或使用 API：
   ```bash
   curl -X POST http://localhost:8000/v1/pbl/chat \
     -H "Content-Type: application/json" \
     -d '{
       "conversation_id": "{conversation_id}",
       "messages": [{"role": "user", "content": "什么是简谐运动？"}]
     }'
   ```

4. **验证数据库**
   ```bash
   sqlite3 data/aha_tutor.db "
     SELECT id, role, content, node_id, created_at 
     FROM messages 
     WHERE conversation_id = '{conversation_id}'
     ORDER BY created_at;
   "
   ```
   
   **预期结果：**
   - 应该看到用户消息和助手消息
   - `node_id` 字段应该等于当前学习的节点 ID

### 测试场景 2：切换节点

1. **切换到另一个节点**
   ```bash
   curl -X POST http://localhost:8000/v1/pbl/sessions/{conversation_id}/switch-node \
     -H "Content-Type: application/json" \
     -d '{"node_id": "{new_node_id}"}'
   ```

2. **发送新消息**
   - 前端：发送消息"这个节点的内容是什么？"

3. **验证数据库**
   ```bash
   sqlite3 data/aha_tutor.db "
     SELECT id, role, LEFT(content, 30) as content_preview, node_id 
     FROM messages 
     WHERE conversation_id = '{conversation_id}'
     ORDER BY created_at;
   "
   ```
   
   **预期结果：**
   - 新消息的 `node_id` 应该是新节点的 ID
   - 旧消息的 `node_id` 保持不变

### 测试场景 3：按节点查询消息

1. **查询特定节点的消息**
   ```bash
   curl http://localhost:8000/v1/conversations/{conversation_id}/messages/by-node/{node_id}
   ```
   
   **预期结果：**
   - 只返回该节点的消息
   - 按时间升序排列

2. **查询消息统计**
   ```bash
   curl http://localhost:8000/v1/conversations/{conversation_id}/messages/stats
   ```
   
   **预期结果：**
   - 返回每个节点的消息数量
   - 格式：`{"node_id": count}`

### 测试场景 4：通用聊天（无节点）

1. **使用通用聊天接口**
   ```bash
   curl -X POST http://localhost:8000/v1/chat \
     -H "Content-Type: application/json" \
     -d '{
       "conversation_id": "{conversation_id}",
       "messages": [{"role": "user", "content": "你好"}]
     }'
   ```

2. **验证数据库**
   ```bash
   sqlite3 data/aha_tutor.db "
     SELECT id, role, content, node_id 
     FROM messages 
     WHERE conversation_id = '{conversation_id}' AND node_id IS NULL;
   "
   ```
   
   **预期结果：**
   - 通用聊天的消息 `node_id` 应该是 NULL

---

## 性能验证

### 检查索引是否生效

```bash
sqlite3 data/aha_tutor.db "
  EXPLAIN QUERY PLAN 
  SELECT * FROM messages 
  WHERE conversation_id = 'test-id' AND node_id = 'node-id';
"
```

**预期结果：**
应该看到 `USING INDEX idx_messages_conversation_node`

---

## 常见问题

### Q1: 数据库迁移失败

**问题：** 运行迁移脚本时报错 "table messages has no column named node_id"

**解决方案：**
1. 检查数据库文件是否被占用（关闭后端服务）
2. 重新运行迁移脚本：`python backend/migrate_add_node_id.py`

### Q2: 消息没有持久化

**问题：** 发送消息后数据库中没有记录

**排查步骤：**
1. 检查后端日志是否有错误
2. 确认 `persist=True` 已设置
3. 检查 `conversation_id` 是否有效

### Q3: node_id 为 NULL

**问题：** PBL 聊天的消息 node_id 是 NULL

**排查步骤：**
1. 确认当前有活跃的学习节点（`current_node_id` 不为空）
2. 检查 `pbl_chat` 路由是否正确传递 `node_id`
3. 查看 `pbl_workflow_states` 表确认当前节点

---

## 回滚方案

如果需要回滚到旧版本：

```sql
-- 1. 删除索引
DROP INDEX IF EXISTS idx_messages_node_id;
DROP INDEX IF EXISTS idx_messages_conversation_node;

-- 2. 删除 node_id 字段（SQLite 不支持 DROP COLUMN，需要重建表）
-- 建议：保留字段，只是不使用
```

---

## 后续优化建议

1. **消息分页加载**：前端实现按节点分页加载历史消息
2. **消息搜索**：添加全文搜索功能
3. **消息导出**：支持导出特定节点的学习记录
4. **统计分析**：基于消息数据分析学习行为
5. **消息缓存**：对频繁查询的消息添加缓存层
