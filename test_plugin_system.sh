#!/usr/bin/env bash
# 插件系统快速测试脚本（使用 curl）

set -e

BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5174"

echo "=========================================="
echo "插件系统集成测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_pass() {
    echo -e "${GREEN}✅ PASS${NC} | $1"
    ((pass_count++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC} | $1"
    echo "     $2"
    ((fail_count++))
}

# 测试 1: 后端健康检查
echo "测试 1: 后端健康检查"
if curl -s "$BACKEND_URL/health" | grep -q '"status":"ok"'; then
    test_pass "后端健康检查"
else
    test_fail "后端健康检查" "后端服务未响应"
    exit 1
fi

# 测试 2: 插件列表 API
echo ""
echo "测试 2: 插件列表 API"
plugins_json=$(curl -s "$BACKEND_URL/api/v1/plugins")
if echo "$plugins_json" | python -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
    plugin_count=$(echo "$plugins_json" | python -c "import sys, json; print(len(json.load(sys.stdin)))")
    enabled_count=$(echo "$plugins_json" | python -c "import sys, json; print(sum(1 for p in json.load(sys.stdin) if p['enabled']))")
    test_pass "插件列表 API (总数: $plugin_count, 已启用: $enabled_count)"
else
    test_fail "插件列表 API" "返回数据格式错误"
fi

# 测试 3: 插件数据结构
echo ""
echo "测试 3: 插件数据结构"
if echo "$plugins_json" | python -c "
import sys, json
plugins = json.load(sys.stdin)
if not plugins:
    sys.exit(1)
p = plugins[0]
required = ['id', 'name', 'version', 'subject', 'entry', 'capabilities']
if all(k in p for k in required):
    print(f\"Sample: {p['id']}, Capabilities: {len(p['capabilities'])}\")
    sys.exit(0)
else:
    sys.exit(1)
" 2>/dev/null; then
    test_pass "插件数据结构"
else
    test_fail "插件数据结构" "缺少必需字段"
fi

# 测试 4: 插件静态文件访问
echo ""
echo "测试 4: 插件静态文件访问"
first_plugin=$(echo "$plugins_json" | python -c "
import sys, json
plugins = json.load(sys.stdin)
for p in plugins:
    if p['entry'].get('js'):
        print(f\"{p['id']}|{p['entry']['js']}\")
        break
")

if [ -n "$first_plugin" ]; then
    plugin_id=$(echo "$first_plugin" | cut -d'|' -f1)
    js_entry=$(echo "$first_plugin" | cut -d'|' -f2)
    static_url="$BACKEND_URL/plugins/$plugin_id/$js_entry"

    if curl -s -I "$static_url" | head -1 | grep -q "200"; then
        file_size=$(curl -s -I "$static_url" | grep -i content-length | awk '{print $2}' | tr -d '\r')
        test_pass "插件静态文件访问 ($plugin_id, ${file_size}bytes)"
    else
        test_fail "插件静态文件访问" "无法访问 $static_url"
    fi
else
    test_fail "插件静态文件访问" "没有找到带 JS 入口的插件"
fi

# 测试 5: 插件能力声明
echo ""
echo "测试 5: 插件能力声明"
if echo "$plugins_json" | python -c "
import sys, json
plugins = json.load(sys.stdin)
total = sum(len(p.get('capabilities', [])) for p in plugins)
valid = sum(1 for p in plugins for c in p.get('capabilities', [])
            if all(k in c for k in ['component_id', 'name', 'tags']))
print(f'Total: {total}, Valid: {valid}')
sys.exit(0 if total > 0 and total == valid else 1)
" 2>/dev/null; then
    test_pass "插件能力声明"
else
    test_fail "插件能力声明" "能力声明格式错误"
fi

# 测试 6: 共享依赖验证
echo ""
echo "测试 6: 共享依赖验证"
if echo "$plugins_json" | python -c "
import sys, json
plugins = json.load(sys.stdin)
supported = {'react', 'react-dom', 'react/jsx-runtime', '@a2ui/react'}
issues = []
for p in plugins:
    deps = set(p.get('sharedDependencies', []))
    unsupported = deps - supported
    if unsupported:
        issues.append(f\"{p['id']}: {unsupported}\")
if issues:
    print('Issues:', issues)
    sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
    test_pass "共享依赖验证"
else
    test_fail "共享依赖验证" "存在不支持的依赖"
fi

# 测试 7: 前端服务检查
echo ""
echo "测试 7: 前端服务检查"
if curl -s "$FRONTEND_URL" | grep -q "<title>"; then
    test_pass "前端服务运行"
else
    test_fail "前端服务运行" "前端服务未响应"
fi

# 测试 8: Gallery 页面检查
echo ""
echo "测试 8: Gallery 页面访问"
if curl -s "$FRONTEND_URL/?gallery=1" | grep -q "<title>"; then
    test_pass "Gallery 页面访问"
else
    test_fail "Gallery 页面访问" "Gallery 页面无法访问"
fi

# 打印摘要
echo ""
echo "=========================================="
echo "测试摘要"
echo "=========================================="
total=$((pass_count + fail_count))
pass_rate=$(python -c "print(f'{$pass_count/$total*100:.1f}')")
echo "总计: $total | 通过: $pass_count | 失败: $fail_count"
echo "通过率: ${pass_rate}%"
echo "=========================================="

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败${NC}"
    exit 1
fi
