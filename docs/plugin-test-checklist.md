# 插件功能测试清单

## 快速验证步骤

### 1. 后端插件加载验证

```bash
# 检查后端健康状态
curl http://localhost:8000/health

# 查看所有插件
curl http://localhost:8000/api/v1/plugins | python -m json.tool

# 启用测试插件
curl -X POST http://localhost:8000/api/v1/plugins/physics-high-school/toggle

# 验证插件已启用
curl http://localhost:8000/api/v1/plugins | grep -A 5 "physics-high-school"
```

### 2. 前端组件注册验证

**访问 Gallery 页面**: `http://localhost:5174/?gallery=1`

**预期结果**:
- 左侧显示组件列表
- 包含 `PhysicsOscillator` 等已启用插件的组件
- 点击组件可在右侧预览

**检查浏览器控制台**:
```javascript
// 查看已注册组件
ComponentRegistry.getInstance().getAll()

// 检查特定组件
ComponentRegistry.getInstance().get('PhysicsOscillator')
```

### 3. A2UI 渲染验证

**方法 1: 通过 Gallery**
1. 访问 `http://localhost:5174/?gallery=1`
2. 选择 `PhysicsOscillator` 组件
3. 观察右侧是否正常渲染简谐运动模拟器
4. 调整滑块参数，观察波形变化

**方法 2: 通过 PBL 学习流程**
1. 访问 `http://localhost:5174`
2. 创建新的 PBL 项目（物理相关）
3. 进入学习模式
4. 观察是否出现 A2UI 组件（如振动模拟器）

### 4. 插件后端调用验证

```bash
# 测试插件后端接口（如果插件有 python_module）
curl -X POST http://localhost:8000/api/v1/plugins/test-invoke/invoke \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "payload": {}}'
```

---

## 常见问题排查

### 问题 1: 插件未显示在 Gallery 中

**可能原因**:
- 插件未启用 → 调用 `/plugins/{id}/toggle` 启用
- 插件 bundle 未构建 → 检查 `plugins/{id}/dist/index.esm.js` 是否存在
- 组件注册失败 → 查看浏览器控制台错误

**排查步骤**:
```bash
# 1. 检查插件是否启用
curl http://localhost:8000/api/v1/plugins | grep -A 2 "physics-high-school"

# 2. 检查 bundle 是否存在
ls -lh plugins/physics-high-school/dist/

# 3. 测试 bundle 是否可访问
curl -I http://localhost:8000/plugins/physics-high-school/dist/index.esm.js
```

### 问题 2: A2UI 组件渲染失败

**可能原因**:
- 共享依赖版本不匹配
- 组件代码错误
- A2UI 消息格式错误

**排查步骤**:
1. 打开浏览器开发者工具 → Console
2. 查找 `[CatalogRegistry]` 开头的日志
3. 检查是否有 `Failed to load bundle` 或 `missing capability export` 错误

### 问题 3: 插件组件交互无响应

**可能原因**:
- 组件内部状态管理问题
- 事件处理器未正确绑定
- Props 传递错误

**排查步骤**:
1. 在 Gallery 中测试组件交互
2. 检查 React DevTools 中的组件 props 和 state
3. 查看控制台是否有 JavaScript 错误

---

## 测试结果记录

### 后端测试

- [ ] 插件加载成功（启动日志显示 "Loaded plugin"）
- [ ] `/api/v1/plugins` 返回插件列表
- [ ] 插件启用/禁用功能正常
- [ ] 静态文件服务正常（`/plugins/{id}/dist/...`）

### 前端测试

- [ ] A2UIProvider 初始化成功
- [ ] 插件组件动态加载成功
- [ ] ComponentRegistry 注册成功
- [ ] Gallery 页面显示组件列表

### 集成测试

- [ ] Gallery 中组件正常渲染
- [ ] 组件交互功能正常（滑块、按钮等）
- [ ] PBL 学习流程中 A2UI 组件正常显示
- [ ] 多个插件同时启用无冲突

---

## 性能检查

### 插件加载时间

```javascript
// 在浏览器控制台执行
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/plugins/'))
  .forEach(r => console.log(`${r.name}: ${r.duration.toFixed(2)}ms`))
```

### 组件渲染性能

使用 React DevTools Profiler 记录组件渲染时间：
1. 打开 React DevTools → Profiler
2. 点击 Record
3. 在 Gallery 中切换组件
4. 停止 Record，查看渲染耗时

---

## 下一步优化建议

1. **自动化测试**: 编写 E2E 测试覆盖插件加载和渲染流程
2. **错误处理**: 增强插件加载失败时的降级策略
3. **性能优化**: 实现插件懒加载，减少初始加载时间
4. **开发体验**: 添加插件热重载支持
5. **文档完善**: 为插件开发者提供详细的开发指南
