# PBL 消息持久化功能实现总结

## 问题分析

通过代码分析发现两个关键问题：

1. **消息丢失**：PBL 聊天的消息没有被持久化到数据库
   - `pbl_chat` 路由中 `persist=False`
   - TutorOrchestrator 的输出没有调用持久化函数

2. **缺少节点绑定**：无法追踪每条消息属于哪个学习节点
   - `messages` 表没有 `node_id` 字段
   - 无法按节点查询消息历史

## 实现方案

### 1. 数据库迁移
- ✅ 在 `messages` 表添加 `node_id` 字段（可为 NULL）
- ✅ 创建索引 `idx_messages_node_id` 和 `idx_messages_conversation_node`
- ✅ 编写迁移脚本 `backend/migrate_add_node_id.py`

### 2. 后端修改
- ✅ `persist_messages()` 函数支持 `node_id` 参数
- ✅ `llm_event_stream()` 函数支持 `node_id` 参数
- ✅ `pbl_chat` 路由启用持久化（`persist=True`）
- ✅ TutorOrchestrator 输出后调用 `persist_messages()`

### 3. 新增 API 接口
- ✅ `GET /v1/conversations/{conversation_id}/messages/by-node/{node_id}` - 按节点查询消息
- ✅ `GET /v1/conversations/{conversation_id}/messages/stats` - 获取节点消息统计

### 4. 前端更新
- ✅ `MessageResponse` 接口添加 `node_id?: string` 字段

## 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `backend/app/db.py` | messages 表添加 node_id 字段和索引 |
| `backend/app/services/streaming.py` | persist_messages 和 llm_event_stream 支持 node_id |
| `backend/app/routers/pbl.py` | 启用消息持久化并绑定节点 |
| `backend/app/routers/conversations.py` | 新增按节点查询消息的接口 |
| `frontend/src/types/chat.ts` | MessageResponse 添加 node_id 字段 |
| `backend/migrate_add_node_id.py` | 数据库迁移脚本（新建） |

## 数据流

```
用户发送消息
    ↓
前端: streamPblChat(conversationId, messages)
    ↓
后端: pbl_chat 路由接收请求
    ↓
TutorOrchestrator.teach_streaming() 生成响应
    ↓
tutor_stream() 收集完整响应
    ↓
persist_messages(conversation_id, user_message, full_response, node_id=current_node_id)
    ↓
数据库: INSERT INTO messages (..., node_id) VALUES (..., current_node_id)
    ↓
消息持久化完成，可按节点查询
```

## 验证结果

✅ 数据库结构已更新：
```
messages 表字段：
  - id (TEXT PRIMARY KEY)
  - conversation_id (TEXT)
  - role (TEXT)
  - type (TEXT)
  - content (TEXT)
  - node_id (TEXT) ← 新增
  - created_at (TEXT)

索引：
  - idx_messages_node_id
  - idx_messages_conversation_node
```

## 使用示例

### 按节点查询消息
```bash
curl http://localhost:8000/v1/conversations/{conversation_id}/messages/by-node/{node_id}
```

### 查询消息统计
```bash
curl http://localhost:8000/v1/conversations/{conversation_id}/messages/stats
```

### 数据库查询
```sql
-- 查看某个对话的所有消息及其所属节点
SELECT id, role, content, node_id, created_at 
FROM messages 
WHERE conversation_id = 'xxx'
ORDER BY created_at;

-- 查看某个节点的所有消息
SELECT id, role, content, created_at 
FROM messages 
WHERE conversation_id = 'xxx' AND node_id = 'yyy'
ORDER BY created_at;
```

## 后续建议

1. **前端集成**：在学习界面添加"查看历史对话"功能，按节点展示
2. **消息搜索**：实现全文搜索功能
3. **学习分析**：基于消息数据分析学习行为和进度
4. **消息导出**：支持导出学习记录为 Markdown 或 PDF

## 测试指南

详细测试步骤请参考：[docs/pbl-message-persistence-test.md](./pbl-message-persistence-test.md)
