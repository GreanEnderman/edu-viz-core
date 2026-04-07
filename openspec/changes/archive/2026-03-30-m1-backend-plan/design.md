## Context

AhaTutor v2.0 后端从零开始搭建，没有任何现有服务。前端（Next.js / `frontend/src/`）需要通过 `POST /api/v1/chat` 端点与后端通信，并以 SSE 流式接收 LLM 响应。本阶段（M1）目标是跑通最小闭环，不包含 RAG、插件或 A2UI 协议层。

约束：
- 目录必须遵循 `backend/app/` 规范（CLAUDE.md）
- SSE 数据格式在本阶段约定，M2 结束时冻结，后续所有模块依赖此契约
- 尽量减少依赖，避免 M2+ 重构时阻力

## Goals / Non-Goals

**Goals:**
- 建立 `backend/app/` FastAPI 项目骨架，含配置管理、CORS、依赖注入结构
- 实现 `POST /api/v1/chat`：接收消息列表 → 调用 LLM → SSE 流式返回
- 约定并文档化 SSE 数据格式（`type` 字段契约）
- 本地 `uvicorn` 可一键启动

**Non-Goals:**
- RAG / 向量检索
- A2UI JSONL 消息构建（M2）
- 插件系统（M3+）
- 认证 / 用户系统
- 数据库 / 持久化
- 生产部署配置

## Decisions

### D1：目录结构对齐 architecture.md

```
backend/app/
├── main.py              # FastAPI app 入口
├── core/
│   └── config.py        # 配置（pydantic-settings）
├── routers/
│   └── chat.py          # /api/v1/chat 路由
└── services/
    └── llm.py           # LLM 调用封装
```

选择 `routers/` + `services/` 分层而非平铺，原因：architecture.md 已明确此结构，M2 新增 `services/ai/` 子模块时无需重组。

### D2：SSE 实现方式 — Starlette `StreamingResponse` + 手动 NDJSON

备选方案：
- `sse-starlette` 库：提供 `EventSourceResponse`，API 更友好
- 手动 `StreamingResponse`：零额外依赖，格式完全可控

**选择手动 StreamingResponse**：M1 的 SSE 格式极简（每行一个 JSON），引入 `sse-starlette` 收益不足以抵消额外依赖。M2 如有复杂需求可切换，改动仅在 `routers/chat.py`。

### D3：SSE 数据格式契约

```
data: {"type": "text", "content": "<chunk>"}\n\n
data: {"type": "done"}\n\n
```

`type` 字段是前端 StreamSplitter 的分流依据（architecture.md §SSE 内容区分）。M2 新增 `a2ui` 类型时只需扩展此枚举，不破坏现有 `text` / `done` 处理逻辑。

### D4：配置管理 — pydantic-settings

所有配置通过环境变量注入，`core/config.py` 用 `pydantic-settings` 的 `BaseSettings` 统一读取。开发时使用 `.env` 文件（不提交），生产通过容器环境变量覆盖。

### D5：LLM 客户端 — openai-compatible SDK

使用 `openai` Python SDK（`AsyncOpenAI`），配置 `base_url` 和 `api_key` 支持任意兼容端点（OpenAI / DeepSeek / 本地 Ollama）。切换模型只需修改 `.env`，无需改代码。

## Risks / Trade-offs

- **SSE 格式契约早期冻结风险** → 缓解：M2 结束前保持 `type` 枚举可扩展，前端 StreamSplitter 对未知 `type` 做 fallthrough 处理，不抛错
- **无认证的 `/api/v1/chat` 端点** → 缓解：M1 仅本地开发，CORS 限制为 `localhost:5173`；认证在用户系统里程碑中补充
- **LLM API Key 泄露风险** → 缓解：`.env` 加入 `.gitignore`，`config.py` 不硬编码默认值

## Migration Plan

1. 在 `backend/app/` 下初始化 Python 虚拟环境，安装依赖
2. 创建 `backend/app/.env`（参考 `.env.example`）
3. `uvicorn backend.app.main:app --reload --port 8000`
4. 前端 `frontend/src/` 的 `api/chat.ts` 指向 `http://localhost:8000/api/v1/chat`

回滚：M1 无数据库变更，直接删除 `backend/app/` 目录即可完全回滚。

## Open Questions

- LLM 默认模型：DeepSeek-chat 还是 GPT-4o-mini？（影响 `.env.example` 填写，不影响代码）
- `backend/app/` 是否需要独立 `pyproject.toml`，还是 monorepo 根级统一管理？
