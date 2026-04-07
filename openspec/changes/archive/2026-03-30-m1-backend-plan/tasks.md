## 1. 项目初始化

- [x] 1.1 在 `backend/app/` 下创建虚拟环境：`python -m venv .venv`，并将 `.venv/` 加入 `.gitignore`
- [x] 1.2 激活虚拟环境（Windows: `.venv\Scripts\activate`，Unix: `source .venv/bin/activate`），创建 `requirements.txt` 并安装依赖：`fastapi`、`uvicorn[standard]`、`pydantic-settings`、`openai`
- [x] 1.3 创建 `backend/app/.env.example`，列出所有必填配置项（`LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`），加入 `.gitignore` 规则确保 `.env` 不提交
- [x] 1.4 创建 `backend/app/__init__.py` 使其成为 Python 包

## 2. 配置管理

- [x] 2.1 创建 `backend/app/core/__init__.py`
- [x] 2.2 创建 `backend/app/core/config.py`，用 `pydantic-settings` `BaseSettings` 定义所有配置项（`LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`、`ALLOWED_ORIGINS`、`PORT`），缺少必填项时启动报错
- [x] 2.3 验证：`python -c "from apps.api.core.config import settings; print(settings)"` 无 ImportError

## 3. 应用骨架与 CORS

- [x] 3.1 创建 `backend/app/main.py`：初始化 `FastAPI` app，添加 `CORSMiddleware`（从 `settings.ALLOWED_ORIGINS` 读取白名单）
- [x] 3.2 在 `main.py` 注册 `GET /health` 路由，返回 `{"status": "ok"}`
- [x] 3.3 验证：`uvicorn backend.app.main:app --port 8000` 启动后 `curl http://localhost:8000/health` 返回 200
- [x] 3.4 验证 CORS：从 `localhost:5173` 发起预检请求（OPTIONS），响应包含正确 `Access-Control-Allow-Origin` 头

## 4. LLM 服务封装

- [x] 4.1 创建 `backend/app/services/__init__.py`
- [x] 4.2 创建 `backend/app/services/llm.py`：封装 `AsyncOpenAI` 客户端（从 `settings` 读取 `base_url` / `api_key` / `model`），提供 `async def stream_chat(messages: list[dict]) -> AsyncIterator[str]` 方法，逐 chunk yield 文本内容
- [x] 4.3 验证：单独调用 `stream_chat` 可正常流式输出 LLM 响应

## 5. Chat SSE 端点

- [x] 5.1 创建 `backend/app/routers/__init__.py`
- [x] 5.2 创建 `backend/app/routers/chat.py`：定义请求模型 `ChatRequest`（`messages: list[Message]`，非空校验），`Message`（`role`, `content`）
- [x] 5.3 实现 `POST /api/v1/chat` 路由：调用 `llm.stream_chat`，将每个 chunk 包装为 `data: {"type": "text", "content": "..."}\n\n`，流结束后发送 `data: {"type": "done"}\n\n`，异常时发送 `data: {"type": "error", "message": "..."}\n\n`
- [x] 5.4 在 `main.py` 中注册 chat router（prefix `/api/v1`）
- [x] 5.5 验证：`curl -N -X POST http://localhost:8000/api/v1/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"你好"}]}'` 可见流式 SSE 输出
- [x] 5.6 验证：发送 `{"messages": []}` 返回 HTTP 422
