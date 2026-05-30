#!/bin/bash
# 构建开箱即用的部署包

set -e

echo "=== AhaTutor v2.0 部署包构建脚本 ==="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

# 创建临时构建目录
BUILD_DIR="build-release"
RELEASE_DIR="aha-tutor-release"
rm -rf "$BUILD_DIR" "$RELEASE_DIR"
mkdir -p "$BUILD_DIR/$RELEASE_DIR"

echo "1. 构建 Docker 镜像..."
docker compose build --no-cache

echo ""
echo "2. 导出 Docker 镜像..."
docker save -o "$BUILD_DIR/$RELEASE_DIR/backend-image.tar" $(docker compose config | grep 'image:' | head -1 | awk '{print $2}' || echo "aha-tutor-v2.0-backend")
docker save -o "$BUILD_DIR/$RELEASE_DIR/frontend-image.tar" $(docker compose config | grep 'image:' | tail -1 | awk '{print $2}' || echo "aha-tutor-v2.0-frontend")

# 如果上面的命令失败，使用项目名称作为默认值
if [ ! -f "$BUILD_DIR/$RELEASE_DIR/backend-image.tar" ]; then
    docker save -o "$BUILD_DIR/$RELEASE_DIR/backend-image.tar" ahatutor-v20-backend
fi
if [ ! -f "$BUILD_DIR/$RELEASE_DIR/frontend-image.tar" ]; then
    docker save -o "$BUILD_DIR/$RELEASE_DIR/frontend-image.tar" ahatutor-v20-frontend
fi

echo ""
echo "3. 复制配置文件..."
cat > "$BUILD_DIR/$RELEASE_DIR/docker-compose.yml" << 'COMPOSE_EOF'
services:
  backend:
    image: ahatutor-v20-backend
    env_file:
      - .env
    environment:
      PORT: 8000
      DATABASE_PATH: /app/data/aha_tutor.db
      PLUGINS_DIR: /app/plugins
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  frontend:
    image: ahatutor-v20-frontend
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${WEB_PORT:-80}:80"
    restart: unless-stopped
COMPOSE_EOF

cp .env.docker.example "$BUILD_DIR/$RELEASE_DIR/.env.example"
cp -r docker "$BUILD_DIR/$RELEASE_DIR/" 2>/dev/null || true

# 创建 data 目录（如果需要预置数据库）
mkdir -p "$BUILD_DIR/$RELEASE_DIR/data"
if [ -f "data/aha_tutor.db" ]; then
    cp data/aha_tutor.db "$BUILD_DIR/$RELEASE_DIR/data/"
fi

echo ""
echo "4. 创建部署脚本..."
cat > "$BUILD_DIR/$RELEASE_DIR/deploy.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash
# AhaTutor v2.0 一键部署脚本

set -e

echo "=== AhaTutor v2.0 部署脚本 ==="
echo ""

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装 Docker，请先安装 Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "错误: 未安装 Docker Compose，请先安装"
    exit 1
fi

# 检查环境配置文件
if [ ! -f ".env" ]; then
    echo "警告: 未找到 .env 文件"
    if [ -f ".env.example" ]; then
        echo "正在从 .env.example 创建 .env..."
        cp .env.example .env
        echo ""
        echo "请编辑 .env 文件，填入以下必需配置："
        echo "  - LLM_API_KEY: 你的 LLM API 密钥"
        echo "  - LLM_BASE_URL: API 端点地址"
        echo "  - ALLOWED_ORIGINS: 允许的前端域名"
        echo ""
        read -p "配置完成后按回车继续..."
    else
        echo "错误: 缺少 .env.example 文件"
        exit 1
    fi
fi

echo "1. 加载 Docker 镜像..."
if [ -f "backend-image.tar" ]; then
    docker load -i backend-image.tar
else
    echo "警告: 未找到 backend-image.tar"
fi

if [ -f "frontend-image.tar" ]; then
    docker load -i frontend-image.tar
else
    echo "警告: 未找到 frontend-image.tar"
fi

echo ""
echo "2. 启动服务..."
docker compose up -d

echo ""
echo "3. 等待服务就绪..."
sleep 5

echo ""
echo "=== 部署完成 ==="
echo ""
echo "服务状态:"
docker compose ps

echo ""
echo "访问地址:"
WEB_PORT=$(grep WEB_PORT .env | cut -d '=' -f2 || echo "80")
echo "  前端: http://localhost:${WEB_PORT}"
echo "  后端: http://localhost:8000"
echo ""
echo "查看日志:"
echo "  docker compose logs -f"
echo ""
echo "停止服务:"
echo "  docker compose down"
DEPLOY_SCRIPT

chmod +x "$BUILD_DIR/$RELEASE_DIR/deploy.sh"

echo ""
echo "5. 创建使用说明..."
cat > "$BUILD_DIR/$RELEASE_DIR/README.md" << 'README'
# AhaTutor v2.0 部署包

## 快速部署

### 1. 环境要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 2. 部署步骤

#### 方式一：自动部署（推荐）
```bash
# 1. 解压部署包
tar -xzf aha-tutor-release.tar.gz
cd aha-tutor-release

# 2. 配置环境变量
cp .env.example .env
nano .env  # 或使用 vi/vim 编辑

# 3. 运行部署脚本
./deploy.sh
```

#### 方式二：手动部署
```bash
# 1. 解压部署包
tar -xzf aha-tutor-release.tar.gz
cd aha-tutor-release

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 加载镜像
docker load -i backend-image.tar
docker load -i frontend-image.tar

# 4. 启动服务
docker compose up -d
```

### 3. 必需配置项

编辑 `.env` 文件，填入以下配置：

```bash
# LLM API 配置（必需）
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://yunwu.ai/v1
LLM_MODEL=gemini-3.1-flash-lite

# 跨域配置（必需）
# 本地测试: http://localhost
# 生产环境: https://your-domain.com
ALLOWED_ORIGINS=http://localhost

# 端口配置（可选）
PORT=8000          # 后端端口
WEB_PORT=80        # 前端端口
```

### 4. 验证部署

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试后端健康检查
curl http://localhost:8000/health

# 访问前端
# 浏览器打开: http://localhost (或你配置的端口)
```

### 5. 常用命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 更新服务（重新加载镜像后）
docker compose up -d --force-recreate
```

### 6. 故障排查

#### 服务无法启动
```bash
# 查看详细日志
docker compose logs

# 检查端口占用
netstat -tlnp | grep -E '(80|8000)'

# 检查 Docker 资源
docker system df
```

#### 数据库问题
```bash
# 进入后端容器
docker compose exec backend bash

# 检查数据库文件
ls -lh /app/data/
```

#### 前端无法访问后端
- 检查 `.env` 中的 `ALLOWED_ORIGINS` 配置
- 确保后端健康检查通过: `curl http://localhost:8000/health`

### 7. 生产环境建议

1. **使用 HTTPS**: 配置 Nginx 反向代理 + SSL 证书
2. **数据备份**: 定期备份 `./data/` 目录
3. **日志管理**: 配置日志轮转，避免磁盘占满
4. **监控**: 使用 `docker stats` 或专业监控工具
5. **安全**:
   - 不要暴露 8000 端口到公网
   - 使用强密码和 API Key
   - 定期更新镜像

### 8. 卸载

```bash
# 停止并删除容器
docker compose down

# 删除镜像（可选）
docker rmi ahatutor-v20-backend ahatutor-v20-frontend

# 删除数据（谨慎！）
rm -rf data/
```

## 技术支持

如有问题，请查看项目文档或提交 Issue。
README

echo ""
echo "6. 打包..."
cd "$BUILD_DIR"
tar -czf aha-tutor-release.tar.gz "$RELEASE_DIR"
mv aha-tutor-release.tar.gz ../

echo ""
echo "=== 构建完成 ==="
echo ""
echo "部署包已生成: aha-tutor-release.tar.gz"
echo "大小: $(du -h ../aha-tutor-release.tar.gz | cut -f1)"
echo ""
echo "部署方法:"
echo "  1. 上传 aha-tutor-release.tar.gz 到服务器"
echo "  2. 解压: tar -xzf aha-tutor-release.tar.gz"
echo "  3. 进入目录: cd aha-tutor-release"
echo "  4. 配置环境: cp .env.example .env && nano .env"
echo "  5. 运行部署: ./deploy.sh"
echo ""

# 清理临时文件
cd ..
rm -rf "$BUILD_DIR"
