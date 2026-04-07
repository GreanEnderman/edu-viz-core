## ADDED Requirements

### Requirement: FastAPI 项目骨架
The system SHALL provide a FastAPI application entry point at `backend/app/main.py` that creates an `app` instance, registers CORS middleware, and includes all API routers.

#### Scenario: 应用启动
- **WHEN** 执行 `uvicorn backend.app.main:app --reload --port 8000`
- **THEN** 服务在端口 8000 启动，访问 `GET /health` 返回 HTTP 200

#### Scenario: CORS 允许前端开发服务器
- **WHEN** 浏览器从 `http://localhost:5173` 发起跨域请求
- **THEN** 响应包含 `Access-Control-Allow-Origin: http://localhost:5173` 头

#### Scenario: CORS 拒绝未知来源
- **WHEN** 浏览器从非白名单 origin（如 `http://evil.com`）发起跨域请求
- **THEN** 响应不包含 `Access-Control-Allow-Origin` 头

---

### Requirement: 统一配置管理
The system SHALL centralize all runtime configuration in `backend/app/core/config.py` using `pydantic-settings` `BaseSettings`, reading values from environment variables and `.env` file.

配置项 SHALL 包含：
- `LLM_API_KEY`：LLM 服务密钥（必填，无默认值）
- `LLM_BASE_URL`：LLM 端点 URL（必填）
- `LLM_MODEL`：模型名称（必填）
- `ALLOWED_ORIGINS`：CORS 白名单，逗号分隔字符串（默认 `http://localhost:5173`）
- `PORT`：服务监听端口（默认 `8000`）

#### Scenario: 从环境变量读取配置
- **WHEN** 环境变量 `LLM_API_KEY=sk-xxx` 已设置
- **THEN** `settings.LLM_API_KEY` 值为 `"sk-xxx"`

#### Scenario: 缺少必填配置时启动失败
- **WHEN** `LLM_API_KEY` 未设置且 `.env` 文件中也不存在
- **THEN** 应用启动时抛出 `ValidationError`，并提示缺少字段名

#### Scenario: .env 文件覆盖默认值
- **WHEN** `.env` 文件中设置 `PORT=9000`
- **THEN** `settings.PORT` 值为 `9000`

---

### Requirement: 目录结构规范
The system SHALL organize backend code strictly under `backend/app/` with the following structure：`core/`（配置/依赖）、`routers/`（路由）、`services/`（业务逻辑）。

#### Scenario: 模块可正常导入
- **WHEN** 在项目根执行 `python -c "from backend.app.core.config import settings"`
- **THEN** 命令成功退出，无 ImportError
