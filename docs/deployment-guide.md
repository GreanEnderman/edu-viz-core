# 部署包构建与使用指南

本文档说明如何构建和使用 AhaTutor v2.0 的开箱即用部署包。

## 构建部署包

### Windows 用户

双击运行 `scripts/build-release.bat`，或在项目根目录执行：

```cmd
scripts\build-release.bat
```

### Linux/Mac 用户

在项目根目录执行：

```bash
chmod +x scripts/build-release.sh
./scripts/build-release.sh
```

### 构建产物

脚本会自动完成以下操作：

1. **构建 Docker 镜像**（backend + frontend）
2. **导出镜像为 tar 文件**（离线可用）
3. **打包配置文件**（docker-compose.yml、nginx.conf 等）
4. **生成部署脚本**（deploy.sh / deploy.bat）
5. **创建使用文档**（README.md）
6. **压缩为发布包**：
   - `aha-tutor-release.tar.gz`（Linux/Mac）
   - `aha-tutor-release.zip`（Windows，需要 7z）

**预计大小**：约 1-2 GB（包含完整的 Docker 镜像）

---

## 部署到服务器

### 1. 上传部署包

将生成的 `aha-tutor-release.tar.gz` 上传到服务器：

```bash
# 使用 scp
scp aha-tutor-release.tar.gz user@server:/path/to/deploy/

# 或使用 rsync
rsync -avz aha-tutor-release.tar.gz user@server:/path/to/deploy/
```

### 2. 解压

```bash
tar -xzf aha-tutor-release.tar.gz
cd aha-tutor-release
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env  # 或使用 vi/vim
```

**必需配置项**：

```bash
# LLM API 配置
LLM_API_KEY=your-actual-api-key-here
LLM_BASE_URL=https://yunwu.ai/v1
LLM_MODEL=gemini-3.1-flash-lite

# 跨域配置（重要！）
# 本地测试: http://localhost
# 生产环境: https://your-domain.com 或 http://your-server-ip
ALLOWED_ORIGINS=http://localhost

# 端口配置（可选）
PORT=8000          # 后端端口
WEB_PORT=80        # 前端端口（需要 root 权限，或改为 8080）
```

### 4. 一键部署

**Linux/Mac**：
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows**：
```cmd
deploy.bat
```

部署脚本会自动：
- 加载 Docker 镜像
- 启动服务容器
- 显示服务状态

### 5. 验证部署

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试后端
curl http://localhost:8000/health

# 访问前端
# 浏览器打开: http://localhost 或 http://your-server-ip
```

---

## 服务器环境要求

### 最低配置
- **CPU**: 2 核
- **内存**: 2 GB
- **磁盘**: 5 GB 可用空间
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+) / Windows Server 2019+

### 必需软件
- **Docker**: 20.10 或更高版本
- **Docker Compose**: 2.0 或更高版本

### 安装 Docker（如果未安装）

**Ubuntu/Debian**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**CentOS/RHEL**:
```bash
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

**安装 Docker Compose**:
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 常用运维命令

### 服务管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重启单个服务
docker compose restart backend
docker compose restart frontend
```

### 日志查看

```bash
# 查看所有日志
docker compose logs -f

# 查看后端日志
docker compose logs -f backend

# 查看最近 100 行
docker compose logs --tail=100 backend
```

### 数据备份

```bash
# 备份数据库
cp -r data/ backup-$(date +%Y%m%d)/

# 或使用 tar 压缩
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

### 更新部署

如果有新版本的部署包：

```bash
# 1. 停止服务
docker compose down

# 2. 备份数据
cp -r data/ data.backup

# 3. 加载新镜像
docker load -i new-backend-image.tar
docker load -i new-frontend-image.tar

# 4. 启动服务
docker compose up -d --force-recreate
```

---

## 生产环境建议

### 1. 使用反向代理（Nginx）

在服务器上安装 Nginx，配置 HTTPS：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 配置防火墙

```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 不要暴露 8000 端口到公网
```

### 3. 设置自动重启

编辑 `docker-compose.yml`，确保有：

```yaml
services:
  backend:
    restart: unless-stopped
  frontend:
    restart: unless-stopped
```

### 4. 日志轮转

创建 `/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker：
```bash
sudo systemctl restart docker
```

### 5. 监控

```bash
# 查看资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a
```

---

## 故障排查

### 问题 1: 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep -E '(80|8000)'

# 修改 .env 中的端口配置
WEB_PORT=8080
PORT=8001
```

### 问题 2: 前端无法访问后端

检查 `.env` 中的 `ALLOWED_ORIGINS` 配置：

```bash
# 如果前端域名是 https://example.com
ALLOWED_ORIGINS=https://example.com

# 多个域名用逗号分隔
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

### 问题 3: 数据库文件权限问题

```bash
# 进入后端容器
docker compose exec backend bash

# 检查权限
ls -lh /app/data/

# 修复权限（在宿主机执行）
sudo chown -R 1000:1000 data/
```

### 问题 4: 内存不足

```bash
# 查看内存使用
free -h

# 限制容器内存（编辑 docker-compose.yml）
services:
  backend:
    mem_limit: 1g
```

---

## 卸载

```bash
# 1. 停止并删除容器
docker compose down

# 2. 删除镜像
docker rmi ahatutor-v20-backend ahatutor-v20-frontend

# 3. 删除数据（谨慎！会丢失所有数据）
rm -rf data/

# 4. 删除部署目录
cd ..
rm -rf aha-tutor-release/
```

---

## 技术支持

如有问题，请：
1. 查看日志：`docker compose logs -f`
2. 检查配置：确保 `.env` 文件配置正确
3. 查看项目文档或提交 Issue
