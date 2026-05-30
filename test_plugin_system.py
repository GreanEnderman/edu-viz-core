#!/usr/bin/env python3
"""
插件系统集成测试脚本

测试范围:
1. 后端插件加载
2. 插件 API 端点
3. 前端组件注册（通过日志验证）
4. A2UI 渲染准备状态
"""

import asyncio
import json
import sys
from pathlib import Path

import aiohttp


class PluginSystemTester:
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.results = []

    def log(self, test_name: str, passed: bool, message: str = ""):
        status = "✅ PASS" if passed else "❌ FAIL"
        self.results.append((test_name, passed))
        print(f"{status} | {test_name}")
        if message:
            print(f"     {message}")

    async def test_backend_health(self, session: aiohttp.ClientSession) -> bool:
        """测试后端健康状态"""
        try:
            async with session.get(f"{self.backend_url}/health") as resp:
                data = await resp.json()
                passed = resp.status == 200 and data.get("status") == "ok"
                self.log("后端健康检查", passed, f"Status: {data}")
                return passed
        except Exception as e:
            self.log("后端健康检查", False, f"Error: {e}")
            return False

    async def test_plugin_list(self, session: aiohttp.ClientSession) -> list:
        """测试插件列表 API"""
        try:
            async with session.get(f"{self.backend_url}/api/v1/plugins") as resp:
                plugins = await resp.json()
                passed = resp.status == 200 and isinstance(plugins, list)
                self.log(
                    "插件列表 API",
                    passed,
                    f"Total: {len(plugins)}, Enabled: {sum(1 for p in plugins if p['enabled'])}"
                )
                return plugins if passed else []
        except Exception as e:
            self.log("插件列表 API", False, f"Error: {e}")
            return []

    async def test_plugin_structure(self, plugins: list) -> None:
        """验证插件数据结构"""
        if not plugins:
            self.log("插件数据结构", False, "No plugins to validate")
            return

        required_fields = ["id", "name", "version", "subject", "entry", "capabilities"]
        sample = plugins[0]

        missing = [f for f in required_fields if f not in sample]
        passed = len(missing) == 0

        if passed:
            has_js = bool(sample["entry"].get("js"))
            has_caps = len(sample.get("capabilities", [])) > 0
            passed = has_js and has_caps
            msg = f"Sample: {sample['id']}, JS: {has_js}, Capabilities: {len(sample.get('capabilities', []))}"
        else:
            msg = f"Missing fields: {missing}"

        self.log("插件数据结构", passed, msg)

    async def test_plugin_static_files(self, session: aiohttp.ClientSession, plugins: list) -> None:
        """测试插件静态文件访问"""
        if not plugins:
            self.log("插件静态文件", False, "No plugins to test")
            return

        # 测试第一个有 JS 入口的插件
        for plugin in plugins:
            js_entry = plugin["entry"].get("js")
            if js_entry:
                url = f"{self.backend_url}/plugins/{plugin['id']}/{js_entry}"
                try:
                    async with session.head(url) as resp:
                        passed = resp.status == 200
                        size = resp.headers.get("Content-Length", "unknown")
                        self.log(
                            f"静态文件访问 ({plugin['id']})",
                            passed,
                            f"URL: {url}, Size: {size} bytes"
                        )
                        return
                except Exception as e:
                    self.log(f"静态文件访问 ({plugin['id']})", False, f"Error: {e}")
                    return

        self.log("插件静态文件", False, "No plugins with JS entry found")

    async def test_plugin_toggle(self, session: aiohttp.ClientSession, plugin_id: str) -> None:
        """测试插件启用/禁用"""
        try:
            # 获取当前状态
            async with session.get(f"{self.backend_url}/api/v1/plugins") as resp:
                plugins = await resp.json()
                plugin = next((p for p in plugins if p["id"] == plugin_id), None)

                if not plugin:
                    self.log("插件切换功能", False, f"Plugin {plugin_id} not found")
                    return

                initial_state = plugin["enabled"]

            # 切换状态
            async with session.post(
                f"{self.backend_url}/api/v1/plugins/{plugin_id}/toggle"
            ) as resp:
                result = await resp.json()
                new_state = result.get("enabled")

                passed = resp.status == 200 and new_state != initial_state
                self.log(
                    "插件切换功能",
                    passed,
                    f"{plugin_id}: {initial_state} → {new_state}"
                )

        except Exception as e:
            self.log("插件切换功能", False, f"Error: {e}")

    async def test_plugin_capabilities(self, plugins: list) -> None:
        """验证插件能力声明"""
        if not plugins:
            self.log("插件能力声明", False, "No plugins to validate")
            return

        total_caps = 0
        valid_caps = 0

        for plugin in plugins:
            for cap in plugin.get("capabilities", []):
                total_caps += 1
                if all(k in cap for k in ["component_id", "name", "tags"]):
                    valid_caps += 1

        passed = total_caps > 0 and valid_caps == total_caps
        self.log(
            "插件能力声明",
            passed,
            f"Total capabilities: {total_caps}, Valid: {valid_caps}"
        )

    async def test_shared_dependencies(self, plugins: list) -> None:
        """验证共享依赖声明"""
        if not plugins:
            self.log("共享依赖声明", False, "No plugins to validate")
            return

        supported = {"react", "react-dom", "react/jsx-runtime", "@a2ui/react"}
        issues = []

        for plugin in plugins:
            deps = set(plugin.get("sharedDependencies", []))
            unsupported = deps - supported
            if unsupported:
                issues.append(f"{plugin['id']}: {unsupported}")

        passed = len(issues) == 0
        msg = "All dependencies supported" if passed else f"Issues: {issues}"
        self.log("共享依赖声明", passed, msg)

    def print_summary(self) -> None:
        """打印测试摘要"""
        print("\n" + "=" * 60)
        print("测试摘要")
        print("=" * 60)

        total = len(self.results)
        passed = sum(1 for _, p in self.results if p)
        failed = total - passed

        print(f"总计: {total} | 通过: {passed} | 失败: {failed}")
        print(f"通过率: {passed/total*100:.1f}%")

        if failed > 0:
            print("\n失败的测试:")
            for name, p in self.results:
                if not p:
                    print(f"  - {name}")

        print("=" * 60)

    async def run_all_tests(self) -> bool:
        """运行所有测试"""
        print("开始插件系统集成测试...\n")

        async with aiohttp.ClientSession() as session:
            # 1. 后端健康检查
            if not await self.test_backend_health(session):
                print("\n❌ 后端服务未运行，终止测试")
                return False

            # 2. 插件列表
            plugins = await self.test_plugin_list(session)

            # 3. 插件数据结构
            await self.test_plugin_structure(plugins)

            # 4. 插件能力声明
            await self.test_plugin_capabilities(plugins)

            # 5. 共享依赖
            await self.test_shared_dependencies(plugins)

            # 6. 静态文件访问
            await self.test_plugin_static_files(session, plugins)

            # 7. 插件切换功能（使用第一个插件测试）
            if plugins:
                await self.test_plugin_toggle(session, plugins[0]["id"])

        # 打印摘要
        self.print_summary()

        # 返回是否所有测试通过
        return all(p for _, p in self.results)


async def main():
    tester = PluginSystemTester()
    success = await tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
