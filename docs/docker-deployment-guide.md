# AhaTutor v2.0 Docker 部署指南

本文档用于把 AhaTutor v2.0 部署到服务器，包含新前端、FastAPI 后端、环境变量、数据库数据目录和全部插件。

## 打包内容

- `frontend`：新前端，构建后由 Nginx 提供静态资源。
- `backend`：FastAPI 服务，容器内监听 `8000`。
- `plugins`：所有插件会在后端镜像构建阶段统一执行 workspace 构建，构建产物随 `/app/plugins` 一起托管到 `/plugins`。
- `data`：通过 Compose 挂载到 `/app/data`，用于持久化 `aha_tutor.db`。
- `.env`：由 Compose 注入后端。服务器上必须准备此文件。

## 服务器前置条件

1. 安装 Docker Engine 与 Docker Compose Plugin。
2. 开放对外端口，默认是 `80`。
3. 准备项目代码，可以用 `git clone`、压缩包上传，或 CI/CD 同步。

## 环境变量

在服务器项目根目录创建 `.env`。可以从样例复制：

```bash
cp .env.docker.example .env
```

至少需要填写：

```env
LLM_API_KEY=你的模型服务密钥
LLM_BASE_URL=https://yunwu.ai/v1
LLM_MODEL=gemini-3.1-flash-lite
ALLOWED_ORIGINS=http://你的服务器IP或域名
WEB_PORT=80
```

如果使用 HTTPS 域名，把 `ALLOWED_ORIGINS` 改为 `https://你的域名`。多个来源用英文逗号分隔。

## 本机验证构建

在项目根目录执行：

```bash
docker compose build
docker compose up -d
docker compose ps
```

访问：

- 前端：`http://localhost`
- 后端健康检查：`http://localhost/health`
- 插件静态文件：`http://localhost/plugins/<plugin-id>/dist/index.esm.js`

查看日志：

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

停止服务：

```bash
docker compose down
```

## 服务器部署步骤

1. 上传或拉取代码到服务器。

```bash
git clone <your-repo-url> AhaTutor-v2.0
cd AhaTutor-v2.0
```

2. 创建环境变量文件。

```bash
cp .env.docker.example .env
nano .env
```

3. 确保 `data` 目录存在。

```bash
mkdir -p data
```

4. 构建并启动。

```bash
docker compose up -d --build
```

5. 确认服务状态。

```bash
docker compose ps
curl http://127.0.0.1/health
```

6. 浏览器访问 `http://服务器IP` 或你的域名。

## 更新版本

```bash
git pull
docker compose up -d --build
docker compose ps
```

数据库在宿主机 `./data` 中，不会因为重建镜像丢失。

## 备份与恢复

备份数据库：

```bash
mkdir -p backups
cp data/aha_tutor.db backups/aha_tutor-$(date +%Y%m%d-%H%M%S).db
```

恢复数据库：

```bash
docker compose down
cp backups/你的备份.db data/aha_tutor.db
docker compose up -d
```

## 反向代理 HTTPS 可选配置

如果服务器已经有 Nginx/Caddy，可以让外层代理转发到本项目的 `WEB_PORT`。

例如把 Compose 端口改为只监听本机：

```env
WEB_PORT=127.0.0.1:8080
```

然后外层 Nginx 代理到：

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 常见问题

- 前端能打开但聊天失败：检查 `.env` 里的 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`，再看 `docker compose logs -f backend`。
- 浏览器 CORS 报错：把访问地址完整加入 `ALLOWED_ORIGINS`，例如 `https://aha.example.com`。
- 插件加载失败：重新执行 `docker compose build --no-cache backend frontend`，确认插件目录中存在 `dist/index.esm.js`。
- 端口被占用：修改 `.env` 中 `WEB_PORT`，例如 `WEB_PORT=8080`。
- 构建时 `npm ci` 报 `package.json and package-lock.json are in sync`，或 Tailwind 报缺少 `@tailwindcss/oxide-linux-x64-gnu`：当前 Dockerfile 会在 Linux 容器内忽略根 lockfile 重新解析 workspace 依赖，并显式包含 optional dependencies，避免 Windows lockfile 或未同步 lockfile 阻塞部署。后续如果要严格锁版本，可以在 Linux 环境更新根 `package-lock.json` 后，再把 Dockerfile 改回 `npm ci`。
- 拉取基础镜像失败，并且日志里出现某个镜像站 `EOF`：通常是 Docker registry mirror 暂时不可用。注意：只把 `.env` 写成 `node:22-bookworm-slim`、`python:3.12-slim`、`nginx:1.27-alpine` 不能绕过 daemon 里配置的 mirror，因为 Docker 仍会把 `docker.io/library/...` 请求转发到该 mirror。
  - 推荐做法：Docker Desktop -> Settings -> Docker Engine，删除或更换 `registry-mirrors` 里的故障地址，例如 `https://mirror.ccs.tencentyun.com`，Apply & Restart 后执行 `docker compose build --no-cache`。
  - 替代做法：在 `.env` 中把 `NODE_IMAGE`、`PYTHON_IMAGE`、`NGINX_IMAGE` 改成你当前网络可访问的完整镜像仓库地址，地址不能再是 `docker.io/library/...` 的默认短名。
