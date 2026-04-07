## Why

AhaTutor v2.0 当前没有任何后端服务，无法跑通「前端 → 后端 → LLM → SSE 流回前端」全链路。M1 后端任务是整个系统的基石，所有后续里程碑（A2UI 协议层、插件系统、RAG 检索）均依赖本阶段建立的 FastAPI 基座和 SSE 数据格式契约。

## What Changes

- **新增** `backend/app/` FastAPI 项目骨架，含配置管理、CORS 中间件、依赖注入结构
- **新增** `POST /api/v1/chat` 端点：接收消息列表，调用 LLM，以 SSE 流式返回响应
- **约定并冻结（M2 前）** SSE 数据格式：`{"type": "text", "content": "..."}` / `{"type": "done"}`
- **新增** `core/config.py`：统一管理 LLM API Key、模型名、端口、CORS 允许源
- **新增** CORS 配置：允许前端开发服务器（`localhost:5173`）跨域访问

## Capabilities

### New Capabilities
- `backend-foundation`: FastAPI 项目初始化、`core/config.py` 配置管理、CORS 中间件、项目目录结构（`backend/app/core/`、`backend/app/routers/`、`backend/app/services/`）
- `chat-sse-stream`: `POST /api/v1/chat` 端点实现，包括请求/响应模型、LLM 调用逻辑、SSE 流式返回、SSE 数据格式定义

### Modified Capabilities
<!-- 无现有 spec，本次全部为新建 -->

## Impact

- **新建目录**：`backend/app/`（FastAPI 项目根），包含 `core/`、`routers/`、`services/` 子目录，符合 CLAUDE.md 目录规范
- **对外 API**：`POST /api/v1/chat`，前端 M1 任务中的 `api/chat.ts` 直接依赖此端点和 SSE 格式
- **SSE 格式契约**：本阶段确定的 `type` 字段结构将在 M2 结束时正式冻结，影响后续 StreamSplitter、a2ui_builder 等模块
- **依赖**：Python 3.11+，`fastapi`、`uvicorn`、`sse-starlette`（或 Starlette 内置 StreamingResponse），以及 LLM SDK（如 `openai` 兼容客户端）
- **不涉及**：前端代码、A2UI 协议、RAG/向量库、插件系统
